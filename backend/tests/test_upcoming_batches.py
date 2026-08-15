import pytest
from httpx import ASGITransport, AsyncClient
import io
import os
from datetime import datetime

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
    await db.batches.delete_many({})
    await db.applications.delete_many({})
    
    yield db
    
    # Cleanup files
    if os.path.exists("uploads/applications"):
        for f in os.listdir("uploads/applications"):
            try:
                os.remove(os.path.join("uploads/applications", f))
            except Exception:
                pass

@pytest.mark.anyio
async def test_upcoming_batches_flow(setup_test_db):
    db = setup_test_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Register head user
        await ac.post("/api/auth/register", json={
            "email": "crm_head@academy.com",
            "name": "CRM Head",
            "role": "head",
            "password": "Password123!"
        })

        # 2. Log in and get tokens
        login_head = await ac.post("/api/auth/login", json={"email": "crm_head@academy.com", "password": "Password123!"})
        head_token = login_head.json()["access_token"]
        head_headers = {"Authorization": f"Bearer {head_token}"}

        # 3. Create an upcoming batch
        create_batch_resp = await ac.post(
            "/api/batches/",
            headers=head_headers,
            json={
                "name": "Gen AI Batch 3",
                "description": "Next Gen AI developer course",
                "is_open": True,
                "group": "upcoming"
            }
        )
        assert create_batch_resp.status_code == 201
        batch_res = create_batch_resp.json()
        assert batch_res["name"] == "Gen AI Batch 3"
        assert batch_res["group"] == "upcoming"
        batch_id = batch_res["id"]

        # 4. Apply to the batch (Submit application with details and documents)
        dummy_file_bytes = b"dummy file content"
        files = {
            "marksheet_10th_file": ("marksheet_10th.pdf", io.BytesIO(dummy_file_bytes), "application/pdf"),
            "marksheet_12th_file": ("marksheet_12th.pdf", io.BytesIO(dummy_file_bytes), "application/pdf"),
            "resume_file": ("resume.pdf", io.BytesIO(dummy_file_bytes), "application/pdf"),
            "ug_marksheet_file": ("ug_marksheet.pdf", io.BytesIO(dummy_file_bytes), "application/pdf"),
            "provisional_certificate_file": ("provisional.pdf", io.BytesIO(dummy_file_bytes), "application/pdf")
        }
        data = {
            "student_name": "Prospective Student",
            "student_email": "prospective@student.com",
            "age": 22,
            "gender": "Male",
            "degree": "B.Sc Computer Science",
            "branch": "IT",
            "passout_year": 2026,
            "college_percentage": 85.5,
            "any_arrears": "No arrears",
            "family_annual_income": 450000.0,
            "father_occupation": "Engineer",
            "mother_occupation": "Teacher",
            "phone_number": "9876543210"
        }

        apply_resp = await ac.post(
            f"/api/batches/{batch_id}/apply",
            data=data,
            files=files
        )
        assert apply_resp.status_code == 201
        app_res = apply_resp.json()
        assert app_res["student_name"] == "Prospective Student"
        assert app_res["student_email"] == "prospective@student.com"
        assert app_res["age"] == 22
        assert app_res["gender"] == "Male"
        assert app_res["any_arrears"] == "No arrears"
        assert "resume_url" in app_res
        assert app_res["resume_url"] is not None
        app_id = app_res["id"]

        # 5. List applications (as head)
        list_resp = await ac.get("/api/batches/applications", headers=head_headers)
        assert list_resp.status_code == 200
        apps_list = list_resp.json()
        assert len(apps_list) >= 1
        matched_app = next(a for a in apps_list if a["id"] == app_id)
        assert matched_app["student_name"] == "Prospective Student"
        assert matched_app["age"] == 22

        # 6. Verify doc download
        download_resp = await ac.get(f"/api/batches/applications/{app_id}/download/resume", headers=head_headers)
        assert download_resp.status_code == 200
        assert download_resp.content == dummy_file_bytes

        # 7. Approve the student application (Verify status change and mock email logging)
        approve_resp = await ac.put(
            f"/api/batches/applications/{app_id}/status?status_val=approved",
            headers=head_headers
        )
        assert approve_resp.status_code == 200
        assert approve_resp.json()["status"] == "approved"

        # 8. Schedule interview
        interview_payload = {
            "interview_date": "2026-09-01",
            "interview_time": "10:00 AM UTC",
            "interview_link": "https://meet.google.com/abc-xyz-123",
            "interviewer_notes": "Please prepare core JS questions"
        }
        interview_resp = await ac.put(
            f"/api/batches/applications/{app_id}/interview",
            headers=head_headers,
            json=interview_payload
        )
        assert interview_resp.status_code == 200
        int_res = interview_resp.json()
        assert int_res["interview_details"] is not None
        assert int_res["interview_details"]["interview_date"] == "2026-09-01"
        assert int_res["interview_details"]["interview_link"] == "https://meet.google.com/abc-xyz-123"
