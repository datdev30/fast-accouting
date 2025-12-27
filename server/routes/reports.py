from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from fpdf import FPDF
from models import Customer, Transaction
from datetime import datetime
from utils import calculate_interest_amount, read_money, remove_accents

import io
import os

router = APIRouter()

class PDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            # Logo or Title
            self.set_font('TimesNewRoman', 'B', 16)
            self.cell(0, 10, 'ĐẠI LÝ CÔNG PHÚ', border=False, new_x="LMARGIN", new_y="NEXT", align='C')
            
            self.set_font('TimesNewRoman', '', 12)
            self.cell(0, 6, 'Thôn Đắk Kual 2, xã Đức An, tỉnh Lâm Đồng', new_x="LMARGIN", new_y="NEXT", align='C')
            
            # Phone with icon simulation (just text for standard PDF)
            self.set_font('TimesNewRoman', 'B', 11)
            self.cell(0, 6, '0342.789.046 — 0367.973.948', new_x="LMARGIN", new_y="NEXT", align='C')
            
            # Divider
            self.ln(2)
            x = self.get_x()
            y = self.get_y()
            # Draw line centered, width ~1/3 of page (A4 width 210mm)
            self.line(70, y, 140, y) 
            self.ln(5)
            
            self.set_font('TimesNewRoman', 'B', 16)
            self.cell(0, 10, 'PHIẾU THANH TOÁN CÔNG NỢ', border=False, new_x="LMARGIN", new_y="NEXT", align='C')
            self.ln(5)


    def footer(self):
        self.set_y(-15)
        self.set_font('TimesNewRoman', 'I', 10)
        self.cell(0, 10, f'Trang {self.page_no()}/{{nb}}', align='C')

