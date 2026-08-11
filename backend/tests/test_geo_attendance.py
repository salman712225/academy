import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import patch
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from app.main import app
from app.core.config import settings
from app.core.database import get_db, connect_to_mongo

settings.DATABASE_NAME = "academy_db_test"

@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"

@pytest.fixture(scope="module", autouse=True)
async def setup_test_db():
    await connect_to_mongo()
    db = await get_db()
    
    # Clean test collections
    await db.users.delete_many({})
    await db.geo_centers.delete_many({})
    await db.geo_attendance_records.delete_many({})
    
    yield db

# Mock Monday at 10:15 AM IST (Within Present check-in window)
MOCK_IST_NOW = datetime(2026, 8, 17, 10, 15, 0, tzinfo=timezone(timedelta(hours=5, minutes=30)))

# Mock Monday at 1:00 PM IST (Within Late check-in window)
MOCK_IST_LATE = datetime(2026, 8, 17, 13, 0, 0, tzinfo=timezone(timedelta(hours=5, minutes=30)))

# Mock Sunday at 10:15 AM IST (Sunday is closed)
MOCK_IST_SUNDAY = datetime(2026, 8, 16, 10, 15, 0, tzinfo=timezone(timedelta(hours=5, minutes=30)))

@pytest.mark.anyio
async def test_geo_attendance_flow(setup_test_db):
    db = setup_test_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Register and Log in a Head Admin
        await ac.post("/api/auth/register", json={
            "email": "geo_head@academy.com",
            "name": "Geo Head",
            "role": "head",
            "password": "Password123!"
        })
        login_head = await ac.post("/api/auth/login", json={
            "email": "geo_head@academy.com",
            "password": "Password123!"
        })
        token_head = login_head.json()["access_token"]
        headers_head = {"Authorization": f"Bearer {token_head}"}

        # 2. Register and Log in a Student
        await ac.post("/api/auth/register", json={
            "email": "geo_stud@academy.com",
            "name": "Geo Student",
            "role": "student",
            "password": "Password123!",
            "batch_id": "batch-alpha"
        })
        login_stud = await ac.post("/api/auth/login", json={
            "email": "geo_stud@academy.com",
            "password": "Password123!"
        })
        token_stud = login_stud.json()["access_token"]
        headers_stud = {"Authorization": f"Bearer {token_stud}"}

        # 3. Create a Center (lat 17.448, lon 78.374, radius 150m)
        center_payload = {
            "name": "Tech Hub Center",
            "latitude": 17.448294,
            "longitude": 78.374082,
            "radius_meters": 150.0
        }
        create_c_resp = await ac.post("/api/geo-attendance/centers", headers=headers_head, json=center_payload)
        assert create_c_resp.status_code == 201
        center_data = create_c_resp.json()
        center_id = center_data["id"]

        # Student initially has no center, check-in should fail
        with patch("app.modules.geo_attendance.router.get_current_ist_time", return_value=MOCK_IST_NOW):
            mark_fail_resp = await ac.post("/api/geo-attendance/mark", headers=headers_stud, json={
                "latitude": 17.448294,
                "longitude": 78.374082,
                "gps_accuracy": 10.0
            })
            assert mark_fail_resp.status_code == 400
            assert "No training center assigned" in mark_fail_resp.json()["detail"]

        # 4. Head admin assigns student to Tech Hub Center
        stud_user = await db.users.find_one({"email": "geo_stud@academy.com"})
        assign_resp = await ac.post("/api/geo-attendance/assign-center", headers=headers_head, json={
            "user_id": str(stud_user["_id"]),
            "center_id": center_id
        })
        assert assign_resp.status_code == 200
        
        # Verify student center details fetch
        stud_center_resp = await ac.get("/api/geo-attendance/student-center", headers=headers_stud)
        assert stud_center_resp.status_code == 200
        assert stud_center_resp.json()["name"] == "Tech Hub Center"

        # 5. Student marks attendance: outside geofence (>150m, e.g. at lat 17.452, lon 78.378)
        with patch("app.modules.geo_attendance.router.get_current_ist_time", return_value=MOCK_IST_NOW):
            mark_outside_resp = await ac.post("/api/geo-attendance/mark", headers=headers_stud, json={
                "latitude": 17.452000,
                "longitude": 78.378000,
                "gps_accuracy": 5.0
            })
            assert mark_outside_resp.status_code == 400
            assert "outside the attendance area" in mark_outside_resp.json()["detail"]

        # 6. Student marks attendance: inside geofence (PRESENT status at 10:15 AM IST)
        with patch("app.modules.geo_attendance.router.get_current_ist_time", return_value=MOCK_IST_NOW):
            mark_ok_resp = await ac.post("/api/geo-attendance/mark", headers=headers_stud, json={
                "latitude": 17.448295,
                "longitude": 78.374083,
                "gps_accuracy": 6.0
            })
            assert mark_ok_resp.status_code == 200
            rec = mark_ok_resp.json()
            assert rec["status"] == "PRESENT"
            assert rec["verification_status"] == "verified"
            record_id = rec["id"]

        # 7. Student marks attendance again (duplicate check should fail)
        with patch("app.modules.geo_attendance.router.get_current_ist_time", return_value=MOCK_IST_NOW):
            mark_dup_resp = await ac.post("/api/geo-attendance/mark", headers=headers_stud, json={
                "latitude": 17.448295,
                "longitude": 78.374083,
                "gps_accuracy": 6.0
            })
            assert mark_dup_resp.status_code == 400
            assert "already marked" in mark_dup_resp.json()["detail"]

        # 8. Check history
        history_resp = await ac.get("/api/geo-attendance/history", headers=headers_stud)
        assert history_resp.status_code == 200
        assert len(history_resp.json()) == 1
        assert history_resp.json()[0]["status"] == "PRESENT"

        # 9. Verify manual correction by Head Admin
        correct_payload = {
            "status": "LATE",
            "reason": "Student came late but submitted device check-in before boundary sync."
        }
        correct_resp = await ac.post(f"/api/geo-attendance/records/{record_id}/correct", headers=headers_head, json=correct_payload)
        assert correct_resp.status_code == 200
        correct_data = correct_resp.json()
        assert correct_data["status"] == "LATE"
        assert correct_data["verification_status"] == "manual_correction"
        assert len(correct_data["correction_history"]) == 1
        assert correct_data["correction_history"][0]["reason"] == correct_payload["reason"]

        # 10. Verify bulk assignment of center
        await ac.post("/api/auth/register", json={
            "email": "geo_stud2@academy.com",
            "name": "Geo Student 2",
            "role": "student",
            "password": "Password123!",
            "batch_id": "batch-alpha"
        })
        stud_user2 = await db.users.find_one({"email": "geo_stud2@academy.com"})
        
        bulk_assign_resp = await ac.post("/api/geo-attendance/assign-center/bulk", headers=headers_head, json={
            "user_ids": [str(stud_user["_id"]), str(stud_user2["_id"])],
            "center_id": center_id
        })
        assert bulk_assign_resp.status_code == 200
        
        # Verify both students have the new center_id
        updated_stud1 = await db.users.find_one({"_id": stud_user["_id"]})
        updated_stud2 = await db.users.find_one({"_id": stud_user2["_id"]})
        assert updated_stud1["center_id"] == center_id
        assert updated_stud2["center_id"] == center_id
