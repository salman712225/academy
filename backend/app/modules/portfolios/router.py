import io
import os
import zipfile
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.database import get_db
from app.modules.auth.service import get_current_user
from app.modules.portfolios.schemas import PortfolioSaveRequest, PortfolioResponse

router = APIRouter(tags=["User Portfolios"])
logger = logging.getLogger("portfolios_router")

# Configure Jinja2 templates path safely
TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "templates")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

@router.get("/api/portfolios/my")
async def get_my_portfolio(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieves the current logged-in user's portfolio configuration."""
    email = current_user["email"].lower()
    doc = await db.user_portfolios.find_one({"user_email": email})
    if not doc:
        # Return default structure if they haven't created one yet
        username_suggestion = email.split("@")[0]
        return {
            "user_email": email,
            "username": username_suggestion,
            "role": current_user.get("role", "student"),
            "template_id": "modern",
            "color_palette": {
                "primary": "#3b82f6",
                "secondary": "#1e3a8a",
                "background": "#f8fafc",
                "text": "#0f172a"
            },
            "enabled_pages": ["home", "about", "projects", "contact"],
            "page_content": {
                "home": {
                    "title": f"Hello, I'm {current_user.get('name', 'a Student')}",
                    "subtitle": "Welcome to my portfolio space."
                },
                "about": {
                    "bio": "I am currently pursuing advanced technical studies at Academy.",
                    "skills": ["JavaScript", "Python", "FastAPI", "React", "MongoDB"]
                },
                "projects": [],
                "experience": [],
                "contact": {
                    "email": email,
                    "linkedin": "",
                    "github": ""
                }
            },
            "is_deployed": False
        }
    
    doc["_id"] = str(doc["_id"])
    return doc

@router.post("/api/portfolios/save")
async def save_portfolio(
    req: PortfolioSaveRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Saves or updates the user's portfolio configuration."""
    email = current_user["email"].lower()
    username = req.username.lower().strip()

    # Basic slug validation
    if not username.isalnum() and "_" not in username and "-" not in username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be alphanumeric and contain only letters, numbers, underscores, or hyphens."
        )

    # Check if username is taken by another user
    existing = await db.user_portfolios.find_one({"username": username})
    if existing and existing.get("user_email") != email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The portfolio URL slug '{username}' is already taken by another user. Please choose another."
        )

    portfolio_dict = req.model_dump()
    portfolio_dict["user_email"] = email
    portfolio_dict["username"] = username
    portfolio_dict["role"] = current_user.get("role", "student")
    portfolio_dict["last_updated"] = datetime.now(timezone.utc)

    # Maintain existing is_deployed state if present, or default to false
    current_doc = await db.user_portfolios.find_one({"user_email": email})
    if current_doc:
        portfolio_dict["is_deployed"] = current_doc.get("is_deployed", False)
        portfolio_dict["deployed_at"] = current_doc.get("deployed_at")
        await db.user_portfolios.update_one(
            {"user_email": email},
            {"$set": portfolio_dict}
        )
    else:
        portfolio_dict["is_deployed"] = False
        portfolio_dict["deployed_at"] = None
        await db.user_portfolios.insert_one(portfolio_dict)

    updated_doc = await db.user_portfolios.find_one({"user_email": email})
    updated_doc["_id"] = str(updated_doc["_id"])
    return updated_doc

@router.post("/api/portfolios/deploy")
async def deploy_portfolio(
    is_deployed: bool,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Publishes or unpublishes the user's portfolio."""
    email = current_user["email"].lower()
    doc = await db.user_portfolios.find_one({"user_email": email})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Please save your portfolio draft first before deploying."
        )

    updates = {
        "is_deployed": is_deployed,
        "last_updated": datetime.now(timezone.utc)
    }
    if is_deployed:
        updates["deployed_at"] = datetime.now(timezone.utc)

    await db.user_portfolios.update_one(
        {"user_email": email},
        {"$set": updates}
    )
    return {"status": "success", "is_deployed": is_deployed}

@router.post("/api/portfolios/export")
async def export_portfolio_zip(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Compiles the portfolio template and streams a ZIP file download."""
    email = current_user["email"].lower()
    portfolio = await db.user_portfolios.find_one({"user_email": email})
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No portfolio config found. Please configure and save your portfolio first."
        )

    template_id = portfolio.get("template_id", "modern")
    
    # Render index.html contents to string using Jinja2
    try:
        template = templates.get_template(f"portfolios/{template_id}.html")
        rendered_html = template.render(
            portfolio=portfolio,
            colors=portfolio.get("color_palette", {})
        )
    except Exception as e:
        logger.error(f"Jinja2 rendering failed for template '{template_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Template compile failed: {str(e)}"
        )

    # Build ZIP archive in-memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        # Write index.html
        zip_file.writestr("index.html", rendered_html)
        
        # Include a clean README file explaining how to open the portfolio
        readme_content = (
            f"# {portfolio['username'].capitalize()}'s Static Portfolio\n\n"
            "This portfolio website was generated dynamically by Academy Portfolios.\n\n"
            "## How to View Offline\n"
            "1. Double-click `index.html` to open the portfolio site in any web browser.\n\n"
            "## How to Deploy Free (e.g. GitHub Pages or Netlify)\n"
            "1. Upload this extracted folder to a new repository on GitHub.\n"
            "2. Enable GitHub Pages inside the repository settings.\n"
        )
        zip_file.writestr("README.md", readme_content)

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/x-zip-compressed",
        headers={
            "Content-Disposition": f"attachment; filename=portfolio_{portfolio['username']}.zip"
        }
    )

@router.get("/portfolios/{username}", response_class=HTMLResponse)
async def serve_public_portfolio(
    username: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Serves the live portfolio site to the public."""
    portfolio = await db.user_portfolios.find_one({"username": username.lower().strip()})
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio page not found."
        )
        
    if not portfolio.get("is_deployed", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This portfolio website has not been published or deployed yet by the owner."
        )

    template_id = portfolio.get("template_id", "modern")
    
    try:
        template = templates.get_template(f"portfolios/{template_id}.html")
        rendered_html = template.render(
            portfolio=portfolio,
            colors=portfolio.get("color_palette", {})
        )
        return HTMLResponse(content=rendered_html)
    except Exception as e:
        logger.error(f"Failed to serve portfolio: {e}")
        return HTMLResponse(
            content=f"<h1>Internal Server Error</h1><p>Failed to compile the template. Details: {str(e)}</p>",
            status_code=500
        )
