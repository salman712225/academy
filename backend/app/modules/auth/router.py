from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from bson import ObjectId

from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash
from app.modules.auth.schemas import UserCreate, UserLogin, UserResponse, Token, UserUpdate
from app.modules.auth.service import (
    create_user,
    authenticate_user,
    get_current_user,
    require_role,
    attach_permissions_to_user,
    get_default_permissions_for_role
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await create_user(db, user_in)
    await attach_permissions_to_user(db, user)
    return user

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    await attach_permissions_to_user(db, user)
    access_token = create_access_token(subject=user["id"])
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
async def read_current_user(current_user = Depends(get_current_user)):
    return current_user


@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head"]))
):
    """Retrieve all users in the academy database."""
    cursor = db.users.find()
    users = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        await attach_permissions_to_user(db, doc)
        users.append(doc)
    return users

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_manually(
    user_in: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head"]))
):
    """Create a new user manually (Area Head admin privilege)."""
    user = await create_user(db, user_in)
    await attach_permissions_to_user(db, user)
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_details(
    user_id: str,
    user_in: UserUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head"]))
):
    """Update a user's details."""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID format.")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    update_dict = {}
    if user_in.name is not None:
        update_dict["name"] = user_in.name
    if user_in.role is not None:
        update_dict["role"] = user_in.role
    if user_in.batch_id is not None:
        update_dict["batch_id"] = user_in.batch_id
    if user_in.email is not None and user_in.email.lower() != user["email"]:
        # Verify email uniqueness
        dup = await db.users.find_one({"email": user_in.email.lower(), "_id": {"$ne": ObjectId(user_id)}})
        if dup:
            raise HTTPException(status_code=400, detail="A user with this email already exists.")
        update_dict["email"] = user_in.email.lower()
    if user_in.password is not None and user_in.password.strip():
        update_dict["password_hash"] = get_password_hash(user_in.password)

    if update_dict:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_dict})

    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    updated_user["id"] = str(updated_user["_id"])
    await attach_permissions_to_user(db, updated_user)
    return updated_user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head"]))
):
    """Delete a user. Prevents deleting if they are a student with active lendings."""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID format.")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # If the user is a student, check if they have active lendings
    if user["role"] == "student":
        active_lending = await db.lendings.find_one({
            "student_email": user["email"].lower(),
            "status": {"$in": ["lent", "overdue"]}
        })
        if active_lending:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete student because they currently have active book lendings (e.g. copy '{active_lending['copy_id']}')."
            )

    await db.users.delete_one({"_id": ObjectId(user_id)})

@router.get("/permissions")
async def get_permissions(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head"]))
):
    """Retrieve permission settings for all roles (Area Head only)."""
    roles = ["trainer", "associate", "student"]
    results = {}
    for role in roles:
        doc = await db.role_permissions.find_one({"role": role})
        if doc:
            results[role] = doc.get("permissions", {})
        else:
            results[role] = get_default_permissions_for_role(role)
    return results

@router.put("/permissions/{role}")
async def update_role_permissions(
    role: str,
    permissions: dict,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head"]))
):
    """Update permissions for a specific role (Area Head only)."""
    if role not in ["trainer", "associate", "student"]:
        raise HTTPException(status_code=400, detail="Invalid role specified.")
        
    await db.role_permissions.update_one(
        {"role": role},
        {"$set": {"permissions": permissions}},
        upsert=True
    )
    return {"status": "success", "role": role, "permissions": permissions}
