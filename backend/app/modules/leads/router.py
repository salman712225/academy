from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timezone
from typing import List

from app.core.database import get_db
from app.modules.auth.service import require_role, require_permission
from app.modules.leads.schemas import LeadCreate, LeadUpdate, LeadResponse

router = APIRouter(prefix="/leads", tags=["Lead Generation"])

@router.post("/", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(
    lead_in: LeadCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_permission("manage_leads"))
):
    """Create a new job opportunity/lead."""
    if current_user.get("role") == "student":
        raise HTTPException(status_code=403, detail="Students are not authorized to create job leads.")
        
    lead_dict = lead_in.model_dump()
    lead_dict["created_at"] = datetime.now(timezone.utc)
    
    result = await db.leads.insert_one(lead_dict)
    lead_dict["id"] = str(result.inserted_id)
    return lead_dict

@router.get("/", response_model=List[LeadResponse])
async def list_leads(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_permission("manage_leads"))
):
    """List all leads. Accessible to roles with manage_leads permission."""
    cursor = db.leads.find()
    leads = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        leads.append(doc)
    return leads

@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str,
    lead_in: LeadUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_permission("manage_leads"))
):
    """Update a specific lead."""
    if current_user.get("role") == "student":
        raise HTTPException(status_code=403, detail="Students are not authorized to update job leads.")
        
    if not ObjectId.is_valid(lead_id):
        raise HTTPException(status_code=400, detail="Invalid lead ID format.")
        
    update_data = {k: v for k, v in lead_in.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")
        
    result = await db.leads.find_one_and_update(
        {"_id": ObjectId(lead_id)},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Lead not found.")
        
    result["id"] = str(result["_id"])
    return result

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    lead_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_permission("manage_leads"))
):
    """Delete a specific lead."""
    if current_user.get("role") == "student":
        raise HTTPException(status_code=403, detail="Students are not authorized to delete job leads.")
        
    if not ObjectId.is_valid(lead_id):
        raise HTTPException(status_code=400, detail="Invalid lead ID format.")
        
    result = await db.leads.delete_one({"_id": ObjectId(lead_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found.")
        
    return None
