from fastapi import APIRouter, HTTPException, status
from typing import List
from models import InterestConfig
from pydantic import BaseModel

router = APIRouter()

class InterestConfigCreate(BaseModel):
    code: str
    name: str
    rate_per_month: float
    description: str | None = None

class InterestConfigUpdate(BaseModel):
    name: str | None = None
    rate_per_month: float | None = None
    description: str | None = None

@router.get("", response_model=List[InterestConfig])
async def get_configs():
    return await InterestConfig.find_all().to_list()

@router.post("", response_model=InterestConfig, status_code=status.HTTP_201_CREATED)
async def create_config(config: InterestConfigCreate):
    existing = await InterestConfig.find_one(InterestConfig.code == config.code)
    if existing:
        raise HTTPException(status_code=400, detail="Config code already exists")
    
    new_config = InterestConfig(**config.model_dump())
    await new_config.insert()
    return new_config

@router.get("/{code}", response_model=InterestConfig)
async def get_config(code: str):
    config = await InterestConfig.find_one(InterestConfig.code == code)
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    return config

@router.patch("/{code}", response_model=InterestConfig)
async def update_config(code: str, diff: InterestConfigUpdate):
    config = await InterestConfig.find_one(InterestConfig.code == code)
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    update_data = diff.model_dump(exclude_unset=True)
    if update_data:
        await config.set(update_data)
    
    return config
    return config

class DeleteSecureRequest(BaseModel):
    code: str
    pin: str

@router.post("/delete-secure")
async def delete_config_secure(req: DeleteSecureRequest):
    from utils import verify_admin_pin
    await verify_admin_pin(req.pin)
    
    config = await InterestConfig.find_one(InterestConfig.code == req.code)
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
        
    await config.delete()
    return {"message": "Đã xóa cấu hình"}
