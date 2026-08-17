from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class BatchCreate(BaseModel):
    name: str
    description: str
    is_open: bool = True
    group: str = "ongoing"  # ongoing or upcoming

class BatchResponse(BaseModel):
    id: str
    name: str
    description: str
    is_open: bool
    created_at: datetime
    group: str = "ongoing"

class ApplicationCreate(BaseModel):
    student_name: str
    student_email: EmailStr

class ApplicationResponse(BaseModel):
    id: str
    batch_id: str
    student_name: str
    student_email: EmailStr
    age: int
    gender: str
    degree: str
    branch: str
    passout_year: int
    college_percentage: float
    any_arrears: str
    family_annual_income: float
    father_occupation: str
    mother_occupation: str
    phone_number: str
    status: str  # pending, approved, rejected
    applied_at: datetime
    marksheet_10th_url: Optional[str] = None
    marksheet_12th_url: Optional[str] = None
    resume_url: Optional[str] = None
    ug_marksheet_url: Optional[str] = None
    provisional_certificate_url: Optional[str] = None
    interview_details: Optional[dict] = None
    call_status: str = "pending"
    call_id: Optional[str] = None
    call_transcript: Optional[str] = None
    call_recording_url: Optional[str] = None

class InterviewDetailsUpdate(BaseModel):
    interview_date: str
    interview_time: str
    interview_link: str
    interviewer_notes: Optional[str] = ""

