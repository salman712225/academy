from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timezone
from typing import List

from app.core.database import get_db
from app.modules.auth.service import require_role, get_current_user
from app.modules.batches.schemas import BatchCreate, BatchResponse, ApplicationCreate, ApplicationResponse

router = APIRouter(prefix="/batches", tags=["Batches & Openings"])

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
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Retrieve list of batch openings. Can be filtered by is_open."""
    query = {}
    if open_only:
        query["is_open"] = True
        
    cursor = db.batches.find(query)
    batches = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        batches.append(doc)
    return batches

@router.post("/{batch_id}/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_to_batch(
    batch_id: str,
    app_in: ApplicationCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Customers/Students apply to a batch opening."""
    if not ObjectId.is_valid(batch_id):
        raise HTTPException(status_code=400, detail="Invalid batch ID")
        
    batch = await db.batches.find_one({"_id": ObjectId(batch_id)})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch opening not found")
        
    if not batch.get("is_open", False):
        raise HTTPException(status_code=400, detail="This batch opening is closed for applications")
        
    # Check if they already applied to this batch
    existing_app = await db.applications.find_one({
        "batch_id": batch_id,
        "student_email": app_in.student_email.lower()
    })
    if existing_app:
        raise HTTPException(status_code=400, detail="You have already applied for this batch")
        
    app_dict = app_in.model_dump()
    app_dict["batch_id"] = batch_id
    app_dict["student_email"] = app_dict["student_email"].lower()
    app_dict["status"] = "pending"
    app_dict["applied_at"] = datetime.now(timezone.utc)
    
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
    
    # If approved and student doesn't exist as user, we could automatically promote them to Student role.
    # For now we will update it in the database and display.
    return app
