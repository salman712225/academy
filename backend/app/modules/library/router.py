from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from typing import List

from app.core.database import get_db, transaction_scope
from app.modules.auth.service import require_role, get_current_user, require_permission
from app.modules.library.schemas import BookCreate, BookResponse, LendRequest, LendingResponse, StudentFineSummary, BookUpdate

router = APIRouter(prefix="/library", tags=["Library Management"])

@router.post("/books", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(
    book_in: BookCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_permission("manage_library"))
):
    """Create a new book with copy unique IDs generated sequentially."""
    existing_book = await db.books.find_one({"isbn": book_in.isbn})
    if existing_book:
        raise HTTPException(
            status_code=400,
            detail=f"Book with ISBN '{book_in.isbn}' already exists."
        )
        
    book_dict = book_in.model_dump()
    # Generate copy list (e.g. unique ID format ISBN-1, ISBN-2, ..., ISBN-N)
    copies = []
    for i in range(1, book_in.quantity + 1):
        copies.append({
            "copy_id": f"{book_in.isbn}-{i}",
            "status": "available",
            "lent_to": None,
            "lent_to_id": None,
            "last_lent_to": None,
            "last_lent_to_id": None
        })
    book_dict["copies"] = copies
    
    result = await db.books.insert_one(book_dict)
    book_dict["id"] = str(result.inserted_id)
    return book_dict

