from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# --- Task Schemas ---
class TaskBase(BaseModel):
    title: str
    completed: bool = False

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        populate_by_name = True


# --- Document Schemas ---
class DocumentBase(BaseModel):
    title: str
    content: Optional[str] = ""
    file_url: Optional[str] = None
    filename: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    file_url: Optional[str] = None
    filename: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


# --- Settings Schemas ---
class PersonalSettingsUpdate(BaseModel):
    personal_cloudinary_url: Optional[str] = None

class PersonalSettingsResponse(BaseModel):
    personal_cloudinary_url: Optional[str] = None
