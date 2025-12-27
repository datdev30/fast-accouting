from fastapi import APIRouter, HTTPException, Depends, Header
from models import User
from pydantic import BaseModel
import hashlib
import uuid
from typing import Optional

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str

def hash_password(password: str) -> str:
    # MD5 hashing as requested
    return hashlib.md5(password.encode()).hexdigest()

@router.post("/register")
async def register(req: RegisterRequest):
    existing = await User.find_one(User.username == req.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed = hash_password(req.password)
    user = User(username=req.username, password_hash=hashed)
    await user.insert()
    return {"message": "User created successfully"}

@router.post("/login")
async def login(req: LoginRequest):
    hashed = hash_password(req.password)
    user = await User.find_one(User.username == req.username, User.password_hash == hashed)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Generate simple session token
    token = str(uuid.uuid4())
    user.session_token = token
    await user.save()
    
    return {"token": token, "username": user.username}

@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if not authorization:
        return {"message": "Logged out"}
    
    token = authorization.replace("Bearer ", "")
    user = await User.find_one(User.session_token == token)
    if user:
        user.session_token = None
        await user.save()
        
    return {"message": "Logged out successfully"}

@router.get("/me")
async def get_me(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
        
    token = authorization.replace("Bearer ", "")
    user = await User.find_one(User.session_token == token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
        
    return {"username": user.username}