@router.get("/books", response_model=List[BookResponse])
async def list_books(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve all library books with copies."""
    cursor = db.books.find()
    books = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        books.append(doc)
    return books

@router.post("/lend", response_model=LendingResponse)
async def lend_book_copy(
    req: LendRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_permission("manage_library"))
):
    """
    Lend a specific book copy to a student.
    Uses ACID transactions to check availability and set status safely.
    """
    if not ObjectId.is_valid(req.book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID format.")

    # 1. Verify student exists in our user database
    student = await db.users.find_one({"email": req.student_email.lower(), "role": "student"})
    if not student:
        raise HTTPException(
            status_code=404, 
            detail=f"No student found with email '{req.student_email}'."
        )

    # 2. Start database transaction
    async with transaction_scope() as session:
        opts = {"session": session} if session else {}

        # Fetch book
        book = await db.books.find_one({"_id": ObjectId(req.book_id)}, **opts)
        if not book:
            raise HTTPException(status_code=404, detail="Book not found.")

        # Find target copy
        target_copy = None
        for copy in book.get("copies", []):
            if copy["copy_id"] == req.copy_id:
                target_copy = copy
                break

        if not target_copy:
            raise HTTPException(status_code=404, detail=f"Copy ID '{req.copy_id}' not found.")

        if target_copy["status"] != "available":
            raise HTTPException(
                status_code=400, 
                detail=f"Book copy '{req.copy_id}' is currently lent to {target_copy.get('lent_to')}. Collision avoided."
            )

        # 3. Update copy status to 'lent'
        await db.books.update_one(
            {"_id": ObjectId(req.book_id), "copies.copy_id": req.copy_id},
            {"$set": {
                "copies.$.status": "lent",
                "copies.$.lent_to": req.student_email.lower(),
                "copies.$.lent_to_id": str(student["_id"]),
                "copies.$.last_lent_to": req.student_email.lower(),
                "copies.$.last_lent_to_id": str(student["_id"])
            }},
            **opts
        )

        # 4. Insert lending record
        lend_date = datetime.now(timezone.utc)
        due_date = lend_date + timedelta(days=5)
        lending_doc = {
            "student_email": req.student_email.lower(),
            "book_id": req.book_id,
            "book_title": book["title"],
            "copy_id": req.copy_id,
            "lend_date": lend_date,
            "due_date": due_date,
            "return_date": None,
            "fine_amount": 0.0,
            "status": "lent"
        }
        
        result = await db.lendings.insert_one(lending_doc, **opts)
        lending_doc["id"] = str(result.inserted_id)

    return lending_doc

@router.post("/return/{lending_id}", response_model=LendingResponse)
async def return_book_copy(
    lending_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_permission("manage_library"))
):
    """
    Return a lent book copy, recalculating fine if returned past 5 days.
    Uses ACID transactions to revert copy status safely.
    """
    if not ObjectId.is_valid(lending_id):
        raise HTTPException(status_code=400, detail="Invalid lending record ID.")

    lending = await db.lendings.find_one({"_id": ObjectId(lending_id)})
    if not lending:
        raise HTTPException(status_code=404, detail="Lending transaction not found.")

    if lending["status"] == "returned":
        raise HTTPException(status_code=400, detail="Book copy has already been returned.")

    async with transaction_scope() as session:
        opts = {"session": session} if session else {}

        return_date = datetime.now(timezone.utc)
        
        # Calculate fine: 10 RS per day overdue
        due_date = lending["due_date"]
        if due_date.tzinfo is None:
            due_date = due_date.replace(tzinfo=timezone.utc)

        fine = 0.0
        if return_date > due_date:
            diff = return_date - due_date
            # Calculate days late (ceil the partial days)
            overdue_days = diff.days
            if diff.total_seconds() > 0 and overdue_days == 0:
                overdue_days = 1
            elif diff.total_seconds() > 0:
                # Add 1 if there's remaining hours/minutes/seconds beyond full days
                if diff.total_seconds() % 86400 > 0:
                    overdue_days += 1
            fine = float(overdue_days * 10)

        # 1. Update copy status to available
        await db.books.update_one(
            {"_id": ObjectId(lending["book_id"]), "copies.copy_id": lending["copy_id"]},
            {"$set": {
                "copies.$.status": "available",
                "copies.$.lent_to": None,
                "copies.$.lent_to_id": None
            }},
            **opts
        )

        # 2. Update lending record
        await db.lendings.update_one(
            {"_id": ObjectId(lending_id)},
            {
                "$set": {
                    "return_date": return_date,
                    "fine_amount": fine,
                    "status": "returned"
                }
            },
            **opts
        )

    lending["return_date"] = return_date
    lending["fine_amount"] = fine
    lending["status"] = "returned"
    lending["id"] = str(lending["_id"])
    return lending

@router.get("/my-fines", response_model=StudentFineSummary)
async def get_my_fines(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_permission("manage_library"))
):
    """Retrieve logged-in student's lendings and calculate cumulative fine details."""
    student_email = current_user["email"].lower()
    
    cursor = db.lendings.find({"student_email": student_email})
    lendings = []
    cumulative_fine = 0.0
    
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        
        # Dynamically calculate current ongoing fine if lent but overdue (not returned yet)
        if doc["status"] in ["lent", "overdue"]:
            due_date = doc["due_date"]
            if due_date.tzinfo is None:
                due_date = due_date.replace(tzinfo=timezone.utc)
                
            now = datetime.now(timezone.utc)
            if now > due_date:
                diff = now - due_date
                overdue_days = diff.days
                if diff.total_seconds() > 0 and overdue_days == 0:
                    overdue_days = 1
                elif diff.total_seconds() > 0 and diff.total_seconds() % 86400 > 0:
                    overdue_days += 1
                doc["fine_amount"] = float(overdue_days * 10)
                doc["status"] = "overdue"
                
        cumulative_fine += doc["fine_amount"]
        lendings.append(doc)
        
    return {
        "cumulative_fine": cumulative_fine,
        "lendings": lendings
    }

@router.get("/active-lendings", response_model=List[LendingResponse])
async def list_active_lendings(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_permission("manage_library"))
):
    """List all currently active lendings in the academy."""
    cursor = db.lendings.find({"status": {"$in": ["lent", "overdue"]}})
    lendings = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        
        # Dynamically update overdue calculations
        if doc["status"] in ["lent", "overdue"]:
            due_date = doc["due_date"]
            if due_date.tzinfo is None:
                due_date = due_date.replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            if now > due_date:
                diff = now - due_date
                overdue_days = diff.days
                if diff.total_seconds() > 0 and overdue_days == 0:
                    overdue_days = 1
                elif diff.total_seconds() > 0 and diff.total_seconds() % 86400 > 0:
                    overdue_days += 1
                doc["fine_amount"] = float(overdue_days * 10)
                doc["status"] = "overdue"
                
        lendings.append(doc)
    return lendings


