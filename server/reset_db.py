import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

async def reset_db():
    print("WARNING: This will wipe all data in the database.")
    print("Waiting 3 seconds... Ctrl+C to cancel.")
    await asyncio.sleep(3)
    
    url = os.getenv("MONGODB_URL")
    if not url:
        print("Error: MONGODB_URL not found")
        return

    client = AsyncIOMotorClient(url)
    db = client.get_default_database()
    
    print(f"Connected to database: {db.name}")
    
    cols = await db.list_collection_names()
    print(f"Found collections: {cols}")
    
    for col in cols:
        print(f"Dropping collection: {col}")
        await db.drop_collection(col)
        
    print("Database wiped successfully.")
    
    # Initialize Counters if needed? No, get_next_id handles upsert.
    print("Done.")

if __name__ == "__main__":
    asyncio.run(reset_db())
