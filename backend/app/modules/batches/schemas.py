from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class BatchCreate(BaseModel):
    name: str
    description: str
    is_open: bool = True

class BatchResponse(BaseModel):
    id: str
    name: str
    description: str
    is_open: bool
    created_at: datetime

class ApplicationCreate(BaseModel):
    student_name: str
    student_email: EmailStr

class ApplicationResponse(BaseModel):
    id: str
    batch_id: str
    student_name: str
    student_email: EmailStr
    status: str  # pending, approved, rejected
    applied_at: datetime