def create_pdf_bytes(customer, transactions):
    pdf = PDF()
    
    # Add Fonts (Unicode)
    # Using the files we copied to server/fonts
    base_font_dir = os.path.join(os.path.dirname(__file__), '..', 'fonts')
    pdf.add_font('TimesNewRoman', '', os.path.join(base_font_dir, 'times.ttf'))
    pdf.add_font('TimesNewRoman', 'B', os.path.join(base_font_dir, 'timesbd.ttf'))
    pdf.add_font('TimesNewRoman', 'I', os.path.join(base_font_dir, 'timesi.ttf'))
    pdf.add_font('TimesNewRoman', 'BI', os.path.join(base_font_dir, 'timesbi.ttf'))
    
    pdf.add_page()
    now = datetime.now()
        
    # Helper for Money
    def fmt_money(val):
        return f"{val:,.0f}".replace(",", ".")
        
    # Customer Info
    pdf.set_font("TimesNewRoman", 'B', 11)
    pdf.cell(30, 8, "Tên khách hàng:", align='L')
    pdf.set_font("TimesNewRoman", '', 11)
    pdf.cell(0, 8, f"{customer.name}", new_x="LMARGIN", new_y="NEXT", align='L')
    
    pdf.set_font("TimesNewRoman", 'B', 11)
    pdf.cell(30, 8, "Ngày giờ:", align='L')
    pdf.set_font("TimesNewRoman", '', 11)
    pdf.cell(0, 8, f"{datetime.now().strftime('%H:%M %d/%m/%Y')}", new_x="LMARGIN", new_y="NEXT", align='L')
    pdf.ln(5)
    
    # Pre-calculate groups
    groups = {}
    for tx in transactions:
        if tx.status != "OPEN": continue
        month_key = tx.transaction_date.strftime("%m/%Y")
        if month_key not in groups: groups[month_key] = []
        groups[month_key].append(tx)
        
    global_principal = 0.0
    global_interest = 0.0
    
    if not groups:
        pdf.set_font("TimesNewRoman", 'I', 11)
        pdf.cell(0, 10, "Không có giao dịch nợ nào.", new_x="LMARGIN", new_y="NEXT", align='C')
    
    # Draw Month Containers
    for month, txs in groups.items():
        if not txs: continue
        
        # Container Header
        pdf.set_font("TimesNewRoman", 'B', 11)
        pdf.cell(0, 8, f"Tháng: {month}", new_x="LMARGIN", new_y="NEXT")
        
        # Table Header
        pdf.set_fill_color(241, 245, 249) # slate-100
        pdf.set_font("TimesNewRoman", 'B', 10)
        headers = ["Ngày", "Nội dung", "Tiền gốc", "Lãi", "TG", "Tiền lãi", "Tổng cộng"]
        # Adjusted widths to match A4 (approx 190mm usable)
        # 0:Date, 1:Content, 2:Principal, 3:Rate, 4:Time, 5:Interest, 6:Total
        widths = [22, 63, 25, 12, 13, 25, 30] # Sum = 190
        
        for i, h in enumerate(headers):
            pdf.cell(widths[i], 7, h, border=1, align='C', fill=True)
        pdf.ln()
        
        pdf.set_font("TimesNewRoman", '', 10)
        
        month_principal = 0.0
        month_interest = 0.0
        
        for tx in txs:
            calc = calculate_interest_amount(
                principal=tx.amount,
                rate_per_month=tx.interest_rate_snapshot,
                start_date=tx.transaction_date,
                end_date=now
            )
            interest = calc['rounded_interest']
            total = tx.amount + interest
            
            month_principal += tx.amount
            month_interest += interest
            
            # Prepare content
            # No safe_text needed for Unicode font, just string conversion
            content = str(tx.content) if tx.content else ""
            
            # Calculate row height based on content lines
            lines = pdf.multi_cell(widths[1], 6, content, split_only=True)
            n_lines = len(lines) if lines else 1
            row_height = 6 * n_lines
            
            # Check for page break
            if pdf.get_y() + row_height > 275: 
                pdf.add_page()
                # Re-print headers
                pdf.set_font("TimesNewRoman", 'B', 10)
                pdf.set_fill_color(241, 245, 249)
                for i, h in enumerate(headers):
                    pdf.cell(widths[i], 7, h, border=1, align='C', fill=True)
                pdf.ln()
                pdf.set_font("TimesNewRoman", '', 10)
            
            # Save top Y position
            y_start = pdf.get_y()
            x_start = pdf.get_x() 
            
            # Draw cells
            # 0: Date
            pdf.cell(widths[0], row_height, tx.transaction_date.strftime("%d/%m/%Y"), border=1, align='C')
            
            # 1: Content (MultiLine)
            x_content = pdf.get_x()
            y_content = pdf.get_y()
            pdf.multi_cell(widths[1], 6, content, border=1, align='L')
            pdf.set_xy(x_content + widths[1], y_content)
            
            # 2: Amount
            pdf.cell(widths[2], row_height, fmt_money(tx.amount), border=1, align='R')
            
            # 3: Rate
            pdf.cell(widths[3], row_height, f"{tx.interest_rate_snapshot}", border=1, align='C')
            
            # 4: Time
            pdf.cell(widths[4], row_height, f"{calc['months']:.1f}", border=1, align='C')
            
            # 5: Interest
            pdf.cell(widths[5], row_height, fmt_money(interest), border=1, align='R')
            
            # 6: Total
            pdf.cell(widths[6], row_height, fmt_money(total), border=1, align='R')
            
            # Move to next line
            pdf.ln()
            # Ensure Y is correct
            pdf.set_y(y_start + row_height)
            
        # Month Total Row
        pdf.set_font("TimesNewRoman", 'B', 10)
        pdf.set_fill_color(255, 255, 255) # White bg
        # "Tổng Tháng" spans Date + Content = widths[0] + widths[1]
        pdf.cell(widths[0] + widths[1], 7, "Tổng Tháng", border=1, align='R', fill=True)
        pdf.cell(widths[2], 7, fmt_money(month_principal), border=1, align='R', fill=True)
        pdf.cell(widths[3] + widths[4], 7, "", border=1, fill=True)
        pdf.cell(widths[5], 7, fmt_money(month_interest), border=1, align='R', fill=True)
        pdf.cell(widths[6], 7, fmt_money(month_principal + month_interest), border=1, align='R', fill=True)
        pdf.ln(10) 
        
        global_principal += month_principal
        global_interest += month_interest

    # Grand Totals
    # Keep on same page if possible
    if pdf.get_y() > 220: pdf.add_page()
    
    pdf.ln(5)
    pdf.set_font("TimesNewRoman", 'B', 11)
    
    # 3-row layout for totals
    w_label = 110
    w_val = 50
    
    # Principal
    pdf.cell(w_label, 8, "Tổng tiền nợ gốc:", border=0, align='L')
    pdf.cell(w_val, 8, f"{fmt_money(global_principal)} đ", border=0, align='R', new_x="LMARGIN", new_y="NEXT")
    
    # Interest
    pdf.cell(w_label, 8, "Tổng tiền lãi:", border=0, align='L')
    pdf.cell(w_val, 8, f"{fmt_money(global_interest)} đ", border=0, align='R', new_x="LMARGIN", new_y="NEXT")
    
    # Total
    pdf.set_font("TimesNewRoman", 'B', 14)
    pdf.cell(w_label, 10, "TỔNG SỐ TIỀN PHẢI THANH TOÁN:", border=0, align='L')
    pdf.set_draw_color(0,0,0) # Black
    # Bottom border for value
    x_val = pdf.get_x()
    y_val = pdf.get_y()
    pdf.cell(w_val, 10, f"{fmt_money(global_principal + global_interest)} đ", border=0, align='R', new_x="LMARGIN", new_y="NEXT")
    
    # In Words
    pdf.set_font("TimesNewRoman", 'I', 11)
    # Bold the money text? Frontend uses <b>{readMoney...}</b> inside italic div.
    # PDF: Italic line, bold text? Let's just make it Bold Italic for the money part if we want to be fancy, or just Italic.
    # Frontend: <div ... italic ...>Bằng chữ: <b>...</b></div>
    pdf.write(8, "Bằng chữ: ")
    pdf.set_font("TimesNewRoman", 'BI', 11)
    money_text = read_money(global_principal + global_interest)
    pdf.write(8, money_text)
    pdf.ln(8)
    
    # Signature area
    # Ensure entire signature block stays together (approx 40-50 units height)
    # If we are too close to bottom (e.g. > 240), move to next page
    if pdf.get_y() > 240:
        pdf.add_page()
        
    pdf.ln(15)
    pdf.set_font("TimesNewRoman", 'B', 11)
    
    y_sig = pdf.get_y()
    
    # Col 1
    pdf.set_xy(10, y_sig)
    pdf.cell(90, 6, "Đại diện bên trả nợ", align='C')
    pdf.ln(6)
    pdf.set_x(10)
    pdf.set_font("TimesNewRoman", 'I', 10)
    pdf.cell(90, 6, "(Ký và ghi rõ họ tên)", align='C')
    
    # Col 2
    pdf.set_xy(110, y_sig)
    pdf.set_font("TimesNewRoman", 'B', 11)
    pdf.cell(90, 6, "Đại diện bên nhận nợ", align='C')
    pdf.ln(6)
    pdf.set_x(110)
    pdf.set_font("TimesNewRoman", 'I', 10)
    pdf.cell(90, 6, "(Ký và ghi rõ họ tên)", align='C')

    return bytes(pdf.output())

