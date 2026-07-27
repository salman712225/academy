from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict
import openpyxl
import io
from datetime import datetime

from app.core.database import get_db
from app.modules.auth.service import require_role, get_current_user
from app.modules.attendance.schemas import AttendanceRecord, StudentAttendanceSummary

router = APIRouter(prefix="/attendance", tags=["Attendance Management"])

EXPECTED_HEADERS = ["StudentEmail", "Date", "Session 1", "Session 2", "Session 3", "Session 4"]

@router.get("/schema", response_model=Dict[str, List[str]])
async def get_attendance_schema(current_user = Depends(get_current_user)):
    """Returns the expected column headers and order for XLSX attendance sheets."""
    return {"expected_columns": EXPECTED_HEADERS}

@router.post("/upload")
async def upload_attendance(
    batch_id: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head", "trainer"]))
):
    """
    Upload an XLSX spreadsheet to update attendance.
    Trainers can only upload for batches assigned to them.
    """
    # 1. Authorize trainer check
    user_role = current_user.get("role")
    if user_role != "head":
        assigned_classes = current_user.get("classes_assigned") or []
        if batch_id not in assigned_classes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You are not assigned to class/batch '{batch_id}' and cannot upload attendance for it."
            )
            
    # Verify batch exists
    batch = await db.batches.find_one({"name": batch_id})
    if not batch:
        # Fallback to check by string or ID
        pass

    # 2. Parse XLSX
    try:
        contents = await file.read()
        workbook = openpyxl.load_workbook(io.BytesIO(contents), data_only=True)
        sheet = workbook.active
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse Excel file: {str(e)}")

    # 3. Read headers
    header_row = [cell.value for cell in sheet[1]]
    # Match basic columns
    for expected in EXPECTED_HEADERS:
        if expected not in header_row:
            raise HTTPException(
                status_code=400,
                detail=f"Columns mismatch. Expected: {EXPECTED_HEADERS}. Found: {header_row}"
            )

    header_indices = {name: header_row.index(name) for name in EXPECTED_HEADERS}
    records_added = 0
    errors = []

    # 4. Insert/Upsert records
    # We iterate starting row 2
    for r_idx in range(2, sheet.max_row + 1):
        row = sheet[r_idx]
        # Skip fully empty rows
        if not any(cell.value is not None for cell in row):
            continue
            
        try:
            student_email = str(row[header_indices["StudentEmail"]].value).strip().lower()
            date_val = row[header_indices["Date"]].value
            
            # Format date (could be datetime object or string from Excel)
            if isinstance(date_val, datetime):
                date_str = date_val.strftime("%Y-%m-%d")
            else:
                date_str = str(date_val).strip()
                # Basic YYYY-MM-DD validation check
                datetime.strptime(date_str, "%Y-%m-%d")

            session_1 = str(row[header_indices["Session 1"]].value or "None").strip()
            session_2 = str(row[header_indices["Session 2"]].value or "None").strip()
            session_3 = str(row[header_indices["Session 3"]].value or "None").strip()
            session_4 = str(row[header_indices["Session 4"]].value or "None").strip()

            # Clean/validate values
            valid_states = ["Present", "Absent", "Late", "None"]
            session_1 = session_1 if session_1 in valid_states else "None"
            session_2 = session_2 if session_2 in valid_states else "None"
            session_3 = session_3 if session_3 in valid_states else "None"
            session_4 = session_4 if session_4 in valid_states else "None"

            # Check if student exists in the database
            student = await db.users.find_one({"email": student_email, "role": "student"})
            if not student:
                errors.append(f"Row {r_idx}: Student email '{student_email}' does not exist in DB.")
                continue

            # Upsert
            await db.attendance.update_one(
                {
                    "student_email": student_email,
                    "batch_id": batch_id,
                    "date": date_str
                },
                {
                    "$set": {
                        "session_1": session_1,
                        "session_2": session_2,
                        "session_3": session_3,
                        "session_4": session_4,
                        "uploaded_by": current_user["email"]
                    }
                },
                upsert=True
            )
            records_added += 1

        except Exception as err:
            errors.append(f"Row {r_idx}: Formatting error. Details: {str(err)}")

    return {
        "message": f"Successfully processed {records_added} attendance records.",
        "warnings_errors": errors
    }

@router.get("/my-attendance", response_model=StudentAttendanceSummary)
async def get_my_attendance(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["student"]))
):
    """Retrieve logged-in student's daily attendance records."""
    student_email = current_user["email"].lower()
    cursor = db.attendance.find({"student_email": student_email}).sort("date", -1)
    
    records = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        records.append(doc)
        
    return {
        "student_email": student_email,
        "records": records
    }

@router.get("/batch/{batch_id}", response_model=List[AttendanceRecord])
async def get_batch_attendance(
    batch_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head", "trainer", "associate"]))
):
    """List attendance logs for a specific batch. Trainers are restricted to assigned classes."""
    user_role = current_user.get("role")
    if user_role not in ["head", "associate"]:
        assigned_classes = current_user.get("classes_assigned") or []
        if batch_id not in assigned_classes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You are not assigned to class/batch '{batch_id}'."
            )
            
    cursor = db.attendance.find({"batch_id": batch_id}).sort("date", -1)
    records = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        records.append(doc)
    return records
