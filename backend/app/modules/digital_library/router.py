import os
import shutil
import uuid
import io
import logging
from datetime import datetime, timezone
from typing import List

import cloudinary
import cloudinary.uploader
from pypdf import PdfReader
from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.modules.auth.service import get_current_user, require_role, require_permission
from app.modules.digital_library.schemas import DigitalBookResponse

logger = logging.getLogger("academy_main")
router = APIRouter(prefix="/digital-library", tags=["Digital Library"])

# Helper to extract public_id from Cloudinary URL for deletion
def get_cloudinary_public_id(url: str) -> str:
    try:
        if "/upload/" in url:
            parts = url.split("/upload/")[-1].split("/")
            # Skip version tag (e.g., v1722304910)
            if parts[0].startswith("v") and parts[0][1:].isdigit():
                return "/".join(parts[1:])
            else:
                return "/".join(parts)
    except Exception:
        pass
    return ""

@router.post("/books", response_model=DigitalBookResponse, status_code=status.HTTP_201_CREATED)
async def upload_digital_book(
    title: str = Form(...),
    author: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_permission("digital_library"))
):
    if current_user.get("role") == "student":
        raise HTTPException(status_code=403, detail="Students are not authorized to upload digital books.")
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF files are allowed in the Digital Library."
        )
    
    book_id = str(uuid.uuid4())
    
    # Read bytes for PDF text extraction
    file_bytes = await file.read()
    await file.seek(0)
    
    # Extract text using PyPDF
    extracted_text = ""
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        text_list = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_list.append(page_text)
        extracted_text = "\n\n".join(text_list)
        logger.info(f"Extracted {len(extracted_text)} characters from uploaded PDF: {filename}")
    except Exception as e:
        logger.error(f"Failed to extract text from PDF: {str(e)}")
        # We don't fail the upload if text extraction fails, just leave it empty
        extracted_text = ""
        
    # If Cloudinary is configured, upload to cloud
    if os.environ.get("CLOUDINARY_URL"):
        try:
            upload_result = cloudinary.uploader.upload(
                file.file,
                resource_type="raw",
                public_id=f"digital_library/{book_id}_{filename}"
            )
            file_url = upload_result["secure_url"]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Cloudinary upload failed: {str(e)}"
            )
    else:
        # Fallback: Save file locally
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_url = f"/static/uploads/notes/{unique_filename}"
        local_path = f"uploads/notes/{unique_filename}"
        os.makedirs(os.path.join("uploads", "notes"), exist_ok=True)
        with open(local_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
    # Save cover url - we can let Cloudinary generate a thumbnail of page 1 if URL matches upload URL
    cover_url = None
    if os.environ.get("CLOUDINARY_URL") and "/upload/" in file_url:
        # Cloudinary allows transforming PDFs to images. We change resource type path /raw/ to /image/ 
        # and change the extension to .jpg, appending page 1 transformation parameter `pg_1`
        # Let's construct a thumbnail url
        try:
            # secure_url: https://res.cloudinary.com/demo/raw/upload/v1570979139/digital_library/id_name.pdf
            # converted:  https://res.cloudinary.com/demo/image/upload/pg_1/v1570979139/digital_library/id_name.jpg
            temp_url = file_url.replace("/raw/upload/", "/image/upload/pg_1/")
            if temp_url.lower().endswith(".pdf"):
                cover_url = temp_url[:-4] + ".jpg"
            else:
                cover_url = temp_url + ".jpg"
        except Exception:
            cover_url = None

    book_doc = {
        "_id": book_id,
        "title": title,
        "author": author,
        "description": description,
        "category": category,
        "file_url": file_url,
        "cover_url": cover_url,
        "extracted_text": extracted_text,
        "uploaded_by": current_user["email"],
        "uploaded_at": datetime.now(timezone.utc)
    }
    await db.digital_books.insert_one(book_doc)
    
    book_doc["id"] = book_doc["_id"]
    return book_doc

@router.get("/books", response_model=List[DigitalBookResponse])
async def list_digital_books(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve all digital books (excluding full extracted_text to optimize payload size)."""
    # Exclude extracted_text field in project query to save bandwidth
    cursor = db.digital_books.find({}, {"extracted_text": 0}).sort("uploaded_at", -1)
    books = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        books.append(doc)
    return books

@router.get("/books/{book_id}", response_model=DigitalBookResponse)
async def get_digital_book_details(
    book_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve full details of a specific digital book, including extracted_text."""
    book = await db.digital_books.find_one({"_id": book_id})
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Digital book with ID '{book_id}' not found."
        )
    book["id"] = str(book["_id"])
    return book

@router.delete("/books/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_digital_book(
    book_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(require_permission("digital_library"))
):
    if current_user.get("role") == "student":
        raise HTTPException(status_code=403, detail="Students are not authorized to delete digital books.")
    """Delete a digital book from catalog and its file from Cloudinary."""
    book = await db.digital_books.find_one({"_id": book_id})
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Digital book with ID '{book_id}' not found."
        )
        
    # Delete from Cloudinary
    file_url = book.get("file_url")
    if file_url and os.environ.get("CLOUDINARY_URL"):
        try:
            public_id = get_cloudinary_public_id(file_url)
            if public_id:
                cloudinary.uploader.destroy(public_id, resource_type="raw")
                logger.info(f"Deleted book file from Cloudinary: {public_id}")
        except Exception as e:
            logger.error(f"Failed to delete book file from Cloudinary: {str(e)}")
            
    await db.digital_books.delete_one({"_id": book_id})
    return
