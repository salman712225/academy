import pytest
from httpx import ASGITransport, AsyncClient
import io
import os

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
    await db.role_permissions.delete_many({})
    await db.attendance.delete_many({})
    
    yield db

@pytest.mark.anyio
async def test_permissions_flow(setup_test_db):
    db = setup_test_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Register head and trainer users
        await ac.post("/api/auth/register", json={
            "email": "perm_head@academy.com",
            "name": "Perm Head",
            "role": "head",
            "password": "Password123!"
        })
        await ac.post("/api/auth/register", json={
            "email": "perm_trainer@academy.com",
            "name": "Perm Trainer",
            "role": "trainer",
            "password": "Password123!",
            "classes_assigned": ["Batch A"] # Assign Batch A to trainer
        })

        # Get tokens
        login_head = await ac.post("/api/auth/login", json={"email": "perm_head@academy.com", "password": "Password123!"})
        head_token = login_head.json()["access_token"]
        head_headers = {"Authorization": f"Bearer {head_token}"}

        login_trainer = await ac.post("/api/auth/login", json={"email": "perm_trainer@academy.com", "password": "Password123!"})
        trainer_token = login_trainer.json()["access_token"]
        trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
        
        # Verify permissions field is returned in login response
        trainer_data = login_trainer.json()["user"]
        assert "permissions" in trainer_data
        assert trainer_data["permissions"]["upload_attendance"] is True

        # 2. Get all permissions as head (should succeed)
        get_perms_resp = await ac.get("/api/auth/permissions", headers=head_headers)
        assert get_perms_resp.status_code == 200
        perms = get_perms_resp.json()
        assert "trainer" in perms
        assert perms["trainer"]["upload_attendance"] is True

        # Get all permissions as trainer (should be blocked - forbidden)
        get_perms_trainer_resp = await ac.get("/api/auth/permissions", headers=trainer_headers)
        assert get_perms_trainer_resp.status_code == 403

        # 3. Modify trainer permissions: Revoke upload_attendance
        updated_trainer_perms = perms["trainer"].copy()
        updated_trainer_perms["upload_attendance"] = False
        
        update_resp = await ac.put("/api/auth/permissions/trainer", headers=head_headers, json=updated_trainer_perms)
        assert update_resp.status_code == 200
        assert update_resp.json()["permissions"]["upload_attendance"] is False

        # 4. Attempt uploading attendance as trainer (should fail with 403 since it is revoked)
        xlsx_file = io.BytesIO(b"dummy excel sheet bytes")
        files = {"file": ("attendance.xlsx", xlsx_file, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        data = {"batch_id": "Batch A"}
        
        upload_resp = await ac.post("/api/attendance/upload", headers=trainer_headers, data=data, files=files)
        assert upload_resp.status_code == 403
        assert "does not have the required permission" in upload_resp.json()["detail"]

        # 5. Restore upload_attendance permission for trainer
        updated_trainer_perms["upload_attendance"] = True
        update_resp2 = await ac.put("/api/auth/permissions/trainer", headers=head_headers, json=updated_trainer_perms)
        assert update_resp2.status_code == 200
        
        # 6. Attempt uploading attendance again (should pass permission check - though parse error is expected, not 403)
        xlsx_file2 = io.BytesIO(b"dummy excel sheet bytes")
        files2 = {"file": ("attendance.xlsx", xlsx_file2, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        upload_resp2 = await ac.post("/api/attendance/upload", headers=trainer_headers, data=data, files=files2)
        # It shouldn't be 403 Forbidden anymore. (It should return 400 bad request due to parsing dummy file)
        assert upload_resp2.status_code == 400
        assert "Failed to parse" in upload_resp2.json()["detail"]
