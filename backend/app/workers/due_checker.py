import asyncio
import logging
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.modules.emails.router import log_and_send_email
from app.modules.emails.schemas import EmailCreate

logger = logging.getLogger("due_checker")

async def run_daily_due_check(db: AsyncIOMotorDatabase):
    """
    Scans the database to:
    1. Send email notifications to students on their 5th day of lending.
    2. Recalculate and update the overdue fine of 10 RS/day starting the 6th day.
    """
    logger.info("Starting library lendings overdue inspection...")
    today = datetime.now(timezone.utc)
    
    # Scan active lendings
    cursor = db.lendings.find({"status": {"$in": ["lent", "overdue"]}})
    count_notices = 0
    count_fines = 0
    
    async for lending in cursor:
        lend_date = lending["lend_date"]
        if lend_date.tzinfo is None:
            lend_date = lend_date.replace(tzinfo=timezone.utc)
            
        due_date = lending["due_date"]
        if due_date.tzinfo is None:
            due_date = due_date.replace(tzinfo=timezone.utc)

        # Calculate days elapsed
        diff = today - lend_date
        days_lent = diff.days
        
        # If there's partial time elapsed, check the actual calendar days
        # E.g. if we are on day 5 (between 5.0 and 6.0 days since lending)
        if days_lent == 5:
            # Check if alert already sent for this lending copy
            already_sent = await db.sent_emails.find_one({
                "to_email": lending["student_email"],
                "category": "due_notice",
                "body": {"$regex": lending["copy_id"]}
            })
            if not already_sent:
                email_in = EmailCreate(
                    to_email=lending["student_email"],
                    subject=f"Lending Notice: Last Day to Return {lending['book_title']}",
                    body=(
                        f"Hello,\n\n"
                        f"This is to remind you that today is the last date to return '{lending['book_title']}' "
                        f"(Copy ID: {lending['copy_id']}).\n\n"
                        f"Please return it today to avoid late return charges. Starting tomorrow, "
                        f"a daily fine of 10 RS will accumulate on your account.\n\n"
                        f"Regards,\nAcademy Library"
                    ),
                    category="due_notice"
                )
                await log_and_send_email(db, email_in)
                count_notices += 1
                
        elif today > due_date:
            diff = today - due_date
            overdue_days = diff.days
            if diff.total_seconds() > 0 and overdue_days == 0:
                overdue_days = 1
            elif diff.total_seconds() > 0 and diff.total_seconds() % 86400 > 0:
                overdue_days += 1
            fine = float(overdue_days * 10)
            
            await db.lendings.update_one(
                {"_id": lending["_id"]},
                {"$set": {"fine_amount": fine, "status": "overdue"}}
            )
            count_fines += 1
            
    logger.info(f"Library audit finished. Notices sent: {count_notices}, Overdue records updated: {count_fines}")
    return {"notices_sent": count_notices, "fines_updated": count_fines}

async def schedule_due_checker_daemon(db: AsyncIOMotorDatabase):
    """Loop to run the checker every 24 hours."""
    logger.info("Initializing Daily Library Audit background daemon...")
    while True:
        try:
            await run_daily_due_check(db)
        except Exception as e:
            logger.error(f"Error in Library Audit daemon: {str(e)}")
        # Sleep for 24 hours
        await asyncio.sleep(24 * 3600)
