import math
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.database import get_db
from app.modules.auth.service import get_current_user, require_role
from app.modules.geo_attendance.schemas import (
    GeoCenterCreate,
    GeoCenterResponse,
    GeoCenterUpdate,
    StudentCenterAssign,
    StudentCenterAssignBulk,
    GeoAttendanceMark,
    GeoAttendanceResponse,
    GeoAttendanceCorrect
)

router = APIRouter(prefix="/geo-attendance", tags=["Geo-Fenced Attendance"])

# Timezone helpers for IST (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

def get_current_ist_time() -> datetime:
    return datetime.now(timezone.utc).astimezone(IST)

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in meters."""
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def serialize_doc(doc) -> dict:
    if not doc:
        return {}
    doc["id"] = str(doc["_id"])
    if "open_time" not in doc:
        doc["open_time"] = "09:30"
    if "close_time" not in doc:
        doc["close_time"] = "17:30"
    if "late_time" not in doc:
        doc["late_time"] = "11:00"
    return doc

# --- CENTERS MANAGEMENT (HEAD ADMIN) ---

@router.get("/centers", response_model=List[GeoCenterResponse])
async def list_centers(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List all physical training centers. Allowed: Head Admin, Center Associate."""
    if current_user.get("role") not in ["head", "associate"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view training centers list."
        )
    
    cursor = db.geo_centers.find()
    centers = []
    async for doc in cursor:
        centers.append(GeoCenterResponse(**serialize_doc(doc)))
    return centers

@router.post("/centers", response_model=GeoCenterResponse, status_code=status.HTTP_201_CREATED)
async def create_center(
    payload: GeoCenterCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_role(["head"]))
):
    """Create a new training center with coordinates and geofence radius. Allowed: Head Admin."""
    center_dict = payload.model_dump()
    result = await db.geo_centers.insert_one(center_dict)
    center_dict["id"] = str(result.inserted_id)
    return GeoCenterResponse(**center_dict)

