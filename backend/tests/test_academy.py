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
    await db.events.delete_many({})
    
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


@pytest.mark.anyio
async def test_events_flow(setup_test_db):
    db = setup_test_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Register dedicated Head & Student users
        await ac.post("/api/auth/register", json={
            "email": "head_event_admin@academy.com",
            "name": "Event Head",
            "role": "head",
            "password": "AdminPassword123!"
        })
        await ac.post("/api/auth/register", json={
            "email": "student_event_user@academy.com",
            "name": "Event Student",
            "role": "student",
            "password": "Password123!"
        })

        # 1. Login as Area Head
        login_resp = await ac.post("/api/auth/login", json={
            "email": "head_event_admin@academy.com",
            "password": "AdminPassword123!"
        })
        token = login_resp.json()["access_token"]
        head_headers = {"Authorization": f"Bearer {token}"}

        # 2. Create Event (Head)
        event_date = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
        create_resp = await ac.post("/api/events/", headers=head_headers, json={
            "name": "Hackathon 2026",
            "date": event_date,
            "description": "Annual academy code marathon",
            "form_link": "https://example.com/register"
        })
        assert create_resp.status_code == 201
        event_data = create_resp.json()
        assert event_data["name"] == "Hackathon 2026"
        assert event_data["created_by"] == "head_event_admin@academy.com"
        event_id = event_data["id"]

        # 3. List Events (Head)
        list_resp = await ac.get("/api/events/", headers=head_headers)
        assert list_resp.status_code == 200
        events = list_resp.json()
        assert len(events) >= 1
        assert any(e["id"] == event_id for e in events)

        # 4. Login as Student
        student_login_resp = await ac.post("/api/auth/login", json={
            "email": "student_event_user@academy.com",
            "password": "Password123!"
        })
        student_token = student_login_resp.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}

        # 5. Create Event (Student) - Should fail (403)
        fail_create_resp = await ac.post("/api/events/", headers=student_headers, json={
            "name": "Unauthorized Hackathon",
            "date": event_date,
            "description": "Should fail",
            "form_link": "https://example.com"
        })
        assert fail_create_resp.status_code == 403

        # 6. List Events (Student) - Should succeed (200)
        student_list_resp = await ac.get("/api/events/", headers=student_headers)
        assert student_list_resp.status_code == 200
        student_events = student_list_resp.json()
        assert any(e["id"] == event_id for e in student_events)

        # 7. Delete Event (Student) - Should fail (403)
        fail_delete_resp = await ac.delete(f"/api/events/{event_id}", headers=student_headers)
        assert fail_delete_resp.status_code == 403

        # 8. Delete Event (Head) - Should succeed (204)
        delete_resp = await ac.delete(f"/api/events/{event_id}", headers=head_headers)
        assert delete_resp.status_code == 204

        # 9. Verify deletion in list
        final_list_resp = await ac.get("/api/events/", headers=head_headers)
        assert not any(e["id"] == event_id for e in final_list_resp.json())


