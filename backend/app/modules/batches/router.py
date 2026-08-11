import os
import shutil
import uuid
import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from fastapi.responses import FileResponse, RedirectResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timezone
from typing import List, Optional

from app.core.database import get_db
from app.modules.auth.service import require_role, get_current_user
from app.modules.batches.schemas import BatchCreate, BatchResponse, ApplicationCreate, ApplicationResponse, InterviewDetailsUpdate

router = APIRouter(prefix="/batches", tags=["Batches & Openings"])

async def upload_application_file(file: UploadFile, student_email: str, doc_type: str) -> str:
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    unique_id = str(uuid.uuid4())
    
    # If Cloudinary is configured, upload to cloud
    if os.environ.get("CLOUDINARY_URL"):
        try:
            clean_email = student_email.replace('@', '_').replace('.', '_')
            public_id = f"applications/{clean_email}_{doc_type}_{unique_id}"
            
            upload_result = cloudinary.uploader.upload(
                file.file,
                resource_type="raw",
                public_id=public_id
            )
            return upload_result["secure_url"]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Cloudinary upload failed for {doc_type}: {str(e)}"
            )
    else:
        # Fallback: Save file locally
        unique_filename = f"{student_email.replace('@', '_').replace('.', '_')}_{doc_type}_{unique_id}{ext}"
        filepath = f"uploads/applications/{unique_filename}"
        os.makedirs(os.path.join("uploads", "applications"), exist_ok=True)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return f"/static/uploads/applications/{unique_filename}"