@router.put("/books/{book_id}", response_model=BookResponse)
async def update_book_details(
    book_id: str,
    book_in: BookUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head"]))
):
    """Update library book details, including adding or removing copies based on quantity change."""
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID format.")

    book = await db.books.find_one({"_id": ObjectId(book_id)})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found.")

    update_dict = {}
    if book_in.title is not None:
        update_dict["title"] = book_in.title
    if book_in.author is not None:
        update_dict["author"] = book_in.author

    copies = book.get("copies", [])
    current_isbn = book.get("isbn")
    new_isbn = book_in.isbn

    # Check if ISBN is changing and if any copies are currently lent
    if new_isbn is not None and new_isbn != current_isbn:
        # Check if ISBN already exists for another book
        dup_book = await db.books.find_one({"isbn": new_isbn, "_id": {"$ne": ObjectId(book_id)}})
        if dup_book:
            raise HTTPException(status_code=400, detail=f"Book with ISBN '{new_isbn}' already exists.")
        
        any_lent = any(c["status"] == "lent" for c in copies)
        if any_lent:
            raise HTTPException(status_code=400, detail="Cannot modify ISBN while some copies are currently lent out.")
        
        # Update ISBN
        update_dict["isbn"] = new_isbn
        # Rename copy IDs to match new ISBN
        for idx, copy in enumerate(copies):
            suffix = copy["copy_id"].split("-")[-1]
            copies[idx]["copy_id"] = f"{new_isbn}-{suffix}"
    else:
        new_isbn = current_isbn

    # Check quantity update
    if book_in.quantity is not None and book_in.quantity != book["quantity"]:
        new_qty = book_in.quantity
        old_qty = book["quantity"]
        if new_qty <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be greater than 0.")

        if new_qty > old_qty:
            # Add copies
            for i in range(old_qty + 1, new_qty + 1):
                copies.append({
                    "copy_id": f"{new_isbn}-{i}",
                    "status": "available",
                    "lent_to": None,
                    "lent_to_id": None,
                    "last_lent_to": None,
                    "last_lent_to_id": None
                })
        else:
            # Reduce copies: we must remove (old_qty - new_qty) copies that are "available"
            to_remove_count = old_qty - new_qty
            available_copies = [c for c in copies if c["status"] == "available"]
            if len(available_copies) < to_remove_count:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot reduce quantity to {new_qty}. Only {len(available_copies)} copies are available, but need to remove {to_remove_count} copies. Some are currently lent."
                )
            
            # Remove from the end of the available list
            removed = 0
            new_copies = []
            for copy in reversed(copies):
                if copy["status"] == "available" and removed < to_remove_count:
                    removed += 1
                else:
                    new_copies.append(copy)
            new_copies.reverse()
            copies = new_copies

        update_dict["quantity"] = new_qty

    update_dict["copies"] = copies

    await db.books.update_one({"_id": ObjectId(book_id)}, {"$set": update_dict})
    
    updated_book = await db.books.find_one({"_id": ObjectId(book_id)})
    updated_book["id"] = str(updated_book["_id"])
    return updated_book

@router.delete("/books/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(
    book_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_role(["head"]))
):
    """Delete a book from the library catalog entirely. Fails if any copy is currently lent."""
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID format.")

    book = await db.books.find_one({"_id": ObjectId(book_id)})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found.")

    copies = book.get("copies", [])
    any_lent = any(c["status"] == "lent" for c in copies)
    if any_lent:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete book because some copies are currently lent out."
        )

    await db.books.delete_one({"_id": ObjectId(book_id)})