@router.put("/centers/{center_id}", response_model=GeoCenterResponse)
async def update_center(
    center_id: str,
    payload: GeoCenterUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_role(["head"]))
):
    """Update training center coordinate settings. Allowed: Head Admin."""
    if not ObjectId.is_valid(center_id):
        raise HTTPException(status_code=400, detail="Invalid center ID format.")
    
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update provided.")

    result = await db.geo_centers.find_one_and_update(
        {"_id": ObjectId(center_id)},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Center not found.")
    return GeoCenterResponse(**serialize_doc(result))

@router.delete("/centers/{center_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_center(
    center_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_role(["head"]))
):
    """Delete center configuration. Allowed: Head Admin."""
    if not ObjectId.is_valid(center_id):
        raise HTTPException(status_code=400, detail="Invalid center ID format.")
    
    result = await db.geo_centers.delete_one({"_id": ObjectId(center_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Center not found.")
    
    # Reset center assignment for users
    await db.users.update_many({"center_id": center_id}, {"$set": {"center_id": None}})

# --- ASSIGNMENT & STUDENTS INFO ---

@router.get("/student-center", response_model=GeoCenterResponse)
async def get_student_center(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve center metadata of active student. Allowed: Student."""
    center_id = current_user.get("center_id")
    if not center_id:
        raise HTTPException(status_code=404, detail="You are not assigned to any physical center. Please contact admin.")
    
    if not ObjectId.is_valid(center_id):
        raise HTTPException(status_code=400, detail="Corrupted center ID assignment mapping.")
        
    center = await db.geo_centers.find_one({"_id": ObjectId(center_id)})
    if not center:
        raise HTTPException(status_code=404, detail="Assigned center configuration could not be found.")
    return GeoCenterResponse(**serialize_doc(center))

@router.post("/assign-center")
async def assign_user_center(
    payload: StudentCenterAssign,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Map a student or associate to a physical center. Allowed: Head Admin, Center Associate."""
    role = current_user.get("role")
    if role not in ["head", "associate"]:
        raise HTTPException(status_code=403, detail="Not authorized to assign users to centers.")

    if payload.center_id:
        if not ObjectId.is_valid(payload.center_id):
            raise HTTPException(status_code=400, detail="Invalid center ID format.")
        center = await db.geo_centers.find_one({"_id": ObjectId(payload.center_id)})
        if not center:
            raise HTTPException(status_code=404, detail="Center to assign does not exist.")

        # Associate can only assign students to their own center
        if role == "associate" and current_user.get("center_id") != payload.center_id:
            raise HTTPException(status_code=403, detail="Center associates can only assign students to their own center.")

    if not ObjectId.is_valid(payload.user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID format.")

    target_user = await db.users.find_one({"_id": ObjectId(payload.user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found.")

    if role == "associate" and target_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Center associates can only manage assignments for student users.")

    await db.users.update_one(
        {"_id": ObjectId(payload.user_id)},
        {"$set": {"center_id": payload.center_id}}
    )
    return {"status": "success", "message": f"User assigned to center successfully."}

@router.post("/assign-center/bulk")
async def assign_users_center_bulk(
    payload: StudentCenterAssignBulk,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Map multiple students/associates to a physical center. Allowed: Head Admin, Center Associate."""
    role = current_user.get("role")
    if role not in ["head", "associate"]:
        raise HTTPException(status_code=403, detail="Not authorized to assign users to centers.")

    if payload.center_id:
        if not ObjectId.is_valid(payload.center_id):
            raise HTTPException(status_code=400, detail="Invalid center ID format.")
        center = await db.geo_centers.find_one({"_id": ObjectId(payload.center_id)})
        if not center:
            raise HTTPException(status_code=404, detail="Center to assign does not exist.")

        if role == "associate" and current_user.get("center_id") != payload.center_id:
            raise HTTPException(status_code=403, detail="Center associates can only assign students to their own center.")

    valid_object_ids = []
    for uid in payload.user_ids:
        if not ObjectId.is_valid(uid):
            raise HTTPException(status_code=400, detail=f"Invalid user ID format: {uid}")
        valid_object_ids.append(ObjectId(uid))

    if not valid_object_ids:
        raise HTTPException(status_code=400, detail="No user IDs provided.")

    if role == "associate":
        non_student = await db.users.find_one({
            "_id": {"$in": valid_object_ids},
            "role": {"$ne": "student"}
        })
        if non_student:
            raise HTTPException(status_code=403, detail="Center associates can only manage assignments for student users.")

    await db.users.update_many(
        {"_id": {"$in": valid_object_ids}},
        {"$set": {"center_id": payload.center_id}}
    )
    return {"status": "success", "message": f"Successfully assigned {len(valid_object_ids)} users to center."}

@router.get("/students")
async def list_students_and_centers(
    center_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve students and their center assignment status. Allowed: Head Admin, Center Associate."""
    role = current_user.get("role")
    if role not in ["head", "associate"]:
        raise HTTPException(status_code=403, detail="Not authorized to view student assignments.")

    query = {"role": {"$in": ["student", "associate"]}}
    
    if role == "associate":
        # Associate can see users in their center or unassigned students
        my_center = current_user.get("center_id")
        if not my_center:
            return []  # Associate not assigned yet
        query = {
            "role": "student",
            "$or": [
                {"center_id": my_center},
                {"center_id": None},
                {"center_id": {"$exists": False}}
            ]
        }
    elif center_id:
        query["center_id"] = center_id

    cursor = db.users.find(query)
    users = []
    async for u in cursor:
        users.append({
            "id": str(u["_id"]),
            "name": u["name"],
            "email": u["email"],
            "role": u["role"],
            "batch_id": u.get("batch_id"),
            "center_id": u.get("center_id")
        })
    return users

# --- ATTENDANCE MARKING & HISTORY ---

@router.post("/mark", response_model=GeoAttendanceResponse)
async def mark_attendance(
    payload: GeoAttendanceMark,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_role(["student"]))
):
    """Record student check-in with geo-fencing rules and server time. Allowed: Student."""
    center_id = current_user.get("center_id")
    if not center_id:
        raise HTTPException(status_code=400, detail="No training center assigned to your account. Please contact coordinator.")

    # Get Assigned Center coordinates
    center = await db.geo_centers.find_one({"_id": ObjectId(center_id)})
    if not center:
        raise HTTPException(status_code=404, detail="Physical center mapping could not be found.")

    # Time validation in IST
    ist_now = get_current_ist_time()
    
    # 1. Day of the week check (Monday-Saturday are working days, Sunday is off)
    if ist_now.weekday() == 6: # Sunday
        raise HTTPException(status_code=400, detail="Attendance check-in is not open on Sundays.")

    # 2. Daily window check based on Center dynamic times
    open_str = center.get("open_time", "09:30")
    close_str = center.get("close_time", "17:30")
    late_str = center.get("late_time", "11:00")

    try:
        open_h, open_m = map(int, open_str.split(":"))
        close_h, close_m = map(int, close_str.split(":"))
        late_h, late_m = map(int, late_str.split(":"))
    except Exception:
        open_h, open_m = 9, 30
        close_h, close_m = 17, 30
        late_h, late_m = 11, 0

    open_time = ist_now.replace(hour=open_h, minute=open_m, second=0, microsecond=0)
    close_time = ist_now.replace(hour=close_h, minute=close_m, second=0, microsecond=0)
    late_threshold = ist_now.replace(hour=late_h, minute=late_m, second=0, microsecond=0)
    
    if ist_now < open_time or ist_now > close_time:
        raise HTTPException(
            status_code=400,
            detail=f"Attendance window is closed. Attendance is open from {open_str} to {close_str} (Current time: {ist_now.strftime('%I:%M %p')})."
        )

    # 3. Duplicate check for today (IST Date string format)
    today_str = ist_now.strftime("%Y-%m-%d")
    existing = await db.geo_attendance_records.find_one({
        "student_id": current_user["id"],
        "date": today_str
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already marked your attendance for today.")

    # 4. Geo-fence validation
    distance = calculate_haversine_distance(
        payload.latitude, payload.longitude,
        center["latitude"], center["longitude"]
    )
    
    radius = center.get("radius_meters", 150.0)
    if distance > radius:
        raise HTTPException(
            status_code=400,
            detail=f"You are outside the attendance area. Calculated distance: {round(distance, 1)}m. Geofence radius: {radius}m."
        )

    # Determine status (Present vs. Late)
    status_flag = "PRESENT" if ist_now <= late_threshold else "LATE"

    record_dict = {
        "student_id": current_user["id"],
        "student_name": current_user["name"],
        "student_email": current_user["email"],
        "batch_id": current_user.get("batch_id"),
        "center_id": str(center["_id"]),
        "center_name": center["name"],
        "date": today_str,
        "marked_at": ist_now.isoformat(),  # Store IST time directly for correct display
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "distance": distance,
        "gps_accuracy": payload.gps_accuracy,
        "status": status_flag,
        "verification_status": "verified",
        "corrected_by": None,
        "correction_reason": None,
        "corrected_at": None,
        "correction_history": []
    }

    result = await db.geo_attendance_records.insert_one(record_dict)
    record_dict["id"] = str(result.inserted_id)
    return GeoAttendanceResponse(**record_dict)

@router.get("/history", response_model=List[GeoAttendanceResponse])
async def view_own_attendance(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_role(["student"]))
):
    """Retrieve attendance log history for active student. Allowed: Student."""
    cursor = db.geo_attendance_records.find({"student_id": current_user["id"]}).sort("date", -1)
    records = []
    async for r in cursor:
        records.append(GeoAttendanceResponse(**serialize_doc(r)))
    return records

# --- REPORTING & CORRECTIONS ---

@router.get("/records", response_model=List[GeoAttendanceResponse])
async def list_attendance_records(
    date: Optional[str] = None,
    center_id: Optional[str] = None,
    batch_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve attendance logs for centers, batches or dates. Allowed: Head Admin, Center Associate, Trainer."""
    role = current_user.get("role")
    if role not in ["head", "associate", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized to view geo-attendance records.")

    query = {}
    
    # 1. Enforce Role restrictions
    if role == "associate":
        my_center = current_user.get("center_id")
        if not my_center:
            return []  # Not assigned to center yet
        query["center_id"] = my_center
    elif role == "trainer":
        # Trainer can only check their assigned batches
        assigned_batches = current_user.get("classes_assigned") or []
        if current_user.get("batch_id"):
            assigned_batches.append(current_user.get("batch_id"))
        
        if not assigned_batches:
            return []  # No assigned batches to monitor
        query["batch_id"] = {"$in": assigned_batches}

    # 2. Apply optional filters
    if date:
        query["date"] = date
    if center_id and role == "head":  # Head admin can filter by center_id
        query["center_id"] = center_id
    if batch_id:
        query["batch_id"] = batch_id

    cursor = db.geo_attendance_records.find(query).sort("marked_at", -1)
    records = []
    async for r in cursor:
        records.append(GeoAttendanceResponse(**serialize_doc(r)))
    return records

@router.post("/records/{record_id}/correct", response_model=GeoAttendanceResponse)
async def correct_attendance(
    record_id: str,
    payload: GeoAttendanceCorrect,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Perform a manual adjustment on a check-in status with audit fields. Allowed: Head Admin, Center Associate."""
    role = current_user.get("role")
    if role not in ["head", "associate"]:
        raise HTTPException(status_code=403, detail="Not authorized to correct attendance logs.")

    if not ObjectId.is_valid(record_id):
        raise HTTPException(status_code=400, detail="Invalid record ID format.")

    record = await db.geo_attendance_records.find_one({"_id": ObjectId(record_id)})
    if not record:
        raise HTTPException(status_code=404, detail="Attendance log record not found.")

    # Associate can only update records for their assigned center
    if role == "associate":
        my_center = current_user.get("center_id")
        if not my_center or record["center_id"] != my_center:
            raise HTTPException(status_code=403, detail="Associates can only correct records belonging to their assigned center.")

    # Perform updates and append history audit log
    ist_now = get_current_ist_time()
    
    correction_history = record.get("correction_history") or []
    correction_entry = {
        "status": payload.status,
        "corrected_by": current_user["email"],
        "reason": payload.reason,
        "corrected_at": ist_now.isoformat()
    }
    correction_history.append(correction_entry)

    update_payload = {
        "status": payload.status,
        "verification_status": "manual_correction",
        "corrected_by": current_user["email"],
        "correction_reason": payload.reason,
        "corrected_at": ist_now.isoformat(),
        "correction_history": correction_history
    }

    result = await db.geo_attendance_records.find_one_and_update(
        {"_id": ObjectId(record_id)},
        {"$set": update_payload},
        return_document=True
    )
    return GeoAttendanceResponse(**serialize_doc(result))
