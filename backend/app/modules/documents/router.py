import os
import shutil
import uuid
import httpx
from datetime import datetime, timezone
from typing import List

import cloudinary
import cloudinary.uploader
from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse, StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.modules.auth.service import get_current_user, require_role, require_permission
from app.modules.documents.schemas import NoteResponse, ResumeResponse

router = APIRouter(prefix="/documents", tags=["Document Management"])

# Helper to extract public_id from Cloudinary URL for deletion
def get_cloudinary_public_id(url: str) -> str:
    try:
        if "/upload/" in url:
            parts = url.split("/upload/")[-1].split("/")
            # Skip version tag (e.g., v1722304910)
            if parts[0].startswith("v") and parts[0][1:].isdigit():
                return "/".join(parts[1:])
            else:
                return "/".join(parts)
    except Exception:
        pass
    return ""

@router.post("/notes/upload", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def upload_note(
    title: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_permission("manage_notes"))
):
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pdf", ".ppt", ".pptx"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF, PPT, and PPTX are allowed for course notes."
        )
    
    note_id = str(uuid.uuid4())
    
    # If Cloudinary is configured, upload to cloud
    if os.environ.get("CLOUDINARY_URL"):
        try:
            upload_result = cloudinary.uploader.upload(
                file.file,
                resource_type="raw",
                public_id=f"notes/{note_id}_{filename}"
            )
            filepath = upload_result["secure_url"]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Cloudinary upload failed: {str(e)}"
            )
    else:
        # Fallback: Save file locally
        unique_filename = f"{uuid.uuid4()}{ext}"
        filepath = f"uploads/notes/{unique_filename}"
        os.makedirs(os.path.join("uploads", "notes"), exist_ok=True)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
    # Insert metadata in DB
    note_doc = {
        "_id": note_id,
        "title": title,
        "description": description,
        "filename": filename,
        "filepath": filepath,
        "uploaded_by": current_user["email"],
        "uploaded_at": datetime.now(timezone.utc)
    }
    await db.notes.insert_one(note_doc)
    
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
    current_user = Depends(require_permission("manage_notes"))
):
    note = await db.notes.find_one({"_id": note_id})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    await db.notes.delete_one({"_id": note_id})
    
    filepath = note.get("filepath")
    if filepath:
        if filepath.startswith("http://") or filepath.startswith("https://"):
            try:
                public_id = get_cloudinary_public_id(filepath)
                if public_id:
                    cloudinary.uploader.destroy(public_id, resource_type="raw")
            except Exception:
                pass
        else:
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except Exception:
                    pass
            
    return

@router.post("/resumes/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_permission("manage_resumes"))
):
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Resumes must be in PDF format."
        )
        
    student_email = current_user["email"].lower()
    student_name = current_user.get("name", "Student")
    
    # Check old resume to delete its file
    existing_resume = await db.resumes.find_one({"student_email": student_email})
    if existing_resume:
        old_path = existing_resume.get("filepath")
        if old_path:
            if old_path.startswith("http://") or old_path.startswith("https://"):
                try:
                    public_id = get_cloudinary_public_id(old_path)
                    if public_id:
                        cloudinary.uploader.destroy(public_id, resource_type="raw")
                except Exception:
                    pass
            else:
                if os.path.exists(old_path):
                    try:
                        os.remove(old_path)
                    except Exception:
                        pass
                        
    resume_id = existing_resume["_id"] if existing_resume else str(uuid.uuid4())
    
    # If Cloudinary is configured, upload to cloud
    if os.environ.get("CLOUDINARY_URL"):
        try:
            unique_filename = f"{student_email.replace('@', '_').replace('.', '_')}_{uuid.uuid4()}{ext}"
            upload_result = cloudinary.uploader.upload(
                file.file,
                resource_type="raw",
                public_id=f"resumes/{unique_filename}"
            )
            filepath = upload_result["secure_url"]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Cloudinary upload failed: {str(e)}"
            )
    else:
        # Fallback: Save file locally
        unique_filename = f"{student_email.replace('@', '_').replace('.', '_')}_{uuid.uuid4()}{ext}"
        filepath = f"uploads/resumes/{unique_filename}"
        os.makedirs(os.path.join("uploads", "resumes"), exist_ok=True)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
    resume_doc = {
        "student_email": student_email,
        "student_name": student_name,
        "filename": filename,
        "filepath": filepath,
        "uploaded_at": datetime.now(timezone.utc)
    }
    
    await db.resumes.update_one(
        {"student_email": student_email},
        {"$set": resume_doc},
        upsert=True
    )
    
    updated_doc = await db.resumes.find_one({"student_email": student_email})
    updated_doc["id"] = str(updated_doc["_id"])
    return updated_doc

@router.get("/resumes", response_model=List[ResumeResponse])
async def list_resumes(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_permission("manage_resumes"))
):
    if current_user.get("role") == "student":
        raise HTTPException(status_code=403, detail="Students are not authorized to view all resumes.")
    cursor = db.resumes.find().sort("uploaded_at", -1)
    resumes = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        resumes.append(doc)
    return resumes

@router.get("/resumes/my-resume", response_model=ResumeResponse)
async def get_my_resume(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_permission("manage_resumes"))
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
    if filepath.startswith("http://") or filepath.startswith("https://"):
        # Stream from Cloudinary
        client = httpx.AsyncClient()
        try:
            req = client.build_request("GET", filepath)
            r = await client.send(req, stream=True, follow_redirects=True)
            if r.status_code != 200:
                await r.aclose()
                await client.aclose()
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND if r.status_code == 404 else status.HTTP_400_BAD_REQUEST,
                    detail=f"Cloudinary file not accessible (Status {r.status_code})"
                )
        except httpx.HTTPError as e:
            await client.aclose()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to connect to Cloudinary: {str(e)}"
            )

        async def file_streamer():
            try:
                async for chunk in r.aiter_bytes():
                    yield chunk
            finally:
                await r.aclose()
                await client.aclose()

        return StreamingResponse(
            file_streamer(),
            headers={"Content-Disposition": f'attachment; filename="{note["filename"]}"'},
            media_type="application/octet-stream"
        )
    else:
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
        resume = await db.resumes.find_one({"_id": query_id})
    except Exception:
        resume = None
        
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
    if filepath.startswith("http://") or filepath.startswith("https://"):
        # Stream from Cloudinary
        client = httpx.AsyncClient()
        try:
            req = client.build_request("GET", filepath)
            r = await client.send(req, stream=True, follow_redirects=True)
            if r.status_code != 200:
                await r.aclose()
                await client.aclose()
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND if r.status_code == 404 else status.HTTP_400_BAD_REQUEST,
                    detail=f"Cloudinary file not accessible (Status {r.status_code})"
                )
        except httpx.HTTPError as e:
            await client.aclose()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to connect to Cloudinary: {str(e)}"
            )

        async def file_streamer():
            try:
                async for chunk in r.aiter_bytes():
                    yield chunk
            finally:
                await r.aclose()
                await client.aclose()

        return StreamingResponse(
            file_streamer(),
            headers={"Content-Disposition": f'attachment; filename="{resume["filename"]}"'},
            media_type="application/octet-stream"
        )
    else:
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File not found on server")
        return FileResponse(
            path=filepath,
            filename=resume["filename"],
            media_type="application/octet-stream"
        )