@pytest.mark.anyio
async def test_manual_attendance_flow(setup_test_db):
    db = setup_test_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create Area Head Token to perform attendance actions
        head_reg = await ac.post("/api/auth/register", json={
            "email": "attendance_head@academy.com",
            "name": "Attendance Head",
            "role": "head",
            "password": "AdminPassword123!"
        })
        
        login_resp = await ac.post("/api/auth/login", json={
            "email": "attendance_head@academy.com",
            "password": "AdminPassword123!"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create a Batch
        batch_resp = await ac.post("/api/batches/", headers=headers, json={
            "name": "Batch-Attendance-Test",
            "description": "Test Batch for Attendance",
            "is_open": True
        })
        assert batch_resp.status_code == 201

        # Register students under Batch-Attendance-Test
        std1_resp = await ac.post("/api/auth/register", json={
            "email": "student_att1@academy.com",
            "name": "Student Att One",
            "role": "student",
            "password": "Password123!",
            "batch_id": "Batch-Attendance-Test"
        })
        assert std1_resp.status_code == 201

        std2_resp = await ac.post("/api/auth/register", json={
            "email": "student_att2@academy.com",
            "name": "Student Att Two",
            "role": "student",
            "password": "Password123!",
            "batch_id": "Batch-Attendance-Test"
        })
        assert std2_resp.status_code == 201

        # 1. Get batch students list
        students_resp = await ac.get("/api/attendance/batch/Batch-Attendance-Test/students", headers=headers)
        assert students_resp.status_code == 200
        students_data = students_resp.json()
        assert len(students_data) == 2
        emails = [s["email"] for s in students_data]
        assert "student_att1@academy.com" in emails
        assert "student_att2@academy.com" in emails

        # 2. Save manual attendance
        manual_update_payload = {
            "batch_id": "Batch-Attendance-Test",
            "date": "2026-07-29",
            "records": [
                {
                    "student_email": "student_att1@academy.com",
                    "session_1": "Present",
                    "session_2": "Absent",
                    "session_3": "Late",
                    "session_4": "None"
                },
                {
                    "student_email": "student_att2@academy.com",
                    "session_1": "Absent",
                    "session_2": "Present",
                    "session_3": "None",
                    "session_4": "Present"
                }
            ]
        }
        update_resp = await ac.post("/api/attendance/manual-update", headers=headers, json=manual_update_payload)
        assert update_resp.status_code == 200
        assert "Successfully updated" in update_resp.json()["message"]

        # 3. Retrieve batch attendance with date filter
        get_resp = await ac.get("/api/attendance/batch/Batch-Attendance-Test?date=2026-07-29", headers=headers)
        assert get_resp.status_code == 200
        records = get_resp.json()
        assert len(records) == 2
        
        rec1 = next(r for r in records if r["student_email"] == "student_att1@academy.com")
        assert rec1["session_1"] == "Present"
        assert rec1["session_2"] == "Absent"
        assert rec1["session_3"] == "Late"
        assert rec1["session_4"] == "None"

        rec2 = next(r for r in records if r["student_email"] == "student_att2@academy.com")
        assert rec2["session_1"] == "Absent"
        assert rec2["session_2"] == "Present"
        assert rec2["session_3"] == "None"
        assert rec2["session_4"] == "Present"

        # 4. Retrieve batch attendance with non-existent date filter
        get_empty_resp = await ac.get("/api/attendance/batch/Batch-Attendance-Test?date=2026-07-30", headers=headers)
        assert get_empty_resp.status_code == 200
        assert len(get_empty_resp.json()) == 0

        # 5. Retrieve my-attendance as student_att1
        std1_login_resp = await ac.post("/api/auth/login", json={
            "email": "student_att1@academy.com",
            "password": "Password123!"
        })
        assert std1_login_resp.status_code == 200
        std1_token = std1_login_resp.json()["access_token"]
        std1_headers = {"Authorization": f"Bearer {std1_token}"}

        my_att_resp = await ac.get("/api/attendance/my-attendance", headers=std1_headers)
        assert my_att_resp.status_code == 200
        my_att_data = my_att_resp.json()
        assert my_att_data["student_email"] == "student_att1@academy.com"
        assert my_att_data["session_wise_attendance_pct"] == 66.67
        assert my_att_data["day_wise_attendance_pct"] == 100.0
        assert my_att_data["total_conducted_sessions"] == 3
        assert my_att_data["attended_sessions"] == 2
        assert my_att_data["total_conducted_days"] == 1
        assert my_att_data["attended_days"] == 1


@pytest.mark.anyio
async def test_trainer_attendance_constraints(setup_test_db):
    db = setup_test_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Register a new Trainer
        trainer_reg = await ac.post("/api/auth/register", json={
            "email": "trainer_test@academy.com",
            "name": "Trainer Test",
            "role": "trainer",
            "password": "TrainerPassword123!",
            "classes_assigned": ["Batch-Attendance-Test"]
        })
        assert trainer_reg.status_code == 201
        
        # Login Trainer
        login_resp = await ac.post("/api/auth/login", json={
            "email": "trainer_test@academy.com",
            "password": "TrainerPassword123!"
        })
        assert login_resp.status_code == 200
        trainer_token = login_resp.json()["access_token"]
        trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
        
        # Today's date
        today_str = datetime.now().strftime("%Y-%m-%d")
        
        # 1. Trainer updates today's attendance -> Should succeed (200)
        manual_payload_today = {
            "batch_id": "Batch-Attendance-Test",
            "date": today_str,
            "records": [
                {
                    "student_email": "student_att1@academy.com",
                    "session_1": "Present",
                    "session_2": "Present",
                    "session_3": "Present",
                    "session_4": "Present"
                }
            ]
        }
        resp_today = await ac.post("/api/attendance/manual-update", headers=trainer_headers, json=manual_payload_today)
        assert resp_today.status_code == 200
        
        # 2. Trainer updates past date attendance -> Should fail (403 Forbidden)
        manual_payload_past = {
            "batch_id": "Batch-Attendance-Test",
            "date": "2026-07-28",
            "records": [
                {
                    "student_email": "student_att1@academy.com",
                    "session_1": "Absent",
                    "session_2": "Absent",
                    "session_3": "Absent",
                    "session_4": "Absent"
                }
            ]
        }
        resp_past = await ac.post("/api/attendance/manual-update", headers=trainer_headers, json=manual_payload_past)
        assert resp_past.status_code == 403
        assert "Only the Area Head has permission to update past or future attendance records." in resp_past.json()["detail"]



