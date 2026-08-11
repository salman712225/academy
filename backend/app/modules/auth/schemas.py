from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = Field(..., description="student, trainer, associate, or head")
    batch_id: Optional[str] = None
    classes_assigned: Optional[List[str]] = []
    personal_cloudinary_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    permissions: Optional[dict] = None

    class Config:
        populate_by_name = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TrainerCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    classes_assigned: List[str] = []

class TrainerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    classes_assigned: Optional[List[str]] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None
    batch_id: Optional[str] = None
    personal_cloudinary_url: Optional[str] = None
