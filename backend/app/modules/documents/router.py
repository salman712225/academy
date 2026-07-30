import os
import shutil
import uuid
from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.modules.auth.service import get_current_user, require_role
from app.modules.documents.schemas import NoteResponse, ResumeResponse

router = APIRouter(prefix="/documents", tags=["Document Management"])

@router.post("/notes/upload", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def upload_note(
    title: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head", "trainer"]))
):
    # Validate extension
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pdf", ".ppt", ".pptx"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF, PPT, and PPTX are allowed for course notes."
        )
    
    # Generate unique filename to avoid overwrites
    unique_filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join("uploads", "notes", unique_filename)
    
    # Save file locally
    os.makedirs(os.path.join("uploads", "notes"), exist_ok=True)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Insert metadata in DB
    note_id = str(uuid.uuid4())
    note_doc = {
        "_id": note_id,
        "title": title,
        "description": description,
        "filename": filename,
        "filepath": f"uploads/notes/{unique_filename}",
        "uploaded_by": current_user["email"],
        "uploaded_at": datetime.now(timezone.utc)
    }
    await db.notes.insert_one(note_doc)
    
    # Format response
    note_doc["id"] = note_doc["_id"]
    return note_doc

@router.get("/notes", response_model=List[NoteResponse])
async def list_notes(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    cursor = db.notes.find().sort("uploaded_at", -1)
    notes = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        notes.append(doc)
    return notes

@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head", "trainer"]))
):
    note = await db.notes.find_one({"_id": note_id})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    # Delete from DB
    await db.notes.delete_one({"_id": note_id})
    
    # Delete local file
    filepath = note.get("filepath")
    if filepath and os.path.exists(filepath):
        try:
            os.remove(filepath)
        except Exception:
            pass
            
    return

@router.post("/resumes/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["student"]))
):
    # Validate extension
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Resumes must be in PDF format."
        )
        
    student_email = current_user["email"].lower()
    student_name = current_user.get("name", "Student")
    
    # Save file locally
    unique_filename = f"{student_email.replace('@', '_').replace('.', '_')}_{uuid.uuid4()}{ext}"
    filepath = os.path.join("uploads", "resumes", unique_filename)
    
    os.makedirs(os.path.join("uploads", "resumes"), exist_ok=True)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Upsert in DB
    existing_resume = await db.resumes.find_one({"student_email": student_email})
    
    if existing_resume:
        old_path = existing_resume.get("filepath")
        if old_path and os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass
                
    resume_id = existing_resume["_id"] if existing_resume else str(uuid.uuid4())
    
    resume_doc = {
        "student_email": student_email,
        "student_name": student_name,
        "filename": filename,
        "filepath": f"uploads/resumes/{unique_filename}",
        "uploaded_at": datetime.now(timezone.utc)
    }
    
    await db.resumes.update_one(
        {"student_email": student_email},
        {"$set": resume_doc},
        upsert=True
    )
    
    # Retrieve the document to return correct ID
    updated_doc = await db.resumes.find_one({"student_email": student_email})
    updated_doc["id"] = str(updated_doc["_id"])
    return updated_doc

@router.get("/resumes", response_model=List[ResumeResponse])
async def list_resumes(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head", "trainer"]))
):
    cursor = db.resumes.find().sort("uploaded_at", -1)
    resumes = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        resumes.append(doc)
    return resumes

@router.get("/resumes/my-resume", response_model=ResumeResponse)
async def get_my_resume(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["student"]))
):
    student_email = current_user["email"].lower()
    resume = await db.resumes.find_one({"student_email": student_email})
    if not resume:
        raise HTTPException(status_code=404, detail="No resume uploaded yet")
    resume["id"] = str(resume["_id"])
    return resume

@router.get("/notes/{note_id}/download")
async def download_note(
    note_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    note = await db.notes.find_one({"_id": note_id})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    filepath = note["filepath"]
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found on server")
        
    return FileResponse(
        path=filepath,
        filename=note["filename"],
        media_type="application/octet-stream"
    )

@router.get("/resumes/{resume_id}/download")
async def download_resume(
    resume_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        query_id = ObjectId(resume_id)
    except Exception:
        query_id = resume_id

    resume = await db.resumes.find_one({"_id": query_id})
    if not resume:
        resume = await db.resumes.find_one({"_id": resume_id})
        
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    user_role = current_user.get("role")
    user_email = current_user["email"].lower()
    
    if user_role not in ["head", "trainer"] and user_email != resume["student_email"].lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to download this resume."
        )
        
    filepath = resume["filepath"]
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found on server")
        
    return FileResponse(
        path=filepath,
        filename=resume["filename"],
        media_type="application/octet-stream"
    )
