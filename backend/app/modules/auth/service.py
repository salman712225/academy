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
    return user

def require_role(allowed_roles: List[str]):
    async def role_dependency(current_user = Depends(get_current_user)):
        # Area Head ('head') inherits all privileges of 'trainer' / 'teacher' and other roles, 
        # but let's be explicit: if head has all access, they are automatically allowed.
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
