import pytest
from httpx import ASGITransport, AsyncClient
import asyncio
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from app.main import app
from app.core.config import settings
from app.core.database import get_db, connect_to_mongo, close_mongo_connection

# Override database name for test safety
settings.DATABASE_NAME = "academy_db_test"

@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"

@pytest.fixture(scope="module", autouse=True)
async def setup_test_db():
    # Connect
    await connect_to_mongo()
    db = await get_db()
    
    # Clean test collections
    await db.users.delete_many({})
    await db.books.delete_many({})
    await db.lendings.delete_many({})
    await db.batches.delete_many({})
    await db.attendance.delete_many({})
    await db.sent_emails.delete_many({})
    
    yield db
    
    # Cleanup
    await close_mongo_connection()

@pytest.mark.anyio
async def test_auth_flow(setup_test_db):
    db = setup_test_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Register Student
        reg_resp = await ac.post("/api/auth/register", json={
            "email": "test_student@academy.com",
            "name": "Test Student",
            "role": "student",
            "password": "Password123!",
            "batch_id": "Batch A"
        })
        assert reg_resp.status_code == 201
        assert reg_resp.json()["email"] == "test_student@academy.com"

        # 2. Login Student
        login_resp = await ac.post("/api/auth/login", json={
            "email": "test_student@academy.com",
            "password": "Password123!"
        })
        assert login_resp.status_code == 200
        data = login_resp.json()
        assert "access_token" in data
        assert data["user"]["role"] == "student"

