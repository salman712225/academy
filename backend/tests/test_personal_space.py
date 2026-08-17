import pytest
from httpx import ASGITransport, AsyncClient
import io

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
    await db.personal_tasks.delete_many({})
    await db.personal_documents.delete_many({})
    
    yield db

@pytest.mark.anyio
async def test_personal_space_flow(setup_test_db):
    db = setup_test_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Register and Log in a user
        await ac.post("/api/auth/register", json={
            "email": "personal_student@academy.com",
            "name": "Personal Student",
            "role": "student",
            "password": "Password123!"
        })
        
        login_resp = await ac.post("/api/auth/login", json={
            "email": "personal_student@academy.com",
            "password": "Password123!"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Test Tasks API
        # List tasks (initially empty)
        list_tasks_resp = await ac.get("/api/personal/tasks", headers=headers)
        assert list_tasks_resp.status_code == 200
        assert len(list_tasks_resp.json()) == 0
        
        # Create a task
        create_task_resp = await ac.post("/api/personal/tasks", headers=headers, json={
            "title": "Complete batch planning",
            "completed": False
        })
        assert create_task_resp.status_code == 201
        task_data = create_task_resp.json()
        assert task_data["title"] == "Complete batch planning"
        assert task_data["completed"] is False
        task_id = task_data["id"]
        
        # Toggle task completion
        toggle_task_resp = await ac.put(f"/api/personal/tasks/{task_id}", headers=headers)
        assert toggle_task_resp.status_code == 200
        assert toggle_task_resp.json()["completed"] is True
        
        # 3. Test Documents API
        # List documents (initially empty)
        list_docs_resp = await ac.get("/api/personal/documents", headers=headers)
        assert list_docs_resp.status_code == 200
        assert len(list_docs_resp.json()) == 0
        
        # Create a document
        create_doc_resp = await ac.post("/api/personal/documents", headers=headers, data={
            "title": "Study Plan",
            "content": "### My Plan\n\n1. Learn FastAPI"
        })
        assert create_doc_resp.status_code == 201
        doc_data = create_doc_resp.json()
        assert doc_data["title"] == "Study Plan"
        assert "Learn FastAPI" in doc_data["content"]
        doc_id = doc_data["id"]
        
        # Update the document
        update_doc_resp = await ac.put(f"/api/personal/documents/{doc_id}", headers=headers, data={
            "title": "Updated Study Plan",
            "content": "### Revised Plan"
        })
        assert update_doc_resp.status_code == 200
        assert update_doc_resp.json()["title"] == "Updated Study Plan"
        
        # 4. Test Cloud Settings API
        # Update user custom Cloudinary settings
        settings_payload = {"personal_cloudinary_url": "cloudinary://test_key:test_secret@test_cloud"}
        settings_resp = await ac.put("/api/personal/settings", headers=headers, json=settings_payload)
        assert settings_resp.status_code == 200
        assert settings_resp.json()["personal_cloudinary_url"] == settings_payload["personal_cloudinary_url"]
        
        # Verify custom Cloudinary link connection testing fails on bad credentials
        test_payload = {"personal_cloudinary_url": "cloudinary://bad_key:bad_secret@bad_cloud"}
        test_settings_resp = await ac.post("/api/personal/settings/test", headers=headers, json=test_payload)
        # Should raise 400 Bad Request because the endpoint pings and fails
        assert test_settings_resp.status_code == 400
        assert "Cloudinary ping failed" in test_settings_resp.json()["detail"]
        
        # 5. Clean up (Delete Task & Doc)
        delete_task_resp = await ac.delete(f"/api/personal/tasks/{task_id}", headers=headers)
        assert delete_task_resp.status_code == 204
        
        delete_doc_resp = await ac.delete(f"/api/personal/documents/{doc_id}", headers=headers)
        assert delete_doc_resp.status_code == 204
        
        # Verify both are deleted
        list_tasks_final = await ac.get("/api/personal/tasks", headers=headers)
        assert len(list_tasks_final.json()) == 0
        list_docs_final = await ac.get("/api/personal/documents", headers=headers)
        assert len(list_docs_final.json()) == 0
