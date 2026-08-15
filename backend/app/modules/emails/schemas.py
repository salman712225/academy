from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

class EmailCreate(BaseModel):
    to_email: EmailStr
    subject: str
    body: str
    category: str = "general" # follow_up, due_notice, general

class EmailResponse(BaseModel):
    id: str
    to_email: str
    subject: str
    body: str
    sent_at: datetime
    category: str
    mailbox_match: Optional[bool] = None
    mailbox_match_reason: Optional[str] = None
    matched_keywords: List[str] = Field(default_factory=list)
    matched_required_files: List[str] = Field(default_factory=list)
    excluded_terms: List[str] = Field(default_factory=list)
    missing_required_files: List[str] = Field(default_factory=list)

class RecentRecipient(BaseModel):
    email: str
    last_sent: datetime

class MailboxSettingsBase(BaseModel):
    subject_keywords: List[str] = Field(default_factory=list)
    body_keywords: List[str] = Field(default_factory=list)
    exclude_keywords: List[str] = Field(default_factory=list)
    required_files: List[str] = Field(default_factory=list)

class MailboxSettingsUpdate(MailboxSettingsBase):
    pass

class MailboxSettingsResponse(MailboxSettingsBase):
    id: str
    updated_at: datetime
    updated_by: Optional[str] = None
