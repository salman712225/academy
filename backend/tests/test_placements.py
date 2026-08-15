import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import patch, AsyncMock
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
    
    # Clean database tables
    await db.users.delete_many({})
    await db.batches.delete_many({})
    await db.placement_leads.delete_many({})
    await db.user_llm_configs.delete_many({})
    
    yield db

@pytest.mark.anyio
async def test_placement_flow(setup_test_db):
    db = setup_test_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Create a Batch
        batch_res = await db.batches.insert_one({
            "_id": "batch_123",
            "name": "Python Fullstack Alpha",
            "description": "Python web development track",
            "is_open": True,
            "group": "ongoing"
        })
        
        # 2. Register Student & Area Head
        await ac.post("/api/auth/register", json={
            "email": "student_crm@academy.com",
            "name": "CRM Student",
            "role": "student",
            "password": "Password123!"
        })
        # Link student to batch
        await db.users.update_one({"email": "student_crm@academy.com"}, {"$set": {"batch_id": "batch_123"}})
        
        await ac.post("/api/auth/register", json={
            "email": "head_crm@academy.com",
            "name": "CRM Area Head",
            "role": "head",
            "password": "Password123!"
        })
        
        # Log in both
        std_login = await ac.post("/api/auth/login", json={"email": "student_crm@academy.com", "password": "Password123!"})
        std_token = std_login.json()["access_token"]
        std_headers = {"Authorization": f"Bearer {std_token}"}
        
        head_login = await ac.post("/api/auth/login", json={"email": "head_crm@academy.com", "password": "Password123!"})
        head_token = head_login.json()["access_token"]
        head_headers = {"Authorization": f"Bearer {head_token}"}
        
        # 3. Test Student Creation of Job Leads
        create_lead_resp = await ac.post("/api/placements", headers=std_headers, json={
            "company": "Google",
            "role": "Software Engineer",
            "stage": "applied",
            "salary": "12 LPA",
            "notes": "Resume submitted via referral."
        })
        assert create_lead_resp.status_code == 201
        lead_data = create_lead_resp.json()
        assert lead_data["company"] == "Google"
        assert lead_data["stage"] == "applied"
        lead_id = lead_data["id"]
        
        # 4. List Leads
        # Student lists leads
        list_std_resp = await ac.get("/api/placements", headers=std_headers)
        assert list_std_resp.status_code == 200
        assert len(list_std_resp.json()) == 1
        assert list_std_resp.json()[0]["company"] == "Google"
        
        # 5. Move Lead Stage
        update_lead_resp = await ac.put(f"/api/placements/{lead_id}", headers=std_headers, json={
            "stage": "interviewing"
        })
        assert update_lead_resp.status_code == 200
        assert update_lead_resp.json()["stage"] == "interviewing"
        
        # 6. Area Head Dashboard View
        # Lists all leads
        list_all_resp = await ac.get("/api/placements", headers=head_headers)
        assert list_all_resp.status_code == 200
        assert len(list_all_resp.json()) == 1
        assert list_all_resp.json()[0]["student_email"] == "student_crm@academy.com"
        assert list_all_resp.json()[0]["batch_name"] == "Python Fullstack Alpha"
        
        # Get stats
        stats_resp = await ac.get("/api/placements/stats", headers=head_headers)
        assert stats_resp.status_code == 200
        stats_data = stats_resp.json()
        assert stats_data["total_leads"] == 1
        assert stats_data["interviewing_count"] == 1
        assert stats_data["batch_stats"]["Python Fullstack Alpha"]["interviewing"] == 1
        
        # 7. Test AI Outreach Generator Endpoint
        # Set up student LLM credentials
        await db.user_llm_configs.insert_one({
            "user_email": "student_crm@academy.com",
            "active_provider": "gemini",
            "api_keys": {"gemini": "dummy_gemini_api_key"}
        })
        
        # Generate outreach draft with mocked LLM call
        with patch("app.modules.placements.router.call_llm", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = "Hello recruiter, I am interested in the role."
            
            gen_resp = await ac.post("/api/placements/generate-outreach", headers=std_headers, json={
                "role_title": "Software Engineer",
                "company_name": "Google",
                "outreach_type": "linkedin",
                "job_description": "We build scale systems.",
                "resume_text": "Experienced Python dev."
            })
            
            assert gen_resp.status_code == 200
            assert gen_resp.json()["generated_text"] == "Hello recruiter, I am interested in the role."
            mock_call.assert_called_once()
            
        # 8. Test Area Head Creation of Placement Lead on behalf of student
        head_create_lead = await ac.post("/api/placements", headers=head_headers, json={
            "company": "Amazon",
            "role": "Systems Analyst",
            "stage": "applied",
            "student_email": "student_crm@academy.com"
        })
        assert head_create_lead.status_code == 201
        assert head_create_lead.json()["company"] == "Amazon"
        assert head_create_lead.json()["student_email"] == "student_crm@academy.com"
