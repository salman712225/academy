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
    day_wise_attendance_pct: Optional[float] = 0.0
    session_wise_attendance_pct: Optional[float] = 0.0
    total_conducted_sessions: Optional[int] = 0
    attended_sessions: Optional[int] = 0
    total_conducted_days: Optional[int] = 0
    attended_days: Optional[int] = 0

class AttendanceManualRecord(BaseModel):
    student_email: EmailStr
    session_1: str  # Present, Absent, Late, None
    session_2: str
    session_3: str
    session_4: str

class AttendanceManualUpdateRequest(BaseModel):
    batch_id: str
    date: str  # YYYY-MM-DD
    records: List[AttendanceManualRecord]

