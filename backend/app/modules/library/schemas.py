from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class BookCopySchema(BaseModel):
    copy_id: str
    status: str  # available, lent
    lent_to: Optional[EmailStr] = None
    lent_to_id: Optional[str] = None
    last_lent_to: Optional[EmailStr] = None
    last_lent_to_id: Optional[str] = None

class BookCreate(BaseModel):
    title: str
    author: str
    isbn: str
    quantity: int

class BookResponse(BaseModel):
    id: str
    title: str
    author: str
    isbn: str
    quantity: int
    copies: List[BookCopySchema]

class LendRequest(BaseModel):
    student_email: EmailStr
    book_id: str
    copy_id: str

class LendingResponse(BaseModel):
    id: str
    student_email: EmailStr
    book_id: str
    book_title: str
    copy_id: str
    lend_date: datetime
    due_date: datetime
    return_date: Optional[datetime] = None
    fine_amount: float
    status: str  # lent, returned, overdue

class StudentFineSummary(BaseModel):
    cumulative_fine: float
    lendings: List[LendingResponse]

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    quantity: Optional[int] = None
