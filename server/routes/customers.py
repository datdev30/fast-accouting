from fastapi import APIRouter, HTTPException, status
from typing import List
from models import Customer, Transaction
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class CustomerCreate(BaseModel):
    name: str
    contact_info: str | None = None

class CustomerUpdate(BaseModel):
    name: str | None = None
    contact_info: str | None = None

from pydantic import BaseModel, Field

class CustomerWithStatus(BaseModel):
    id: str = Field(alias="_id")
    name: str
    contact_info: str | None = None
    created_at: datetime
    is_paid_in_full: bool = False
    has_history: bool = False
    
    class Config:
        populate_by_name = True

@router.get("", response_model=List[CustomerWithStatus])
async def get_customers():
    customers = await Customer.find_all().to_list()
    transactions = await Transaction.find_all().to_list()
    
    # Map customer_id -> transactions
    tx_map = {}
    for tx in transactions:
        cid = tx.customer_id
        if cid not in tx_map: tx_map[cid] = []
        tx_map[cid].append(tx)
        
    results = []
    for c in customers:
        c_txs = tx_map.get(c.id, [])
        has_history = len(c_txs) > 0
        has_open_debt = any(tx.status == "OPEN" for tx in c_txs)
        is_paid_in_full = has_history and not has_open_debt
        
        results.append(CustomerWithStatus(
            _id=c.id, # Pass to alias directly if populate_by_name is tricky, or just id=c.id with config
            id=c.id,
            name=c.name,
            contact_info=c.contact_info,
            created_at=c.created_at,
            is_paid_in_full=is_paid_in_full,
            has_history=has_history
        ))
        
    return results

from utils import get_next_id

@router.post("", response_model=Customer, status_code=status.HTTP_201_CREATED)
async def create_customer(customer: CustomerCreate):
    new_id = await get_next_id("customer")
    new_customer = Customer(
        id=new_id,
        name=customer.name,
        contact_info=customer.contact_info
    )
    await new_customer.insert()
    return new_customer

@router.get("/{id}", response_model=Customer)
async def get_customer(id: str):
    customer = await Customer.get(id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.patch("/{id}", response_model=Customer)
async def update_customer(id: str, diff: CustomerUpdate):
    customer = await Customer.get(id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = diff.model_dump(exclude_unset=True)
    if update_data:
        await customer.set(update_data)
    
    return customer

    await customer.delete()

class DeleteSecureRequest(BaseModel):
    id: str
    pin: str

@router.post("/delete-secure")
async def delete_customer_secure(req: DeleteSecureRequest):
    from utils import verify_admin_pin
    await verify_admin_pin(req.pin)
    
    customer = await Customer.get(req.id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    # Cascade Delete Transactions
    await Transaction.find(Transaction.customer_id == req.id).delete()
    
    await customer.delete()
    return {"message": "Đã xóa khách hàng và toàn bộ dữ liệu liên quan"}
