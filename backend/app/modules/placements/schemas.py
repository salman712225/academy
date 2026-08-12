from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class PlacementLeadCreate(BaseModel):
    company: str = Field(..., description="Name of the company")
    role: str = Field(..., description="Job role or title")
    stage: str = Field("applied", description="Stage of the pipeline: applied, interviewing, offer, hired")
    salary: Optional[str] = Field(None, description="Optional salary package info")
    notes: Optional[str] = Field(None, description="Personal notes or updates on this lead")
    student_email: Optional[str] = Field(None, description="Email of the student (for Admin creation)")

class PlacementLeadUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    stage: Optional[str] = None
    salary: Optional[str] = None
    notes: Optional[str] = None

class PlacementLeadResponse(BaseModel):
    id: str
    student_email: str
    student_name: Optional[str] = None
    batch_name: Optional[str] = None
    company: str
    role: str
    stage: str
    salary: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OutreachGenerateRequest(BaseModel):
    role_title: str
    company_name: str
    job_description: Optional[str] = None
    resume_text: Optional[str] = None
    outreach_type: str = Field("linkedin", description="Type: linkedin, email, follow_up")

class OutreachGenerateResponse(BaseModel):
    generated_text: str

class PlacementStatsResponse(BaseModel):
    total_leads: int
    applied_count: int
    interviewing_count: int
    offer_count: int
    hired_count: int
    conversion_rate: float
    batch_stats: Dict[str, Dict[str, int]]
