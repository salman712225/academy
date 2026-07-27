from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class LeadCreate(BaseModel):
    company_name: str
    hr_name: str
    number: str
    email: EmailStr
    role: str
    package: str
    link_to_apply: str
    last_date: str  # YYYY-MM-DD

class LeadUpdate(BaseModel):
    company_name: Optional[str] = None
    hr_name: Optional[str] = None
    number: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    package: Optional[str] = None
    link_to_apply: Optional[str] = None
    last_date: Optional[str] = None

class LeadResponse(BaseModel):
    id: str
    company_name: str
    hr_name: str
    number: str
    email: EmailStr
    role: str
    package: str
    link_to_apply: str
    last_date: str
    created_at: datetime
