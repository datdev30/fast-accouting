import asyncio
from db import init_db
from models import User
from dotenv import load_dotenv
import hashlib
import os

load_dotenv()

def hash_pin(pin: str) -> str:
    return hashlib.md5(pin.encode()).hexdigest()

async def seed_admin_pin():
    await init_db()
    
    # Update admin user
    username = "admin" # assuming standard admin
    user = await User.find_one(User.username == username)
    if not user:
        print(f"User {username} not found. Creating...")
        # Create default admin if not exists (though auth flow handles registration, we might want a 'root' user)
        # Assuming user already exists or we just fail. 
        # Let's verify if user exists first.
        # If not, let's create one for testing 
        user = User(
            username=username,
            password_hash=hashlib.md5("admin123".encode()).hexdigest(), # Default pass
            pin_hash=hash_pin("1234")
        )
        await user.insert()
        print(f"Created user '{username}' with PIN '1234'.")
    else:
        user.pin_hash = hash_pin("1234")
        await user.save()
        print(f"Updated user '{username}' with PIN '1234'.")

if __name__ == "__main__":
    asyncio.run(seed_admin_pin())
