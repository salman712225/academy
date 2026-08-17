from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional

from app.core.database import get_db
from app.modules.auth.service import require_role
from app.modules.emails.schemas import EmailCreate, EmailResponse, RecentRecipient, MailboxSettingsResponse, MailboxSettingsUpdate
from app.core.config import settings

router = APIRouter(prefix="/emails", tags=["Emails & Follow-ups"])


def _normalize_string_list(value: Optional[List[str]]) -> List[str]:
    if not value:
        return []
    return [item.strip() for item in value if item and str(item).strip()]


async def _get_mailbox_settings(db: AsyncIOMotorDatabase) -> dict:
    doc = await db.mailbox_settings.find_one({"_id": "default"})
    if not doc:
        return {
            "subject_keywords": [],
            "body_keywords": [],
            "exclude_keywords": [],
            "required_files": []
        }

    return {
        "subject_keywords": _normalize_string_list(doc.get("subject_keywords", [])),
        "body_keywords": _normalize_string_list(doc.get("body_keywords", [])),
        "exclude_keywords": _normalize_string_list(doc.get("exclude_keywords", [])),
        "required_files": _normalize_string_list(doc.get("required_files", [])),
    }


def _evaluate_mailbox_match(subject: str, body: str, settings: dict) -> dict:
    subject_text = (subject or "").lower()
    body_text = (body or "").lower()

    subject_keywords = _normalize_string_list(settings.get("subject_keywords", []))
    body_keywords = _normalize_string_list(settings.get("body_keywords", []))
    exclude_keywords = _normalize_string_list(settings.get("exclude_keywords", []))
    required_files = _normalize_string_list(settings.get("required_files", []))

    matched_subject_keywords = [keyword for keyword in subject_keywords if keyword.lower() in subject_text]
    matched_body_keywords = [keyword for keyword in body_keywords if keyword.lower() in body_text]
    matched_keywords = matched_subject_keywords + matched_body_keywords

    excluded_terms = [
        keyword for keyword in exclude_keywords
        if keyword.lower() in subject_text or keyword.lower() in body_text
    ]

    matched_required_files = [
        file_name for file_name in required_files
        if file_name.lower() in subject_text or file_name.lower() in body_text
    ]
    missing_required_files = [
        file_name for file_name in required_files
        if file_name.lower() not in subject_text and file_name.lower() not in body_text
    ]

    has_configured_rules = bool(subject_keywords or body_keywords or exclude_keywords or required_files)
    has_keyword_match = bool(matched_keywords)
    has_required_files = not required_files or not missing_required_files

    if excluded_terms:
        match = False
        reason = f"Blocked by excluded keywords: {', '.join(excluded_terms)}"
    elif has_configured_rules and not has_keyword_match:
        match = False
        reason = "No configured subject/body keywords matched the email content"
    elif has_configured_rules and not has_required_files:
        match = False
        reason = f"Required workflow files are missing: {', '.join(missing_required_files)}"
    else:
        match = True if not has_configured_rules else True
        reason = (
            "Matched configured keywords and required files"
            if has_configured_rules
            else "No mailbox rules configured; the email is treated as a default follow-up candidate"
        )

    return {
        "mailbox_match": match,
        "mailbox_match_reason": reason,
        "matched_keywords": matched_keywords,
        "matched_required_files": matched_required_files,
        "excluded_terms": excluded_terms,
        "missing_required_files": missing_required_files,
    }


def _dispatch_smtp_email_sync(to_email: str, subject: str, body: str) -> None:
    try:
        msg = MIMEMultipart()
        msg['From'] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        # Configure non-blocking short timeout
        if settings.SMTP_PORT == 465:
            server_class = smtplib.SMTP_SSL
        else:
            server_class = smtplib.SMTP

        with server_class(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5) as server:
            if settings.SMTP_PORT != 465:
                server.ehlo()
                try:
                    server.starttls()
                    server.ehlo()
                except Exception as tls_err:
                    print(f"Warning: STARTTLS start failed or not supported by server: {str(tls_err)}")
            
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        # Silently log warning on SMTP failure (common for localhost tests / Render free tier)
        print(f"Warning: Failed to dispatch physical SMTP email to {to_email}: {str(e)}")


