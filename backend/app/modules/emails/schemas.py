from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class EmailCreate(BaseModel):
    to_email: EmailStr
    subject: str
    body: str
    category: str = "general" # follow_up, due_notice, general

class EmailResponse(BaseModel):
    id: str
    to_email: str
    subject: str
    body: str
    sent_at: datetime
    category: str

class RecentRecipient(BaseModel):
    email: str
    last_sent: datetime
