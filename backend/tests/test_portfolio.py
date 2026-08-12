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
    await db.user_portfolios.delete_many({})
    
    yield db

@pytest.mark.anyio
async def test_portfolio_flow(setup_test_db):
    db = setup_test_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Register and Log in a user
        await ac.post("/api/auth/register", json={
            "email": "portfolio_student@academy.com",
            "name": "Portfolio Student",
            "role": "student",
            "password": "Password123!"
        })
        
        login_resp = await ac.post("/api/auth/login", json={
            "email": "portfolio_student@academy.com",
            "password": "Password123!"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Get my portfolio config (initially default)
        get_my_resp = await ac.get("/api/portfolios/my", headers=headers)
        assert get_my_resp.status_code == 200
        default_config = get_my_resp.json()
        assert default_config["user_email"] == "portfolio_student@academy.com"
        assert default_config["template_id"] == "modern"
        assert default_config["is_deployed"] is False
        
        # 3. Save portfolio settings
        save_payload = {
            "username": "portfoliostudent",
            "template_id": "minimal",
            "color_palette": {
                "primary": "#ff0000",
                "secondary": "#00ff00",
                "background": "#0000ff",
                "text": "#ffffff"
            },
            "enabled_pages": ["home", "about", "projects", "contact"],
            "page_content": {
                "home": {
                    "title": "Welcome Home",
                    "subtitle": "Test Subtitle"
                },
                "about": {
                    "bio": "I am a test candidate.",
                    "skills": ["Python", "FastAPI"]
                },
                "projects": [
                  {"title": "Test Proj", "description": "Demo desc", "link": "http://example.com"}
                ],
                "experience": [],
                "contact": {
                    "email": "portfolio_student@academy.com",
                    "linkedin": "",
                    "github": ""
                }
            }
        }
        
        save_resp = await ac.post("/api/portfolios/save", headers=headers, json=save_payload)
        assert save_resp.status_code == 200
        save_data = save_resp.json()
        assert save_data["username"] == "portfoliostudent"
        assert save_data["template_id"] == "minimal"
        assert save_data["color_palette"]["primary"] == "#ff0000"
        
        # Try to save with duplicate username using another user
        await ac.post("/api/auth/register", json={
            "email": "another_student@academy.com",
            "name": "Another Student",
            "role": "student",
            "password": "Password123!"
        })
        login_resp_2 = await ac.post("/api/auth/login", json={
            "email": "another_student@academy.com",
            "password": "Password123!"
        })
        token_2 = login_resp_2.json()["access_token"]
        headers_2 = {"Authorization": f"Bearer {token_2}"}
        
        dup_payload = {**save_payload, "username": "portfoliostudent"}
        dup_resp = await ac.post("/api/portfolios/save", headers=headers_2, json=dup_payload)
        assert dup_resp.status_code == 400
        assert "already taken" in dup_resp.json()["detail"]
        
        # 4. Deploy portfolio
        # Initially not deployed, public page should return 403 Forbidden
        public_resp = await ac.get("/portfolios/portfoliostudent")
        assert public_resp.status_code == 403
        
        # Toggle deploy
        deploy_resp = await ac.post("/api/portfolios/deploy?is_deployed=true", headers=headers)
        assert deploy_resp.status_code == 200
        assert deploy_resp.json()["is_deployed"] is True
        
        # Access public page
        public_resp_2 = await ac.get("/portfolios/portfoliostudent")
        assert public_resp_2.status_code == 200
        assert "Welcome Home" in public_resp_2.text
        
        # 5. Export ZIP file
        export_resp = await ac.post("/api/portfolios/export", headers=headers)
        assert export_resp.status_code == 200
        assert export_resp.headers["content-type"] == "application/x-zip-compressed"
        assert len(export_resp.content) > 0
