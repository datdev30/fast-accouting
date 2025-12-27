from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from models import Transaction, Customer, InterestConfig, TransactionType
from pydantic import BaseModel
from datetime import datetime, timezone
import math

router = APIRouter()

class TransactionCreate(BaseModel):
    customer_id: str
    type: str # InterestConfig code
    amount: float
    content: str
    transaction_date: datetime | None = None

class TransactionResponse(BaseModel):
    id: str | None = None # Beanie ID is PydanticObjectId, usually handled automatically, but for response model we can use str or let Beanie handle it.
    # Using alias for id to be compatible with frontend if needed, but Beanie uses _id. 
    # Let's trust Beanie to serialize Document using standard Pydantic.
    # We will return the Document directly.
    pass

@router.post("", response_model=Transaction, status_code=status.HTTP_201_CREATED)
async def create_transaction(tx: TransactionCreate):
    # Validate Customer
    customer = await Customer.get(tx.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Validate Interest Type & Snapshot Rate
    interest_config = await InterestConfig.find_one(InterestConfig.code == tx.type)
    if not interest_config:
        raise HTTPException(status_code=404, detail="Invalid transaction type")
    
    rate_snapshot = interest_config.rate_per_month
    
    from utils import get_next_id
    new_id = await get_next_id("transaction")
    
    new_tx = Transaction(
        id=new_id,
        customer_id=customer.id, # Now storing ID directly
        type=tx.type,
        amount=tx.amount,
        content=tx.content,
        transaction_date=tx.transaction_date or datetime.now(),
        interest_rate_snapshot=rate_snapshot
    )
    await new_tx.insert()
    return new_tx

@router.get("", response_model=List[dict])
async def get_transactions(
    customer_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    # Override response model to include calculated fields
    # We will return a dict with extra info
    
    # Remove fetch_links=True to avoid Motor/Beanie aggregation error
    query = Transaction.find_all()
    if customer_id:
        query = Transaction.find(Transaction.customer_id == customer_id)
    
    # Date Filtering
    if start_date:
        query = query.find(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.find(Transaction.transaction_date <= end_date)
        
    txs = await query.sort("-transaction_date").to_list()
    
    # Manual Join to get Customer Names
    # Collect IDs
    cust_ids = set()
    for tx in txs:
        if tx.customer_id:
            cust_ids.add(tx.customer_id)
            
    # Fetch Customers
    customers = []
    if cust_ids:
        # Use Beanie's In operator or pymongo style
        from beanie.operators import In
        customers = await Customer.find(In(Customer.id, list(cust_ids))).to_list()
        
    cust_map = {c.id: c for c in customers}
    
    results = []
    now = datetime.now()
    
    from utils import calculate_interest_amount
    
    for tx in txs:
        tx_dict = tx.model_dump()
        tx_dict["_id"] = str(tx.id) # Serialize ID
        
        tx_dict["customer"] = tx.customer_id
        
        # Inject customer name for frontend convenience
        if tx.customer_id and tx.customer_id in cust_map:
            tx_dict["customer_name"] = cust_map[tx.customer_id].name
        else:
            tx_dict["customer_name"] = "Unknown"

        # Calculate interest info
        if tx.status == "OPEN":
            calc = calculate_interest_amount(
                principal=tx.amount,
                rate_per_month=tx.interest_rate_snapshot,
                start_date=tx.transaction_date,
                end_date=now
            )
            tx_dict["interest_calculation"] = calc
        elif tx.status == "PAID":
             # Use Hard Saved values
             tx_dict["interest_calculation"] = {
                 "months": tx.final_months if tx.final_months is not None else 0.0,
                 "rounded_interest": tx.final_interest if tx.final_interest is not None else 0.0,
                 # We can reconstruct other fields if needed, but these are the main ones used by frontend
             }
        else:
             tx_dict["interest_calculation"] = None
             
        results.append(tx_dict)
        
    return results

class TransactionUpdate(BaseModel):
    customer_id: Optional[str] = None
    type: Optional[str] = None
    amount: Optional[float] = None
    content: Optional[str] = None
    transaction_date: Optional[datetime] = None
    status: Optional[str] = None # OPEN, PAID
    closed_at: Optional[datetime] = None # Custom payment date

@router.patch("/{id}", response_model=Transaction)
async def update_transaction(id: str, update_data: TransactionUpdate):
    tx = await Transaction.get(id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    # Prepare update dict, filtering out None
    data = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not data:
        return tx

    # If modifying sensitive fields that affect interest, re-validate
    # Track if we need to recalculate
    needs_recalc = False
    
    if "type" in data:
         interest_config = await InterestConfig.find_one(InterestConfig.code == data["type"])
         if not interest_config:
             raise HTTPException(status_code=404, detail="Invalid transaction type")
         tx.type = data["type"]
         tx.interest_rate_snapshot = interest_config.rate_per_month
         needs_recalc = True
         
    if "customer_id" in data:
        customer = await Customer.get(data["customer_id"])
        if not customer:
             raise HTTPException(status_code=404, detail="Customer not found")
        tx.customer_id = data["customer_id"]

    if "amount" in data:
        tx.amount = data["amount"]
        needs_recalc = True
        
    if "content" in data:
        tx.content = data["content"]
        
    if "transaction_date" in data:
        tx.transaction_date = data["transaction_date"]
        needs_recalc = True

    # determine status change
    new_status = data.get("status", tx.status)
    status_changed = new_status != tx.status
    
    if "closed_at" in data:
        needs_recalc = True
        
    # LOGIC:
    # 1. If switching to OPEN -> Clear final fields
    # 2. If switching to PAID -> Calc and Set final fields
    # 3. If ALREADY PAID and needs_recalc (amount/date/rate changed) -> Re-Calc and Update final fields
    
    if new_status == "OPEN":
        if status_changed:
            tx.status = "OPEN"
            tx.closed_at = None
            tx.final_interest = None
            tx.final_months = None
            tx.final_total = None
            
    elif new_status == "PAID":
        # Resolve Payment Date
        # If provided in data, use it.
        # If not provided, but existing tx has it (and we are not just switching status), keep it.
        # If switching status to PAID and no date provided, use NOW.
        
        target_payment_date = None
        
        if "closed_at" in data and data["closed_at"]:
            target_payment_date = data["closed_at"]
        elif tx.closed_at:
            target_payment_date = tx.closed_at
        else:
            target_payment_date = datetime.now()
            
        # If we are switching OPEN -> PAID, we definitely need calc.
        # If we are already PAID, we only calc if needs_recalc is True OR if we just want to be safe (always calc on save doesn't hurt)
        
        # To be safe and satisfy user request: ALWAYS calculate if status is PAID, ensuring consistency
        from utils import calculate_interest_amount
        calc = calculate_interest_amount(
            principal=tx.amount, 
            rate_per_month=tx.interest_rate_snapshot,
            start_date=tx.transaction_date,
            end_date=target_payment_date
        )
        
        tx.status = "PAID"
        tx.closed_at = target_payment_date
        tx.final_interest = calc["rounded_interest"]
        tx.final_months = calc["months"]
        tx.final_total = tx.amount + calc["rounded_interest"]
            
    await tx.save()
    return tx
    
class BulkPayRequest(BaseModel):
    customer_id: str
    payment_date: datetime # Timezone aware? Frontend sends ISO
    pin: str

@router.post("/bulk-pay")
async def bulk_pay(req: BulkPayRequest):
    # 1. Verify PIN
    import hashlib
    # Assumption: Single admin user or check current context user.
    # Since we don't have dependency injection for current user here yet easily accessable without auth header extraction logic duplicated,
    # and req doesn't carry token (or does it? Headers).
    # Ideally should use Depends(get_current_user).
    # For now, let's look up 'admin' user since user said "PIN verified against Admin DB".
    from models import User
    
    # Check admin specifically or find ANY user with this PIN? 
    # "Mã PIN gồm 4 số, sẽ cài thẳng vào db của admin" -> Verify against 'admin' user.
    admin = await User.find_one(User.username == "admin")
    if not admin or not admin.pin_hash:
        raise HTTPException(status_code=400, detail="Admin PIN not configured")
        
    hashed_pin = hashlib.md5(req.pin.encode()).hexdigest()
    if admin.pin_hash != hashed_pin:
        raise HTTPException(status_code=401, detail="Sai mã PIN")
        
    # 2. Find OPEN transactions
    txs = await Transaction.find(
        Transaction.customer_id == req.customer_id,
        Transaction.status == "OPEN"
    ).to_list()
    
    if not txs:
        return {"message": "Không có giao dịch nào cần thanh toán", "count": 0}
        
    # 3. Update them
    count = 0
    from utils import calculate_interest_amount
    
    for tx in txs:
        # Calculate interest based on payment_date
        calc = calculate_interest_amount(
            principal=tx.amount, 
            rate_per_month=tx.interest_rate_snapshot,
            start_date=tx.transaction_date,
            end_date=req.payment_date
        )
        
        tx.status = "PAID"
        tx.closed_at = req.payment_date
        tx.final_interest = calc["rounded_interest"]
        tx.final_months = calc["months"]
        tx.final_total = tx.amount + calc["rounded_interest"]
        
        await tx.save()
        count += 1
        
    return {"message": "Thanh toán thành công", "count": count}

# --- Reporting Logic ---

class DebtReportItem(BaseModel):
    customer_id: str
    customer_name: str
    total_principal: float
    total_interest: float
    total_debt: float
    total_collected: float
    transaction_count: int

@router.get("/reports/debt", response_model=List[DebtReportItem])
async def get_debt_report():
    customers = await Customer.find_all().to_list()
    reports = []
    
    now = datetime.now()
    from utils import calculate_interest_amount
    
    for customer in customers:
        transactions = await Transaction.find(Transaction.customer_id == customer.id).to_list()
        
        lifetime_principal = 0.0
        lifetime_interest = 0.0
        collected = 0.0
        count = 0
        
        for tx in transactions:
            # 1. Lifetime Accumulation (ALL Transactions)
            principal = tx.amount
            if principal is None: principal = 0.0 # Safety
            
            interest = 0.0
            
            if tx.status == "OPEN":
                calc = calculate_interest_amount(
                    principal=principal,
                    rate_per_month=tx.interest_rate_snapshot,
                    start_date=tx.transaction_date,
                    end_date=now
                )
                interest = calc['rounded_interest']
            elif tx.status == "PAID":
                # Use saved final interest
                interest = tx.final_interest if tx.final_interest is not None else 0.0
                
                # Add to Collected
                # Logic: Collected = Final Total (or Amount + Interest)
                val = tx.final_total if tx.final_total is not None else (principal + interest)
                collected += val

            lifetime_principal += principal
            lifetime_interest += interest
            count += 1

        # 2. Strict Formulas
        total_payment = lifetime_principal + lifetime_interest
        total_remaining = total_payment - collected # Logic: Total - Paid = Remaining
        
        reports.append(DebtReportItem(
            customer_id=str(customer.id),
            customer_name=customer.name,
            total_principal=round(lifetime_principal, 2),
            total_interest=round(lifetime_interest, 2),
            total_debt=round(total_remaining, 2), # Remaining/Receivables
            total_collected=round(collected, 2),
            transaction_count=count
        ))
        
    return reports

class DeleteSecureRequest(BaseModel):
    id: str
    pin: str

@router.post("/delete-secure")
async def delete_transaction_secure(req: DeleteSecureRequest):
    from utils import verify_admin_pin
    await verify_admin_pin(req.pin)
    
    tx = await Transaction.get(req.id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    await tx.delete()
    return {"message": "Đã xóa giao dịch"}
