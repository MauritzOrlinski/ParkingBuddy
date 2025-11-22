from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserRead(BaseModel):
    id: int
    email: EmailStr
    name: str
    saved_time: Optional[float]
    is_active: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

class ParkingRead(BaseModel):
    id: str
    address: str
    capacity: int
    latitude: float
    longitude: float
    parking_type: str

    class Config:
        from_attributes = True

class HistoryEventCreate(BaseModel):
    parking_id: str
    saved_time: float

class HistoryEventRead(BaseModel):
    id: int
    user_id: int
    parking_id: str
    saved_time: float
    timestamp: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
