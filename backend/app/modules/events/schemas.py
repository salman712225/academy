from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class EventCreate(BaseModel):
    name: str
    date: datetime
    description: str
    form_link: Optional[str] = None

class EventResponse(BaseModel):
    id: str
    name: str
    date: datetime
    description: str
    form_link: Optional[str] = None
    created_by: str
    created_at: datetime