@pytest.mark.anyio
async def test_library_lend_collision(setup_test_db):
    db = setup_test_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create Area Head Token to perform library actions
        head_reg = await ac.post("/api/auth/register", json={
            "email": "head_admin@academy.com",
            "name": "Area Head",
            "role": "head",
            "password": "AdminPassword123!"
        })
        # Ignore if head already registered in other tests
        
        login_resp = await ac.post("/api/auth/login", json={
            "email": "head_admin@academy.com",
            "password": "AdminPassword123!"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Register another student
        await ac.post("/api/auth/register", json={
            "email": "student2@academy.com",
            "name": "Student Two",
            "role": "student",
            "password": "Password123!"
        })

        # 1. Add Book
        book_resp = await ac.post("/api/library/books", headers=headers, json={
            "title": "Clean Code",
            "author": "Robert C. Martin",
            "isbn": "9780132350884",
            "quantity": 2
        })
        assert book_resp.status_code == 201
        book_data = book_resp.json()
        assert len(book_data["copies"]) == 2
        book_id = book_data["id"]
        copy_1 = book_data["copies"][0]["copy_id"]

        # 2. Lend copy 1 to student 1
        lend_resp1 = await ac.post("/api/library/lend", headers=headers, json={
            "student_email": "test_student@academy.com",
            "book_id": book_id,
            "copy_id": copy_1
        })
        assert lend_resp1.status_code == 200
        assert lend_resp1.json()["status"] == "lent"

        # 3. Lend same copy 1 to student 2 (Collision Check)
        lend_resp2 = await ac.post("/api/library/lend", headers=headers, json={
            "student_email": "student2@academy.com",
            "book_id": book_id,
            "copy_id": copy_1
        })
        # This must fail (400 Bad Request) and prevent double-lending
        assert lend_resp2.status_code == 400
        assert "currently lent" in lend_resp2.json()["detail"]


@pytest.mark.anyio
async def test_library_student_id_tracking(setup_test_db):
    db = setup_test_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create user & login as head
        login_resp = await ac.post("/api/auth/login", json={
            "email": "head_admin@academy.com",
            "password": "AdminPassword123!"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Fetch student 1 details to get their ID
        student_email = "test_student@academy.com"
        student = await db.users.find_one({"email": student_email})
        student_id = str(student["_id"])

        # 2. Add Book
        book_resp = await ac.post("/api/library/books", headers=headers, json={
            "title": "Pragmatic Programmer",
            "author": "Andy Hunt",
            "isbn": "9780201616224",
            "quantity": 1
        })
        assert book_resp.status_code == 201
        book_data = book_resp.json()
        book_id = book_data["id"]
        copy_1 = book_data["copies"][0]["copy_id"]
        
        # Verify initial fields are None
        assert book_data["copies"][0]["lent_to_id"] is None
        assert book_data["copies"][0]["last_lent_to"] is None
        assert book_data["copies"][0]["last_lent_to_id"] is None

        # 3. Lend copy to student
        lend_resp = await ac.post("/api/library/lend", headers=headers, json={
            "student_email": student_email,
            "book_id": book_id,
            "copy_id": copy_1
        })
        assert lend_resp.status_code == 200
        lending_id = lend_resp.json()["id"]

        # Fetch book from db to verify copy fields
        book_doc = await db.books.find_one({"_id": ObjectId(book_id)})
        copy_doc = book_doc["copies"][0]
        assert copy_doc["status"] == "lent"
        assert copy_doc["lent_to"] == student_email
        assert copy_doc["lent_to_id"] == student_id
        assert copy_doc["last_lent_to"] == student_email
        assert copy_doc["last_lent_to_id"] == student_id

        # 4. Return copy
        return_resp = await ac.post(f"/api/library/return/{lending_id}", headers=headers)
        assert return_resp.status_code == 200

        # Fetch book from db to verify copy fields again
        book_doc = await db.books.find_one({"_id": ObjectId(book_id)})
        copy_doc = book_doc["copies"][0]
        assert copy_doc["status"] == "available"
        assert copy_doc["lent_to"] is None
        assert copy_doc["lent_to_id"] is None
        assert copy_doc["last_lent_to"] == student_email
        assert copy_doc["last_lent_to_id"] == student_id


@pytest.mark.anyio
async def test_admin_records_manager(setup_test_db):
    db = setup_test_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Login as head
        login_resp = await ac.post("/api/auth/login", json={
            "email": "head_admin@academy.com",
            "password": "AdminPassword123!"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Create a user manually
        create_user_resp = await ac.post("/api/auth/users", headers=headers, json={
            "email": "manual_student@academy.com",
            "name": "Manual Student",
            "role": "student",
            "password": "Password123!",
            "batch_id": "Batch A"
        })
        assert create_user_resp.status_code == 201
        student_id = create_user_resp.json()["id"]

        # 2. List all users and verify
        users_resp = await ac.get("/api/auth/users", headers=headers)
        assert users_resp.status_code == 200
        emails = [u["email"] for u in users_resp.json()]
        assert "manual_student@academy.com" in emails

        # 3. Update the user manually
        update_user_resp = await ac.put(f"/api/auth/users/{student_id}", headers=headers, json={
            "name": "Updated Name",
            "email": "updated_student@academy.com"
        })
        assert update_user_resp.status_code == 200
        assert update_user_resp.json()["name"] == "Updated Name"
        assert update_user_resp.json()["email"] == "updated_student@academy.com"

        # 4. Delete user manually
        delete_user_resp = await ac.delete(f"/api/auth/users/{student_id}", headers=headers)
        assert delete_user_resp.status_code == 204

        # Verify not in list
        users_resp2 = await ac.get("/api/auth/users", headers=headers)
        emails2 = [u["email"] for u in users_resp2.json()]
        assert "updated_student@academy.com" not in emails2

        # 5. Add a book manually
        book_resp = await ac.post("/api/library/books", headers=headers, json={
            "title": "Book To Edit",
            "author": "Author A",
            "isbn": "9999999999",
            "quantity": 2
        })
        assert book_resp.status_code == 201
        book_id = book_resp.json()["id"]

        # 6. Update the book details (quantity increase)
        book_update_resp = await ac.put(f"/api/library/books/{book_id}", headers=headers, json={
            "title": "Book Edited Title",
            "quantity": 3
        })
        assert book_update_resp.status_code == 200
        assert book_update_resp.json()["title"] == "Book Edited Title"
        assert book_update_resp.json()["quantity"] == 3
        assert len(book_update_resp.json()["copies"]) == 3

        # 7. Update book details (quantity decrease)
        book_update_resp2 = await ac.put(f"/api/library/books/{book_id}", headers=headers, json={
            "quantity": 1
        })
        assert book_update_resp2.status_code == 200
        assert book_update_resp2.json()["quantity"] == 1
        assert len(book_update_resp2.json()["copies"]) == 1

        # 8. Delete book
        delete_book_resp = await ac.delete(f"/api/library/books/{book_id}", headers=headers)
        assert delete_book_resp.status_code == 204
