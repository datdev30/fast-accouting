from beanie import Document, Link
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

class TransactionType(str, Enum):
    CASH = "TIEN_MAT"
    TRANSFER = "CHUYEN_KHOAN"
    PURCHASE = "MUA_HANG"

class InterestConfig(Document):
    code: str = Field(..., unique=True)
    name: str
    rate_per_month: float # Percentage, e.g., 2.0 for 2%
    description: Optional[str] = None
    
    class Settings:
        name = "interest_configs"

class Counter(Document):
    code: str  # e.g. "customer", "transaction"
    seq: int = 0
    
    class Settings:
        name = "counters"

class Customer(Document):
    id: str # Custom String ID (e.g. CUS-001)
    name: str
    contact_info: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    
    class Settings:
        name = "customers"

class Transaction(Document):
    id: str # Custom String ID (e.g. TX-001)
    customer_id: str # Manual Reference (Foreign Key)
    type: str # Refers to InterestConfig.code
    amount: float
    content: str
    transaction_date: datetime
    interest_rate_snapshot: float 
    status: str = "OPEN" # OPEN, PAID
    closed_at: Optional[datetime] = None
    final_interest: Optional[float] = None
    final_months: Optional[float] = None
    final_total: Optional[float] = None

    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "transactions"

class User(Document):
    username: str = Field(..., unique=True)
    password_hash: str
    pin_hash: Optional[str] = None # 4-digit PIN hashed (MD5)
    session_token: Optional[str] = None
    
    class Settings:
        name = "users"
