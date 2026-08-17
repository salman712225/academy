from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timezone
from typing import List

from app.core.database import get_db
from app.modules.auth.service import require_role, get_current_user, require_permission
from app.modules.events.schemas import EventCreate, EventResponse

router = APIRouter(prefix="/events", tags=["Events & Calendar"])

@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_in: EventCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_permission("manage_events"))
):
    """Area Head or Associate creates a new event."""
    if current_user.get("role") == "student":
        raise HTTPException(status_code=403, detail="Students are not authorized to create events.")
        
    event_dict = event_in.model_dump()
    event_dict["created_by"] = current_user["email"]
    event_dict["created_at"] = datetime.now(timezone.utc)
    
    # Store event date as a timezone-aware datetime (ensures it matches date validation)
    # The Pydantic model 'date' field will auto-parse the ISO format.
    result = await db.events.insert_one(event_dict)
    event_dict["id"] = str(result.inserted_id)
    return event_dict

@router.get("/", response_model=List[EventResponse])
async def list_events(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve list of all events, sorted by date."""
    cursor = db.events.find().sort("date", 1) # Sort by date ascending (so soonest is first)
    events = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        events.append(doc)
    return events

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_permission("manage_events"))
):
    """Area Head or Associate deletes an event by ID."""
    if current_user.get("role") == "student":
        raise HTTPException(status_code=403, detail="Students are not authorized to delete events.")
        
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID format")
        
    result = await db.events.delete_one({"_id": ObjectId(event_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return None
