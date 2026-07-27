from pydantic import BaseModel, EmailStr
from typing import List, Optional

class AttendanceRecord(BaseModel):
    id: str
    student_email: EmailStr
    batch_id: str
    date: str  # YYYY-MM-DD
    session_1: str  # Present, Absent, None
    session_2: str
    session_3: str
    session_4: str
    uploaded_by: str

class StudentAttendanceSummary(BaseModel):
    student_email: EmailStr
    records: List[AttendanceRecord]
