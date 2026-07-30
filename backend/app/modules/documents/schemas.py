from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class NoteResponse(BaseModel):
    id: str
    title: str
    description: str
    filename: str
    filepath: str
    uploaded_by: str
    uploaded_at: datetime

class ResumeResponse(BaseModel):
    id: str
    student_email: EmailStr
    student_name: str
    filename: str
    filepath: str
    uploaded_at: datetime
