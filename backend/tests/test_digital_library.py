import pytest
from httpx import ASGITransport, AsyncClient
import io
import os
from pypdf import PdfWriter

from app.main import app
from app.core.config import settings
from app.core.database import get_db, connect_to_mongo

settings.DATABASE_NAME = "academy_db_test"
settings.CLOUDINARY_URL = ""
if "CLOUDINARY_URL" in os.environ:
    del os.environ["CLOUDINARY_URL"]

@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"

@pytest.fixture(scope="module", autouse=True)
async def setup_test_db():
    await connect_to_mongo()
    db = await get_db()
    
    # Clean test collections
    await db.users.delete_many({})
    await db.digital_books.delete_many({})
    
    yield db
    
    # Cleanup files
    if os.path.exists("uploads/notes"):
        for f in os.listdir("uploads/notes"):
            try:
                os.remove(os.path.join("uploads/notes", f))
            except Exception:
                pass

def generate_valid_pdf_bytes():
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=300)
    pdf_buf = io.BytesIO()
    writer.write(pdf_buf)
    return pdf_buf.getvalue()

@pytest.mark.anyio
async def test_digital_library_flow(setup_test_db):
    db = setup_test_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Register head, trainer, and student users
        await ac.post("/api/auth/register", json={
            "email": "lib_head@academy.com",
            "name": "Library Head",
            "role": "head",
            "password": "Password123!"
        })
        await ac.post("/api/auth/register", json={
            "email": "lib_student@academy.com",
            "name": "Library Student",
            "role": "student",
            "password": "Password123!"
        })

        # 2. Log in and get tokens
        login_head = await ac.post("/api/auth/login", json={"email": "lib_head@academy.com", "password": "Password123!"})
        head_token = login_head.json()["access_token"]
        head_headers = {"Authorization": f"Bearer {head_token}"}

        login_student = await ac.post("/api/auth/login", json={"email": "lib_student@academy.com", "password": "Password123!"})
        student_token = login_student.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}

        # 3. Verify student CANNOT upload
        pdf_data = generate_valid_pdf_bytes()
        files = {"file": ("book1.pdf", io.BytesIO(pdf_data), "application/pdf")}
        data = {
            "title": "Clean Code",
            "author": "Robert C. Martin",
            "description": "A Handbook of Agile Software Craftsmanship",
            "category": "Programming"
        }
        
        student_upload_resp = await ac.post(
            "/api/digital-library/books",
            headers=student_headers,
            data=data,
            files=files
        )
        assert student_upload_resp.status_code == 403

        # 4. Verify head CAN upload a valid PDF book
        files = {"file": ("book1.pdf", io.BytesIO(pdf_data), "application/pdf")}
        head_upload_resp = await ac.post(
            "/api/digital-library/books",
            headers=head_headers,
            data=data,
            files=files
        )
        assert head_upload_resp.status_code == 201
        book_res = head_upload_resp.json()
        assert book_res["title"] == "Clean Code"
        assert book_res["author"] == "Robert C. Martin"
        assert book_res["category"] == "Programming"
        assert "file_url" in book_res
        book_id = book_res["id"]

        # 5. List books (verify it does not include extracted_text for bandwidth optimization)
        list_resp = await ac.get("/api/digital-library/books", headers=student_headers)
        assert list_resp.status_code == 200
        books_list = list_resp.json()
        assert len(books_list) == 1
        assert books_list[0]["title"] == "Clean Code"
        assert "extracted_text" not in books_list[0] or books_list[0]["extracted_text"] is None

        # 6. Retrieve detailed book content (including extracted_text)
        details_resp = await ac.get(f"/api/digital-library/books/{book_id}", headers=student_headers)
        assert details_resp.status_code == 200
        book_details = details_resp.json()
        assert book_details["id"] == book_id
        assert "extracted_text" in book_details

        # 7. Student tries to delete the book (should fail)
        student_del_resp = await ac.delete(f"/api/digital-library/books/{book_id}", headers=student_headers)
        assert student_del_resp.status_code == 403

        # 8. Head deletes the book successfully
        head_del_resp = await ac.delete(f"/api/digital-library/books/{book_id}", headers=head_headers)
        assert head_del_resp.status_code == 204

        # 9. Verify book is gone
        get_gone_resp = await ac.get(f"/api/digital-library/books/{book_id}", headers=student_headers)
        assert get_gone_resp.status_code == 404