async def _dispatch_resend_email_async(to_email: str, subject: str, body: str) -> None:
    import httpx
    api_key = getattr(settings, "RESEND_API_KEY", "")
    if not api_key:
        print("Warning: RESEND_API_KEY is not configured.")
        return
        
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": "Admissions Team <onboarding@resend.dev>",
                    "to": [to_email],
                    "subject": subject,
                    "text": body
                },
                timeout=10.0
            )
            if res.status_code not in [200, 201]:
                print(f"Warning: Resend API returned status {res.status_code}: {res.text}")
    except Exception as e:
        print(f"Warning: Failed to send email via Resend API: {str(e)}")


async def log_and_send_email(db: AsyncIOMotorDatabase, email_in: EmailCreate) -> dict:
    """Helper to write to DB sent logs and attempt SMTP dispatch with fallback log."""
    email_dict = email_in.model_dump()
    email_dict["sent_at"] = datetime.now(timezone.utc)

    mailbox_settings = await _get_mailbox_settings(db)
    mailbox_match = _evaluate_mailbox_match(email_in.subject, email_in.body, mailbox_settings)
    email_dict.update(mailbox_match)
    
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

    # 3. Email dispatch (using Resend API if key is set, otherwise falling back to SMTP)
    import asyncio
    resend_key = getattr(settings, "RESEND_API_KEY", "")
    if resend_key:
        asyncio.create_task(_dispatch_resend_email_async(email_in.to_email, email_in.subject, email_in.body))
    else:
        asyncio.create_task(asyncio.to_thread(_dispatch_smtp_email_sync, email_in.to_email, email_in.subject, email_in.body))
        
    return email_dict

@router.get("/settings", response_model=MailboxSettingsResponse)
async def get_mailbox_settings(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head"])),
):
    """Head admin fetches saved follow-up mail settings."""
    doc = await db.mailbox_settings.find_one({"_id": "default"})
    now = datetime.now(timezone.utc)
    if not doc:
        payload = {
            "subject_keywords": [],
            "body_keywords": [],
            "exclude_keywords": [],
            "required_files": [],
            "updated_at": now,
            "updated_by": current_user.get("email"),
        }
        return MailboxSettingsResponse(id="default", **payload)

    return MailboxSettingsResponse(
        id="default",
        subject_keywords=_normalize_string_list(doc.get("subject_keywords", [])),
        body_keywords=_normalize_string_list(doc.get("body_keywords", [])),
        exclude_keywords=_normalize_string_list(doc.get("exclude_keywords", [])),
        required_files=_normalize_string_list(doc.get("required_files", [])),
        updated_at=doc.get("updated_at", now),
        updated_by=doc.get("updated_by"),
    )


@router.put("/settings", response_model=MailboxSettingsResponse)
async def update_mailbox_settings(
    settings_in: MailboxSettingsUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head"])),
):
    """Head admin updates keyword filters and the workflow files needed for follow-up mail processing."""
    payload = {
        "_id": "default",
        "subject_keywords": _normalize_string_list(settings_in.subject_keywords),
        "body_keywords": _normalize_string_list(settings_in.body_keywords),
        "exclude_keywords": _normalize_string_list(settings_in.exclude_keywords),
        "required_files": _normalize_string_list(settings_in.required_files),
        "updated_at": datetime.now(timezone.utc),
        "updated_by": current_user.get("email"),
    }
    await db.mailbox_settings.update_one({"_id": "default"}, {"$set": payload}, upsert=True)
    return MailboxSettingsResponse(id="default", **payload)


@router.post("/send", response_model=EmailResponse, status_code=status.HTTP_201_CREATED)
async def send_email(
    email_in: EmailCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head"])),
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
