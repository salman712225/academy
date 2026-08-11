import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.modules.placements.schemas import PlacementLeadCreate, PlacementLeadUpdate

async def get_student_leads(db: AsyncIOMotorDatabase, student_email: str) -> List[dict]:
    cursor = db.placement_leads.find({"student_email": student_email.lower()})
    leads = await cursor.to_list(length=100)
    # Fetch student name and batch name for responsiveness
    user = await db.users.find_one({"email": student_email.lower()})
    student_name = user.get("name") if user else None
    batch_name = None
    if user and user.get("batch_id"):
        batch = await db.batches.find_one({"_id": user["batch_id"]})
        if batch:
            batch_name = batch.get("name")
            
    for lead in leads:
        lead["id"] = lead["_id"]
        lead["student_name"] = student_name
        lead["batch_name"] = batch_name
    return leads

async def get_all_leads_with_batch(db: AsyncIOMotorDatabase, batch_id_filter: Optional[str] = None) -> List[dict]:
    cursor = db.placement_leads.find({})
    all_leads = await cursor.to_list(length=1000)
    
    # Pre-cache users and batches to avoid N+1 queries
    users = await db.users.find({}).to_list(length=1000)
    user_map = {u["email"].lower(): u for u in users}
    
    batches = await db.batches.find({}).to_list(length=100)
    batch_map = {b["_id"]: b.get("name") for b in batches}
    
    results = []
    for lead in all_leads:
        email = lead["student_email"].lower()
        user = user_map.get(email)
        
        student_name = user.get("name") if user else None
        batch_id = user.get("batch_id") if user else None
        batch_name = batch_map.get(batch_id) if batch_id else None
        
        # Apply filter if provided
        if batch_id_filter and batch_id != batch_id_filter:
            continue
            
        lead["id"] = lead["_id"]
        lead["student_name"] = student_name
        lead["batch_name"] = batch_name
        results.append(lead)
        
    return results

async def create_lead(db: AsyncIOMotorDatabase, student_email: str, lead_in: PlacementLeadCreate) -> dict:
    lead_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    lead_doc = {
        "_id": lead_id,
        "student_email": student_email.lower(),
        "company": lead_in.company,
        "role": lead_in.role,
        "stage": lead_in.stage,
        "salary": lead_in.salary,
        "notes": lead_in.notes,
        "created_at": now,
        "updated_at": now
    }
    
    await db.placement_leads.insert_one(lead_doc)
    lead_doc["id"] = lead_id
    return lead_doc

async def update_lead(db: AsyncIOMotorDatabase, lead_id: str, lead_in: PlacementLeadUpdate, student_email: Optional[str] = None) -> Optional[dict]:
    query = {"_id": lead_id}
    if student_email:
        query["student_email"] = student_email.lower()
        
    existing = await db.placement_leads.find_one(query)
    if not existing:
        return None
        
    update_data = {}
    if lead_in.company is not None:
        update_data["company"] = lead_in.company
    if lead_in.role is not None:
        update_data["role"] = lead_in.role
    if lead_in.stage is not None:
        update_data["stage"] = lead_in.stage
    if lead_in.salary is not None:
        update_data["salary"] = lead_in.salary
    if lead_in.notes is not None:
        update_data["notes"] = lead_in.notes
        
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db.placement_leads.update_one(query, {"$set": update_data})
        
    updated = await db.placement_leads.find_one({"_id": lead_id})
    updated["id"] = updated["_id"]
    return updated

async def delete_lead(db: AsyncIOMotorDatabase, lead_id: str, student_email: Optional[str] = None) -> bool:
    query = {"_id": lead_id}
    if student_email:
        query["student_email"] = student_email.lower()
        
    res = await db.placement_leads.delete_one(query)
    return res.deleted_count > 0

async def get_placement_stats(db: AsyncIOMotorDatabase) -> dict:
    all_leads = await db.placement_leads.find({}).to_list(length=1000)
    total_leads = len(all_leads)
    
    applied = sum(1 for l in all_leads if l.get("stage") == "applied")
    interviewing = sum(1 for l in all_leads if l.get("stage") == "interviewing")
    offer = sum(1 for l in all_leads if l.get("stage") == "offer")
    hired = sum(1 for l in all_leads if l.get("stage") == "hired")
    
    conversion_rate = round((hired / total_leads * 100), 2) if total_leads > 0 else 0.0
    
    # Batch statistics aggregation
    users = await db.users.find({}).to_list(length=1000)
    user_map = {u["email"].lower(): u for u in users}
    
    batches = await db.batches.find({}).to_list(length=100)
    batch_map = {b["_id"]: b.get("name", "Unknown") for b in batches}
    
    batch_stats = {}
    # Initialize batch_stats for existing batches
    for bname in batch_map.values():
        batch_stats[bname] = {"applied": 0, "interviewing": 0, "offer": 0, "hired": 0}
    batch_stats["No Batch"] = {"applied": 0, "interviewing": 0, "offer": 0, "hired": 0}
        
    for lead in all_leads:
        email = lead["student_email"].lower()
        user = user_map.get(email)
        batch_id = user.get("batch_id") if user else None
        bname = batch_map.get(batch_id) if batch_id else "No Batch"
        
        stage = lead.get("stage", "applied")
        if bname not in batch_stats:
            batch_stats[bname] = {"applied": 0, "interviewing": 0, "offer": 0, "hired": 0}
        
        if stage in batch_stats[bname]:
            batch_stats[bname][stage] += 1
            
    return {
        "total_leads": total_leads,
        "applied_count": applied,
        "interviewing_count": interviewing,
        "offer_count": offer,
        "hired_count": hired,
        "conversion_rate": conversion_rate,
        "batch_stats": batch_stats
    }