@router.get("/{customer_id}/pdf")
async def generate_pdf(
    customer_id: str,
    start_date: str | None = None, # Expect string YYYY-MM-DD
    end_date: str | None = None
):
    customer = await Customer.get(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    query = Transaction.find(Transaction.transaction_date >= datetime.min) # Hack to start chain
    query = query.find(Transaction.customer_id == customer.id)
    
    # Parse dates
    s_date, e_date = None, None
    if start_date:
        s_date = datetime.strptime(start_date, "%Y-%m-%d")
        query = query.find(Transaction.transaction_date >= s_date)
    if end_date:
        e_date = datetime.strptime(end_date, "%Y-%m-%d")
        # Set to end of day
        e_date = e_date.replace(hour=23, minute=59, second=59)
        query = query.find(Transaction.transaction_date <= e_date)
        
    transactions = await query.sort("transaction_date").to_list()
    
    pdf_bytes = create_pdf_bytes(customer, transactions)
    
    return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=report_{customer_id}.pdf"})

from pydantic import BaseModel

class BatchExportRequest(BaseModel):
    output_path: str | None = None

@router.post("/batch-export")
async def batch_export_reports(request: BatchExportRequest = None):
    # Default path if none provided (e.g. from Auto-Backup on Logout)
    target_base = r"C:\Users\PC\OneDrive\Desktop"
    
    if request and request.output_path:
        target_base = request.output_path
        
    output_dir = os.path.join(target_base, "DATA")
    os.makedirs(output_dir, exist_ok=True)
    
    customers = await Customer.find_all().to_list()
    count = 0
    
    for customer in customers:
        # Fetch transactions (All Time)
        transactions = await Transaction.find(Transaction.customer_id == customer.id).sort("transaction_date").to_list()
        
        # NOTE: User might want ALL customers even with no debt? 
        # The previous code skipped if 'not transactions'. 
        # But maybe they have transactions but paid fully?
        # Logic: If no *unpaid* transactions, should we print? 
        # The create_pdf_bytes handles empty groups gracefully.
        # Let's keep it creating a file if they have transactions.
        if not transactions:
            continue
            
        pdf_bytes = create_pdf_bytes(customer, transactions)
        
        # Sanitize filename
        safe_name = "".join(c for c in remove_accents(customer.name) if c.isalnum() or c in (' ', '-', '_')).strip()
        if not safe_name: safe_name = f"customer_{customer.id}"
        
        filename = f"{safe_name}.pdf"
        filepath = os.path.join(output_dir, filename)
        
        try:
            with open(filepath, "wb") as f:
                f.write(pdf_bytes)
            count += 1
        except Exception as e:
            print(f"Error writing file {filename}: {e}")
            
    return {"success": True, "count": count, "path": output_dir}
