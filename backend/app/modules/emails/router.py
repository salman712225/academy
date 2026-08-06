from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional

from app.core.database import get_db
from app.modules.auth.service import require_role
from app.modules.emails.schemas import EmailCreate, EmailResponse, RecentRecipient
from app.core.config import settings

router = APIRouter(prefix="/emails", tags=["Emails & Follow-ups"])

async def log_and_send_email(db: AsyncIOMotorDatabase, email_in: EmailCreate) -> dict:
    """Helper to write to DB sent logs and attempt SMTP dispatch with fallback log."""
    email_dict = email_in.model_dump()
    email_dict["sent_at"] = datetime.now(timezone.utc)
    
    # 1. Store in DB (Acts as sent mail history)
    result = await db.sent_emails.insert_one(email_dict)
    email_dict["id"] = str(result.inserted_id)

    # 2. Console display logging (always enabled for verification)
    print("\n" + "="*50)
    print(f"SMTP OUTBOX - [{email_in.category.upper()}]")
    print(f"TO:      {email_in.to_email}")
    print(f"SUBJECT: {email_in.subject}")
    print(f"BODY:\n{email_in.body}")
    print("="*50 + "\n")

    # 3. Standard SMTP execution (with fallback)
    try:
        msg = MIMEMultipart()
        msg['From'] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg['To'] = email_in.to_email
        msg['Subject'] = email_in.subject
        msg.attach(MIMEText(email_in.body, 'plain'))
        
        # Configure non-blocking short timeout
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=2) as server:
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        # Silently log warning on SMTP failure (common for localhost tests)
        print(f"Warning: Failed to dispatch physical SMTP email to {email_in.to_email}: {str(e)}")
        
    return email_dict

@router.post("/send", response_model=EmailResponse, status_code=status.HTTP_201_CREATED)
async def send_email(
    email_in: EmailCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head"]))
):
    """Area Head manually sends an email (follow-up or notice)."""
    return await log_and_send_email(db, email_in)

@router.get("/sent", response_model=List[EmailResponse])
async def list_sent_emails(
    keyword: Optional[str] = Query(None, description="Keywords to match in subject or body"),
    category: Optional[str] = Query(None, description="Category filter (e.g. follow_up, due_notice)"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head"]))
):
    """
    Area Head follow-up mail list.
    Filters/sorts sent emails based on subject and body keywords.
    """
    query = {}
    if category:
        query["category"] = category
        
    if keyword:
        # Search keyword in either subject or body (case-insensitive)
        query["$or"] = [
            {"subject": {"$regex": keyword, "$options": "i"}},
            {"body": {"$regex": keyword, "$options": "i"}}
        ]
        
    cursor = db.sent_emails.find(query).sort("sent_at", -1)
    emails = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        emails.append(doc)
    return emails

@router.get("/recent-recipients", response_model=List[RecentRecipient])
async def search_recent_recipients(
    query_str: Optional[str] = Query(None, description="Partial matching search on email"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head"]))
):
    """
    Search sent logs for recent recipients email addresses.
    Assists Area Head with quick 'To Email ID' searching.
    """
    pipeline = [
        # Sort by sent date first
        {"$sort": {"sent_at": -1}},
        # Group by email to keep only the latest sent record for each unique recipient
        {
            "$group": {
                "_id": "$to_email",
                "last_sent": {"$first": "$sent_at"}
            }
        },
        # Structure fields
        {
            "$project": {
                "email": "$_id",
                "last_sent": 1,
                "_id": 0
            }
        },
        # Sort resulting emails alphabetically
        {"$sort": {"email": 1}}
    ]
    
    # If query is specified, add email matching filter
    if query_str:
        pipeline.insert(0, {
            "$match": {
                "to_email": {"$regex": query_str, "$options": "i"}
            }
        })
        
    cursor = db.sent_emails.aggregate(pipeline)
    recipients = []
    async for doc in cursor:
        recipients.append(doc)
        
    # If list is small, we can also supplement with students emails to help them search easily
    if len(recipients) < 10:
        student_query = {}
        if query_str:
            student_query["email"] = {"$regex": query_str, "$options": "i"}
        student_cursor = db.users.find(student_query, {"email": 1}).limit(15)
        seen_emails = {r["email"] for r in recipients}
        async for std in student_cursor:
            if std["email"] not in seen_emails:
                recipients.append({
                    "email": std["email"],
                    "last_sent": datetime.now(timezone.utc) - timedelta(days=365) # mark as long ago
                })
                
    return recipients
