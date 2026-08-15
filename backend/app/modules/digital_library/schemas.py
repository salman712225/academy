from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DigitalBookResponse(BaseModel):
    id: str
    title: str
    author: str
    description: str
    category: str
    file_url: str
    cover_url: Optional[str] = None
    extracted_text: Optional[str] = None
    uploaded_by: str
    uploaded_at: datetime
