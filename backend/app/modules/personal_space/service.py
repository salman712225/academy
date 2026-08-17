import os
from bson import ObjectId
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
import cloudinary
import cloudinary.uploader
import cloudinary.api

from app.modules.personal_space.schemas import (
    TaskCreate,
    DocumentCreate,
    DocumentUpdate,
    PersonalSettingsUpdate
)

# Helper to parse Cloudinary URL
def parse_cloudinary_url(url: str) -> dict:
    if not url:
        return None
    cleaned = url.strip()
    # Strip env variable name prefix if copied directly from dashboard
    if cleaned.startswith("CLOUDINARY_URL="):
        cleaned = cleaned[15:].strip()
        
    if not cleaned.startswith("cloudinary://"):
        return None
    try:
        rest = cleaned[13:]
        if "@" in rest:
            userinfo, cloud_name = rest.split("@", 1)
            if ":" in userinfo:
                api_key, api_secret = userinfo.split(":", 1)
                
                # Strip square brackets, spaces, query parameters and trailing paths
                api_key_clean = api_key.strip("[] ")
                api_secret_clean = api_secret.strip("[] ")
                cloud_name_clean = cloud_name.split("/")[0].split("?")[0].strip("[] ")
                
                return {
                    "cloud_name": cloud_name_clean,
                    "api_key": api_key_clean,
                    "api_secret": api_secret_clean
                }
        return None
    except Exception:
        return None

# Test Cloudinary Connection
def test_cloudinary_connection(url: str) -> bool:
    params = parse_cloudinary_url(url)
    if not params:
        raise ValueError("Invalid Cloudinary URL format. Expected: cloudinary://API_KEY:API_SECRET@CLOUD_NAME")
    try:
        # Pings the Cloudinary server with the specific credentials
        cloudinary.api.ping(**params)
        return True
    except Exception as e:
        raise Exception(f"Cloudinary ping failed: {str(e)}")


# --- Tasks Operations ---

async def get_user_tasks(db: AsyncIOMotorDatabase, user_id: str) -> list:
    cursor = db.personal_tasks.find({"user_id": user_id}).sort("created_at", 1)
    tasks = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        tasks.append(doc)
    return tasks

async def create_user_task(db: AsyncIOMotorDatabase, user_id: str, task_in: TaskCreate) -> dict:
    task_dict = task_in.model_dump()
    task_dict["user_id"] = user_id
    task_dict["created_at"] = datetime.now(timezone.utc)
    
    result = await db.personal_tasks.insert_one(task_dict)
    task_dict["id"] = str(result.inserted_id)
    return task_dict

async def toggle_user_task(db: AsyncIOMotorDatabase, user_id: str, task_id: str) -> dict:
    if not ObjectId.is_valid(task_id):
        return None
    
    task = await db.personal_tasks.find_one({"_id": ObjectId(task_id), "user_id": user_id})
    if not task:
        return None
        
    new_completed = not task.get("completed", False)
    await db.personal_tasks.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"completed": new_completed}}
    )
    task["completed"] = new_completed
    task["id"] = str(task["_id"])
    return task

async def delete_user_task(db: AsyncIOMotorDatabase, user_id: str, task_id: str) -> bool:
    if not ObjectId.is_valid(task_id):
        return False
        
    result = await db.personal_tasks.delete_one({"_id": ObjectId(task_id), "user_id": user_id})
    return result.deleted_count > 0


# --- Documents/Plans Operations ---

async def get_user_documents(db: AsyncIOMotorDatabase, user_id: str) -> list:
    cursor = db.personal_documents.find({"user_id": user_id}).sort("updated_at", -1)
    docs = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        docs.append(doc)
    return docs

async def create_user_document(db: AsyncIOMotorDatabase, user_id: str, doc_in: DocumentCreate) -> dict:
    doc_dict = doc_in.model_dump()
    doc_dict["user_id"] = user_id
    now = datetime.now(timezone.utc)
    doc_dict["created_at"] = now
    doc_dict["updated_at"] = now
    
    result = await db.personal_documents.insert_one(doc_dict)
    doc_dict["id"] = str(result.inserted_id)
    return doc_dict

async def update_user_document(db: AsyncIOMotorDatabase, user_id: str, doc_id: str, doc_update: DocumentUpdate) -> dict:
    if not ObjectId.is_valid(doc_id):
        return None
        
    existing_doc = await db.personal_documents.find_one({"_id": ObjectId(doc_id), "user_id": user_id})
    if not existing_doc:
        return None
        
    update_data = {k: v for k, v in doc_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.personal_documents.update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": update_data}
    )
    
    updated_doc = await db.personal_documents.find_one({"_id": ObjectId(doc_id)})
    updated_doc["id"] = str(updated_doc["_id"])
    return updated_doc

async def delete_user_document(db: AsyncIOMotorDatabase, user_id: str, doc_id: str) -> bool:
    if not ObjectId.is_valid(doc_id):
        return False
        
    # Find doc to check for file deletion
    doc = await db.personal_documents.find_one({"_id": ObjectId(doc_id), "user_id": user_id})
    if not doc:
        return False
        
    # Delete doc record
    result = await db.personal_documents.delete_one({"_id": ObjectId(doc_id)})
    
    # Try deleting associated file if it is stored in Cloudinary
    file_url = doc.get("file_url")
    if file_url:
        try:
            # Check if this is a Cloudinary URL and try deleting it
            if "res.cloudinary.com" in file_url:
                # Extract public ID
                # Format: http://res.cloudinary.com/.../raw/upload/v12345/personal/user_id/filename.ext
                parts = file_url.split("/upload/")
                if len(parts) > 1:
                    subparts = parts[1].split("/", 1)
                    if len(subparts) > 1:
                        # strip version if present (starts with 'v')
                        raw_path = subparts[1]
                        if raw_path.startswith("v") and "/" in raw_path:
                            raw_path = raw_path.split("/", 1)[1]
                        
                        public_id = raw_path
                        # Check user settings for credentials
                        user = await db.users.find_one({"_id": ObjectId(user_id)})
                        custom_url = user.get("personal_cloudinary_url") if user else None
                        cloudinary_params = parse_cloudinary_url(custom_url) if custom_url else None
                        
                        if cloudinary_params:
                            cloudinary.uploader.destroy(public_id, resource_type="raw", **cloudinary_params)
                        elif os.environ.get("CLOUDINARY_URL"):
                            cloudinary.uploader.destroy(public_id, resource_type="raw")
            elif os.path.exists(file_url):
                # Delete local file fallback
                os.remove(file_url)
        except Exception as e:
            print(f"Warning: Failed to clean up document attachment file on delete: {str(e)}")
            
    return result.deleted_count > 0


# --- Settings Operations ---

async def update_user_personal_settings(db: AsyncIOMotorDatabase, user_id: str, settings_in: PersonalSettingsUpdate) -> dict:
    if not ObjectId.is_valid(user_id):
        return None
        
    payload = settings_in.model_dump()
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"personal_cloudinary_url": payload.get("personal_cloudinary_url")}}
    )
    return payload