@router.post("/", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
async def create_batch_opening(
    batch_in: BatchCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head"]))
):
    """Area Head creates a next batch opening."""
    batch_dict = batch_in.model_dump()
    batch_dict["created_at"] = datetime.now(timezone.utc)
    
    result = await db.batches.insert_one(batch_dict)
    batch_dict["id"] = str(result.inserted_id)
    return batch_dict

@router.get("/", response_model=List[BatchResponse])
async def list_batches(
    open_only: bool = False,
    group: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Retrieve list of batch openings. Can be filtered by is_open and group."""
    query = {}
    if open_only:
        query["is_open"] = True
    if group:
        if group == "ongoing":
            query["$or"] = [{"group": "ongoing"}, {"group": {"$exists": False}}]
        else:
            query["group"] = group
        
    cursor = db.batches.find(query)
    batches = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc["group"] = doc.get("group", "ongoing")
        batches.append(doc)
    return batches

@router.post("/{batch_id}/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_to_batch(
    batch_id: str,
    student_name: str = Form(...),
    student_email: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    degree: str = Form(...),
    branch: str = Form(...),
    passout_year: int = Form(...),
    college_percentage: float = Form(...),
    any_arrears: str = Form(...),
    marksheet_10th_file: Optional[UploadFile] = File(None),
    marksheet_12th_file: Optional[UploadFile] = File(None),
    resume_file: Optional[UploadFile] = File(None),
    ug_marksheet_file: Optional[UploadFile] = File(None),
    provisional_certificate_file: Optional[UploadFile] = File(None),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Prospective students apply to an upcoming batch opening."""
    if not ObjectId.is_valid(batch_id):
        raise HTTPException(status_code=400, detail="Invalid batch ID")
        
    batch = await db.batches.find_one({"_id": ObjectId(batch_id)})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch opening not found")
        
    if not batch.get("is_open", False):
        raise HTTPException(status_code=400, detail="This batch opening is closed for applications")
        
    student_email = student_email.lower().strip()
    
    # Check if they already applied to this batch
    existing_app = await db.applications.find_one({
        "batch_id": batch_id,
        "student_email": student_email
    })
    if existing_app:
        raise HTTPException(status_code=400, detail="You have already applied for this batch")
        
    # Upload files and get URLs
    marksheet_10th_url = None
    marksheet_12th_url = None
    resume_url = None
    ug_marksheet_url = None
    provisional_certificate_url = None
    
    if marksheet_10th_file and marksheet_10th_file.filename:
        marksheet_10th_url = await upload_application_file(marksheet_10th_file, student_email, "10th_marksheet")
    if marksheet_12th_file and marksheet_12th_file.filename:
        marksheet_12th_url = await upload_application_file(marksheet_12th_file, student_email, "12th_marksheet")
    if resume_file and resume_file.filename:
        resume_url = await upload_application_file(resume_file, student_email, "resume")
    if ug_marksheet_file and ug_marksheet_file.filename:
        ug_marksheet_url = await upload_application_file(ug_marksheet_file, student_email, "ug_marksheet")
    if provisional_certificate_file and provisional_certificate_file.filename:
        provisional_certificate_url = await upload_application_file(provisional_certificate_file, student_email, "provisional_cert")

    app_dict = {
        "batch_id": batch_id,
        "student_name": student_name,
        "student_email": student_email,
        "age": age,
        "gender": gender,
        "degree": degree,
        "branch": branch,
        "passout_year": passout_year,
        "college_percentage": college_percentage,
        "any_arrears": any_arrears,
        "status": "pending",
        "applied_at": datetime.now(timezone.utc),
        "marksheet_10th_url": marksheet_10th_url,
        "marksheet_12th_url": marksheet_12th_url,
        "resume_url": resume_url,
        "ug_marksheet_url": ug_marksheet_url,
        "provisional_certificate_url": provisional_certificate_url,
        "interview_details": None
    }
    
    result = await db.applications.insert_one(app_dict)
    app_dict["id"] = str(result.inserted_id)
    return app_dict

@router.get("/applications", response_model=List[ApplicationResponse])
async def list_applications(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head", "associate"]))
):
    """Area Head and Center Associate can list student applications."""
    cursor = db.applications.find()
    apps = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc["age"] = doc.get("age", 0)
        doc["gender"] = doc.get("gender", "")
        doc["degree"] = doc.get("degree", "")
        doc["branch"] = doc.get("branch", "")
        doc["passout_year"] = doc.get("passout_year", 0)
        doc["college_percentage"] = doc.get("college_percentage", 0.0)
        doc["any_arrears"] = doc.get("any_arrears", "")
        apps.append(doc)
    return apps

@router.put("/applications/{app_id}/status", response_model=ApplicationResponse)
async def update_application_status(
    app_id: str,
    status_val: str,  # approved or rejected
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head", "associate"]))
):
    """Area Head or Center Associate approves or rejects an application."""
    if not ObjectId.is_valid(app_id):
        raise HTTPException(status_code=400, detail="Invalid application ID")
        
    if status_val not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
        
    app = await db.applications.find_one({"_id": ObjectId(app_id)})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    await db.applications.update_one(
        {"_id": ObjectId(app_id)},
        {"$set": {"status": status_val}}
    )
    
    app["status"] = status_val
    app["id"] = str(app["_id"])
    
    app["age"] = app.get("age", 0)
    app["gender"] = app.get("gender", "")
    app["degree"] = app.get("degree", "")
    app["branch"] = app.get("branch", "")
    app["passout_year"] = app.get("passout_year", 0)
    app["college_percentage"] = app.get("college_percentage", 0.0)
    app["any_arrears"] = app.get("any_arrears", "")
    
    batch = await db.batches.find_one({"_id": ObjectId(app["batch_id"])}) if ObjectId.is_valid(app["batch_id"]) else None
    batch_name = batch.get("name", "Upcoming Batch") if batch else "Upcoming Batch"
    
    # Trigger Email Notification
    try:
        from app.modules.emails.router import log_and_send_email
        from app.modules.emails.schemas import EmailCreate
        
        if status_val == "approved":
            subject = f"Admission Application Approved - {batch_name}"
            body = (
                f"Dear {app['student_name']},\n\n"
                f"Congratulations! Your application for the upcoming batch '{batch_name}' has been approved.\n"
                f"Our admin team will schedule your interview shortly. You will receive a separate email containing the schedule, time, and link once it is set.\n\n"
                f"Best regards,\n"
                f"Admissions Team\n"
                f"Academy Management"
            )
        else:
            subject = f"Admission Application Status Update - {batch_name}"
            body = (
                f"Dear {app['student_name']},\n\n"
                f"Thank you for your interest in our programs and for submitting your application for the upcoming batch '{batch_name}'.\n"
                f"After reviewing your credentials, we regret to inform you that we cannot proceed with your application at this time.\n\n"
                f"We wish you the very best in your academic and professional endeavors.\n\n"
                f"Best regards,\n"
                f"Admissions Team\n"
                f"Academy Management"
            )
            
        email_in = EmailCreate(
            to_email=app["student_email"],
            subject=subject,
            body=body,
            category="general"
        )
        await log_and_send_email(db, email_in)
    except Exception as email_err:
        print(f"Warning: Failed to send application status email notification: {str(email_err)}")
        
    return app

@router.put("/applications/{app_id}/interview", response_model=ApplicationResponse)
async def update_interview_details(
    app_id: str,
    details: InterviewDetailsUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head"]))
):
    """Area Head updates interview details for an approved student application and triggers invitation email."""
    if not ObjectId.is_valid(app_id):
        raise HTTPException(status_code=400, detail="Invalid application ID")
        
    app = await db.applications.find_one({"_id": ObjectId(app_id)})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    if app.get("status") != "approved":
        raise HTTPException(status_code=400, detail="Interview details can only be scheduled for approved applications.")
        
    details_dict = details.model_dump()
    
    await db.applications.update_one(
        {"_id": ObjectId(app_id)},
        {"$set": {"interview_details": details_dict}}
    )
    
    app["interview_details"] = details_dict
    app["id"] = str(app["_id"])
    
    app["age"] = app.get("age", 0)
    app["gender"] = app.get("gender", "")
    app["degree"] = app.get("degree", "")
    app["branch"] = app.get("branch", "")
    app["passout_year"] = app.get("passout_year", 0)
    app["college_percentage"] = app.get("college_percentage", 0.0)
    app["any_arrears"] = app.get("any_arrears", "")
    
    batch = await db.batches.find_one({"_id": ObjectId(app["batch_id"])}) if ObjectId.is_valid(app["batch_id"]) else None
    batch_name = batch.get("name", "Upcoming Batch") if batch else "Upcoming Batch"
    
    # Trigger Interview Email Notification
    try:
        from app.modules.emails.router import log_and_send_email
        from app.modules.emails.schemas import EmailCreate
        
        subject = f"Interview Scheduled - {batch_name}"
        body = (
            f"Dear {app['student_name']},\n\n"
            f"Your interview for the batch '{batch_name}' has been scheduled.\n\n"
            f"Here are the schedule and coordinates:\n"
            f"Date: {details.interview_date}\n"
            f"Time: {details.interview_time}\n"
            f"Meeting Link: {details.interview_link}\n"
        )
        if details.interviewer_notes:
            body += f"Interviewer Notes: {details.interviewer_notes}\n"
            
        body += (
            f"\nPlease make sure to join on time. If you need to reschedule, reply to this email.\n\n"
            f"Best regards,\n"
            f"Admissions Team\n"
            f"Academy Management"
        )
        
        email_in = EmailCreate(
            to_email=app["student_email"],
            subject=subject,
            body=body,
            category="general"
        )
        await log_and_send_email(db, email_in)
    except Exception as email_err:
        print(f"Warning: Failed to send interview invitation email: {str(email_err)}")
        
    return app

@router.get("/applications/{app_id}/download/{doc_type}")
async def download_applicant_document(
    app_id: str,
    doc_type: str,  # marksheet_10th, marksheet_12th, resume, ug_marksheet, provisional_certificate
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head", "associate"]))
):
    """Area Head or Center Associate can view/download applicant uploaded files."""
    if not ObjectId.is_valid(app_id):
        raise HTTPException(status_code=400, detail="Invalid application ID")
        
    app = await db.applications.find_one({"_id": ObjectId(app_id)})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    doc_url_field = f"{doc_type}_url"
    if doc_type == "resume":
        doc_url_field = "resume_url"
        
    filepath = app.get(doc_url_field)
    if not filepath:
        raise HTTPException(status_code=404, detail=f"No document uploaded for {doc_type}")
        
    # Check if Cloudinary URL or local path
    if filepath.startswith("http://") or filepath.startswith("https://"):
        return RedirectResponse(filepath)
    else:
        # Local file
        if filepath.startswith("/static/"):
            local_path = filepath.replace("/static/", "")
        else:
            local_path = filepath
            
        if not os.path.exists(local_path):
            raise HTTPException(status_code=404, detail="File not found on server")
            
        filename = os.path.basename(local_path)
        return FileResponse(
            path=local_path,
            filename=filename,
            media_type="application/octet-stream"
        )

