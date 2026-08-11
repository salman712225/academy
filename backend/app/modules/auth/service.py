from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timezone
from typing import List

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, decode_access_token
from app.modules.auth.schemas import UserCreate
from app.core.config import settings

reusable_oauth2 = HTTPBearer()

async def get_user_by_email(db: AsyncIOMotorDatabase, email: str):
    user = await db.users.find_one({"email": email.lower()})
    if user:
        user["id"] = str(user["_id"])
    return user

async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str):
    if not ObjectId.is_valid(user_id):
        return None
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user:
        user["id"] = str(user["_id"])
    return user

async def create_user(db: AsyncIOMotorDatabase, user_in: UserCreate):
    existing_user = await get_user_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    user_dict = user_in.model_dump()
    user_dict["email"] = user_dict["email"].lower()
    user_dict["password_hash"] = get_password_hash(user_dict.pop("password"))
    user_dict["created_at"] = datetime.now(timezone.utc)
    
    result = await db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    return user_dict

async def authenticate_user(db: AsyncIOMotorDatabase, email: str, password: str):
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user

DEFAULT_ROLE_PERMISSIONS = {
    "trainer": {
        "upload_attendance": True,
        "view_attendance": True,
        "manage_library": False,
        "manage_leads": False,
        "manage_events": True,
        "manage_notes": True,
        "manage_resumes": True,
        "manage_tests": True,
        "ai_placement_suite": True,
        "digital_library": True,
        "manage_applications": False,
    },
    "associate": {
        "upload_attendance": False,
        "view_attendance": True,
        "manage_library": True,
        "manage_leads": True,
        "manage_events": True,
        "manage_notes": False,
        "manage_resumes": False,
        "manage_tests": False,
        "ai_placement_suite": False,
        "digital_library": False,
        "manage_applications": True,
    },
    "student": {
        "upload_attendance": False,
        "view_attendance": True,
        "manage_library": True,
        "manage_leads": True,
        "manage_events": True,
        "manage_notes": True,
        "manage_resumes": True,
        "manage_tests": True,
        "ai_placement_suite": True,
        "digital_library": True,
        "manage_applications": False,
    }
}

def get_default_permissions_for_role(role: str) -> dict:
    return DEFAULT_ROLE_PERMISSIONS.get(role, {})

async def get_role_permissions(db: AsyncIOMotorDatabase, role: str) -> dict:
    if role == "head":
        return {
            "upload_attendance": True,
            "view_attendance": True,
            "manage_library": True,
            "manage_leads": True,
            "manage_events": True,
            "manage_notes": True,
            "manage_resumes": True,
            "manage_tests": True,
            "ai_placement_suite": True,
            "digital_library": True,
            "manage_applications": True,
        }
    doc = await db.role_permissions.find_one({"role": role})
    if doc:
        return doc.get("permissions", {})
    return get_default_permissions_for_role(role)

async def attach_permissions_to_user(db: AsyncIOMotorDatabase, user: dict):
    if user:
        user["permissions"] = await get_role_permissions(db, user.get("role"))
    return user

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(reusable_oauth2),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    token = credentials.credentials
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    await attach_permissions_to_user(db, user)
    return user

def require_role(allowed_roles: List[str]):
    async def role_dependency(current_user = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role == "head":
            return current_user
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user_role}' is not authorized. Required: {allowed_roles}"
            )
        return current_user
    return role_dependency

def require_permission(permission_name: str):
    async def permission_dependency(
        current_user = Depends(get_current_user),
        db: AsyncIOMotorDatabase = Depends(get_db)
    ):
        user_role = current_user.get("role")
        if user_role == "head":
            return current_user
        
        permissions = current_user.get("permissions") or {}
        if not permissions.get(permission_name, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Role '{user_role}' does not have the required permission '{permission_name}'."
            )
        return current_user
    return permission_dependency

async def seed_head_user(db: AsyncIOMotorDatabase):
    """Seed default Area Head admin account on startup."""
    existing_head = await db.users.find_one({"role": "head"})
    if not existing_head:
        head_in = UserCreate(
            email=settings.SEED_HEAD_EMAIL,
            name=settings.SEED_HEAD_NAME,
            role="head",
            password=settings.SEED_HEAD_PASSWORD
        )
        await create_user(db, head_in)
        print(f"--- Seeded default Area Head: {settings.SEED_HEAD_EMAIL} / {settings.SEED_HEAD_PASSWORD} ---")
