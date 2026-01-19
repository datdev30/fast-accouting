from datetime import datetime
import math

import unicodedata

def remove_accents(input_str: str) -> str:
    if not input_str: return ""
    # Manually handle Vietnamese D
    s = input_str.replace("Đ", "D").replace("đ", "d")
    nfkd_form = unicodedata.normalize('NFKD', s)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

def calculate_time_units(start_date: datetime, end_date: datetime) -> float:
    """
    Calculate time units in months based on custom rules:
    1. Count full months.
    2. Remainder days:
         - 1-10 days: +0 month
         - 11-20 days: +0.5 month
         - >= 21 days: +1.0 month
    """
    # Calculate total days inclusive
    # Example: 1/10 to 1/10 = 1 day?
    # round_month.md: 1/10 to 21/12. Oct(31)+Nov(30)+Dec(21)=82.
    # Simple delta: 21/12 - 1/10 = 81 days. So we need +1 for inclusive start-end days.
    
    delta = end_date - start_date
    total_days = delta.days + 1
    
    # Assumption: 1 month = 30 days
    full_months = total_days // 30
    remainder_days = total_days % 30
    
    extra_units = 0.0
    if remainder_days <= 10:
        extra_units = 0.0
    elif 11 <= remainder_days <= 20:
        extra_units = 0.5
    else: # >= 21
        extra_units = 1.0
        
    return float(full_months) + extra_units

def calculate_interest_amount(principal: float, rate_per_month: float, start_date: datetime, end_date: datetime) -> dict:
    # Handle None rate safely
    rate = rate_per_month if rate_per_month is not None else 0.0
    
    units = calculate_time_units(start_date, end_date)
    
    raw_interest = principal * (rate / 100.0) * units
    
    # Rounding Rule:
    # Round to nearest 10s.
    # Unit digit 0-7: Round DOWN.
    # Unit digit 8-9: Round UP.
    
    # NOTE: Interest is NOT rounded; use exact computed interest.
    rounded_interest = raw_interest
        
    return {
        "months": units,
        "raw_interest": raw_interest,
        "rounded_interest": float(rounded_interest),
        "total": principal + float(rounded_interest)
    }

async def get_next_id(code: str) -> str:
    from models import Counter
    # Safer Beanie implementation (Non-atomic but unrelated to collection access issues)
    # Ideally for high concurrency we need atomic, but for this app this is fine.
    
    counter = await Counter.find_one(Counter.code == code)
    if not counter:
        counter = Counter(code=code, seq=0)
        await counter.insert()
    
    counter.seq += 1
    await counter.save()
    
    seq = counter.seq
    
    if code == "customer":
        return f"KH{seq:03d}" # VD: KH001
    elif code == "transaction":
        return f"GD{seq:04d}" # VD: GD0001
    else:
        return f"{code.upper()}{seq:03d}"

async def verify_admin_pin(pin: str):
    from models import User
    from fastapi import HTTPException
    import hashlib
    
    admin = await User.find_one(User.username == "admin")
    if not admin or not admin.pin_hash:
        raise HTTPException(status_code=400, detail="Admin PIN not configured")
        
    hashed_pin = hashlib.md5(pin.encode()).hexdigest()
    if admin.pin_hash != hashed_pin:
        raise HTTPException(status_code=401, detail="Sai mã PIN")
    return True

def doc_so_3_chu_so(baso: int) -> str:
    ChuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]
    
    tram = baso // 100
    chuc = (baso % 100) // 10
    donvi = baso % 10
    ketqua = ""

    if tram == 0 and chuc == 0 and donvi == 0: return ""

    if tram != 0:
        ketqua += ChuSo[tram] + " trăm "
        if chuc == 0 and donvi != 0: ketqua += "linh "

    if chuc != 0 and chuc != 1:
        ketqua += ChuSo[chuc] + " mươi"
        if chuc == 0 and donvi != 0: ketqua = ketqua + " linh "

    if chuc == 1: ketqua += "mười"

    if donvi == 1:
        if chuc != 0 and chuc != 1:
            ketqua += " mốt"
        else:
            ketqua += " một"
    elif donvi == 5:
        if chuc == 0:
            ketqua += " năm"
        else:
            ketqua += " lăm"
    else:
        if donvi != 0:
            ketqua += " " + ChuSo[donvi]
            
    return ketqua

def read_money(so_tien: float) -> str:
    ChuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]
    Tien = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"]

    if so_tien < 0: return "Số tiền âm"
    if so_tien == 0: return "Không đồng"
    
    so = int(so_tien)
    if so > 8999999999999999:
        return "Số quá lớn"

    vi_tri = [0] * 6
    
    # Python integer division is clean
    vi_tri[5] = so // 1000000000000000
    so = so % 1000000000000000
    
    vi_tri[4] = so // 1000000000000
    so = so % 1000000000000
    
    vi_tri[3] = so // 1000000000
    so = so % 1000000000
    
    vi_tri[2] = so // 1000000
    so = so % 1000000
    
    vi_tri[1] = so // 1000
    so = so % 1000
    
    vi_tri[0] = so % 1000
    
    lan = 0
    if vi_tri[5] > 0: lan = 5
    elif vi_tri[4] > 0: lan = 4
    elif vi_tri[3] > 0: lan = 3
    elif vi_tri[2] > 0: lan = 2
    elif vi_tri[1] > 0: lan = 1
    else: lan = 0
    
    ketqua = ""
    for i in range(lan, -1, -1):
        tmp = doc_so_3_chu_so(vi_tri[i])
        ketqua += tmp
        if vi_tri[i] > 0: ketqua += " " + Tien[i]
        # Add comma with space if needed
        if i > 0 and len(tmp) > 0: ketqua += ", "
        
    # Remove trailing comma and space if exists
    if ketqua.endswith(", "):
        ketqua = ketqua[:-2]
    elif ketqua.endswith(","):
        ketqua = ketqua[:-1]
        
    ketqua = " ".join(ketqua.split()) # Trim extra spaces
    
    # Capitalize
    if ketqua:
        ketqua = ketqua[0].upper() + ketqua[1:]
        
    return ketqua + " đồng"

