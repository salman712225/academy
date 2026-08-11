import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase
import cloudinary
import cloudinary.uploader

from app.core.database import get_db
from app.modules.auth.service import get_current_user
from app.modules.personal_space.schemas import (
    TaskCreate,
    TaskResponse,
    DocumentResponse,
    DocumentCreate,
    DocumentUpdate,
    PersonalSettingsUpdate,
    PersonalSettingsResponse
)
from app.modules.personal_space import service

router = APIRouter(prefix="/personal", tags=["Personal Space"])

# --- Tasks Routes ---

@router.get("/tasks", response_model=List[TaskResponse])
async def list_tasks(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve all daily todo tasks for the current user."""
    return await service.get_user_tasks(db, current_user["id"])

@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new daily todo task for the current user."""
    return await service.create_user_task(db, current_user["id"], task_in)

@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def toggle_task(
    task_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Toggle a task between completed and pending states."""
    task = await service.toggle_user_task(db, current_user["id"], task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or unauthorized")
    return task

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a daily todo task."""
    success = await service.delete_user_task(db, current_user["id"], task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found or unauthorized")


# --- Documents/Plans Routes ---

@router.get("/documents", response_model=List[DocumentResponse])
async def list_documents(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve all personal pages, plans, and files for the current user."""
    return await service.get_user_documents(db, current_user["id"])

@router.post("/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    title: str = Form(...),
    content: Optional[str] = Form(""),
    file: Optional[UploadFile] = File(None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new plan/document and support optional file attachment."""
    file_url = None
    filename = None
    
    if file:
        filename = file.filename
        ext = os.path.splitext(filename)[1].lower()
        
        # Determine upload location
        custom_url = current_user.get("personal_cloudinary_url")
        cloudinary_params = service.parse_cloudinary_url(custom_url) if custom_url else None
        
        if cloudinary_params:
            # Upload to User's custom Cloudinary
            try:
                upload_res = cloudinary.uploader.upload(
                    file.file,
                    resource_type="raw",
                    public_id=f"personal/{current_user['id']}/{str(uuid.uuid4())}_{filename}",
                    **cloudinary_params
                )
                file_url = upload_res["secure_url"]
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Custom Cloudinary upload failed: {str(e)}"
                )
        elif os.environ.get("CLOUDINARY_URL"):
            # Upload to Server default Cloudinary
            try:
                upload_res = cloudinary.uploader.upload(
                    file.file,
                    resource_type="raw",
                    public_id=f"personal/{current_user['id']}/{str(uuid.uuid4())}_{filename}"
                )
                file_url = upload_res["secure_url"]
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Default Cloudinary upload failed: {str(e)}"
                )
        else:
            # Local fallback storage
            unique_filename = f"{uuid.uuid4()}{ext}"
            local_dir = os.path.join("uploads", "personal")
            os.makedirs(local_dir, exist_ok=True)
            local_path = os.path.join(local_dir, unique_filename)
            
            with open(local_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Format as local request static url
            file_url = f"/static/uploads/personal/{unique_filename}"
            
    doc_in = DocumentCreate(
        title=title,
        content=content,
        file_url=file_url,
        filename=filename
    )
    return await service.create_user_document(db, current_user["id"], doc_in)

@router.put("/documents/{doc_id}", response_model=DocumentResponse)
async def update_document(
    doc_id: str,
    title: Optional[str] = Form(None),
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a plan/document title, content, or replace file attachment."""
    file_url = None
    filename = None
    
    if file:
        filename = file.filename
        ext = os.path.splitext(filename)[1].lower()
        
        # Check user custom credentials
        custom_url = current_user.get("personal_cloudinary_url")
        cloudinary_params = service.parse_cloudinary_url(custom_url) if custom_url else None
        
        if cloudinary_params:
            try:
                upload_res = cloudinary.uploader.upload(
                    file.file,
                    resource_type="raw",
                    public_id=f"personal/{current_user['id']}/{str(uuid.uuid4())}_{filename}",
                    **cloudinary_params
                )
                file_url = upload_res["secure_url"]
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Custom Cloudinary upload failed: {str(e)}"
                )
        elif os.environ.get("CLOUDINARY_URL"):
            try:
                upload_res = cloudinary.uploader.upload(
                    file.file,
                    resource_type="raw",
                    public_id=f"personal/{current_user['id']}/{str(uuid.uuid4())}_{filename}"
                )
                file_url = upload_res["secure_url"]
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Default Cloudinary upload failed: {str(e)}"
                )
        else:
            unique_filename = f"{uuid.uuid4()}{ext}"
            local_dir = os.path.join("uploads", "personal")
            os.makedirs(local_dir, exist_ok=True)
            local_path = os.path.join(local_dir, unique_filename)
            
            with open(local_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            file_url = f"/static/uploads/personal/{unique_filename}"

    doc_update = DocumentUpdate(
        title=title,
        content=content,
        file_url=file_url,
        filename=filename
    )
    updated_doc = await service.update_user_document(db, current_user["id"], doc_id, doc_update)
    if not updated_doc:
        raise HTTPException(status_code=404, detail="Document not found or unauthorized")
    return updated_doc

@router.delete("/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a plan/document and clean up its storage file."""
    success = await service.delete_user_document(db, current_user["id"], doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found or unauthorized")


# --- Settings Routes ---

@router.put("/settings", response_model=PersonalSettingsResponse)
async def update_settings(
    settings_in: PersonalSettingsUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update user's personal Cloudinary storage keys."""
    res = await service.update_user_personal_settings(db, current_user["id"], settings_in)
    if not res:
        raise HTTPException(status_code=400, detail="Failed to update settings")
    return res

@router.post("/settings/test")
async def test_cloudinary_settings(
    payload: PersonalSettingsUpdate,
    current_user = Depends(get_current_user)
):
    """Test standard ping request to verify if custom Cloudinary settings connect successfully."""
    url = payload.personal_cloudinary_url
    if not url:
        raise HTTPException(status_code=400, detail="Cloudinary connection string cannot be blank.")
    
    try:
        service.test_cloudinary_connection(url)
        return {"status": "success", "message": "Connection verification succeeded! Pings completed."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
