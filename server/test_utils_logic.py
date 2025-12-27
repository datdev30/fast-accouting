from datetime import datetime
import sys
import os

# Add server dir to path
sys.path.append(os.getcwd())

try:
    from utils import calculate_interest_amount, remove_accents
    print("Import successful.")
except Exception as e:
    print(f"Import failed: {e}")
    sys.exit(1)

# Test remove_accents
try:
    s = "Đại lý Công Phú"
    clean = remove_accents(s)
    print(f"Cleaned: {clean}")
    if clean != "Dai ly Cong Phu":
        print("FAIL: remove_accents logic incorrect")
except Exception as e:
    print(f"remove_accents failed: {e}")

# Test calculate_interest_amount with None rate
try:
    start = datetime(2023, 1, 1)
    end = datetime(2023, 2, 1)
    # Case 1: Normal
    res = calculate_interest_amount(1000000, 10.0, start, end)
    print(f"Normal calc: {res}")
    
    # Case 2: None rate
    try:
        res = calculate_interest_amount(1000000, None, start, end)
        print(f"None rate calc: {res}")
    except TypeError as e:
        print(f"Caught expected TypeError with None rate: {e}")
        
except Exception as e:
    print(f"Calc failed: {e}")
