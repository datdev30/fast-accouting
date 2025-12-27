from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from typing import Optional
import os
from models import Transaction, Customer, InterestConfig, Counter, User

async def init_db():
    mongodb_url = os.environ.get("MONGODB_URL")
    if not mongodb_url:
        # Fallback for dev if not set, though it should be set in .env
        mongodb_url = "mongodb://localhost:27017/fastaccounting" 
    
    client = AsyncIOMotorClient(mongodb_url)
    database = client.get_default_database()
    
    await init_beanie(database=database, document_models=[
        Transaction, 
        InterestConfig, 
        Counter, 
        Customer,
        User
    ])
