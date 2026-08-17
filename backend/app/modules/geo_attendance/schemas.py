from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class GeoCenterCreate(BaseModel):
    name: str = Field(..., min_length=1)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    radius_meters: float = Field(150.0, gt=0)
    open_time: str = Field("09:30", pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    close_time: str = Field("17:30", pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    late_time: str = Field("11:00", pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")

class GeoCenterResponse(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    radius_meters: float
    open_time: str
    close_time: str
    late_time: str

class GeoCenterUpdate(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    radius_meters: Optional[float] = Field(None, gt=0)
    open_time: Optional[str] = Field(None, pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    close_time: Optional[str] = Field(None, pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    late_time: Optional[str] = Field(None, pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")

class StudentCenterAssign(BaseModel):
    user_id: str
    center_id: Optional[str] = None

class GeoAttendanceMark(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    gps_accuracy: float = Field(..., ge=0)

class CorrectionRecord(BaseModel):
    status: str
    corrected_by: str
    reason: str
    corrected_at: datetime

class GeoAttendanceResponse(BaseModel):
    id: str
    student_id: str
    student_name: str
    student_email: str
    batch_id: Optional[str] = None
    center_id: str
    center_name: str
    date: str
    marked_at: datetime
    latitude: float
    longitude: float
    distance: float
    gps_accuracy: float
    status: str
    verification_status: str
    corrected_by: Optional[str] = None
    correction_reason: Optional[str] = None
    corrected_at: Optional[datetime] = None
    correction_history: List[CorrectionRecord] = []

class GeoAttendanceCorrect(BaseModel):
    status: str = Field(..., description="PRESENT or LATE")
    reason: str = Field(..., min_length=5, description="Mandatory correction reason")

class StudentCenterAssignBulk(BaseModel):
    user_ids: List[str]
    center_id: Optional[str] = None
