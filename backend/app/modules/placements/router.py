from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional

from app.core.database import get_db
from app.modules.auth.service import get_current_user
from app.modules.ai_features.llm_client import call_llm
from app.modules.placements.schemas import (
    PlacementLeadCreate,
    PlacementLeadUpdate,
    PlacementLeadResponse,
    OutreachGenerateRequest,
    OutreachGenerateResponse,
    PlacementStatsResponse
)
from app.modules.placements import service

router = APIRouter(prefix="/placements", tags=["Placement & Career CRM"])

async def get_user_llm_config_or_raise(db: AsyncIOMotorDatabase, email: str):
    config = await db.user_llm_configs.find_one({"user_email": email.lower()})
    if not config or not config.get("active_provider"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="LLM API key not configured. Please go to the AI Settings tab in the AI Placement Suite and enter your API key first."
        )
    active_provider = config["active_provider"]
    api_keys = config.get("api_keys", {})
    api_key = api_keys.get(active_provider)
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"API key for active provider '{active_provider}' is not configured in AI Settings."
        )
    return active_provider, api_key

@router.get("", response_model=List[PlacementLeadResponse])
async def list_placements(
    batch_id: Optional[str] = None,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List placement leads. Students see their own; Area Heads/Admins see all (filtered optionally by batch)."""
    if current_user.get("role") == "student":
        return await service.get_student_leads(db, current_user["email"])
    elif current_user.get("role") in ["head", "trainer", "ca"]:
        return await service.get_all_leads_with_batch(db, batch_id)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized access to placement leads."
        )

@router.post("", response_model=PlacementLeadResponse, status_code=status.HTTP_201_CREATED)
async def create_placement_lead(
    payload: PlacementLeadCreate,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Add a new job lead to the placement tracker (supports creation by student or admin/trainer for any student)."""
    role = current_user.get("role")
    
    if role == "student":
        student_email = current_user["email"]
    elif role in ["head", "trainer", "ca"]:
        if not payload.student_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="student_email is required when creating a placement lead as an administrator."
            )
        # Verify student exists
        student = await db.users.find_one({"email": payload.student_email.lower(), "role": "student"})
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target student account not found."
              )
        student_email = payload.student_email.lower()
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students or placement admins can log placement leads."
        )

    lead = await service.create_lead(db, student_email, payload)
    
    # Fetch details to append student name and batch name for UI consistency
    leads = await service.get_student_leads(db, student_email)
    for l in leads:
        if l["id"] == lead["id"]:
            return l
    return lead

@router.put("/{lead_id}", response_model=PlacementLeadResponse)
async def update_placement_lead(
    lead_id: str,
    payload: PlacementLeadUpdate,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update lead stage or notes. Drag & drop stage updates call this."""
    role = current_user.get("role")
    student_email = current_user["email"] if role == "student" else None
    
    updated = await service.update_lead(db, lead_id, payload, student_email=student_email)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Placement lead not found or unauthorized."
        )
        
    # Refresh stats details
    all_leads = await list_placements(db=db, current_user=current_user)
    for l in all_leads:
        if l["id"] == lead_id:
            return l
    return updated

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_placement_lead(
    lead_id: str,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete a placement lead."""
    role = current_user.get("role")
    student_email = current_user["email"] if role == "student" else None
    
    success = await service.delete_lead(db, lead_id, student_email=student_email)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Placement lead not found or unauthorized."
        )
    return None

@router.get("/stats", response_model=PlacementStatsResponse)
async def get_placement_statistics(
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get aggregated metrics on pipeline conversion rates and counts per batch."""
    if current_user.get("role") not in ["head", "trainer", "ca"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Area Heads, Trainers, or Associates can access centralized placement analytics."
        )
    return await service.get_placement_stats(db)

@router.post("/generate-outreach", response_model=OutreachGenerateResponse)
async def generate_outreach_draft(
    payload: OutreachGenerateRequest,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Generate professional cover letter or LinkedIn introduction message drafts."""
    provider, api_key = await get_user_llm_config_or_raise(db, current_user["email"])
    
    system_instruction = (
        "You are an expert career placement coach. Your task is to generate highly customized, "
        "professional outreach messages, cold emails, cover letters, or LinkedIn introduction drafts "
        "based on job openings and candidate resume details. Keep the tone professional, persuasive, "
        "and concise. Avoid generic placeholders and output clean copy directly."
    )
    
    prompt = f"""
Generate a professional {payload.outreach_type} draft for:
Company: {payload.company_name}
Role: {payload.role_title}

Job Description details (if provided):
{payload.job_description or "Not provided"}

Candidate Skills / Resume summary (if provided):
{payload.resume_text or "Not provided"}

Guidelines:
- If outreach_type is "linkedin", generate a concise, highly engaging message (under 300 characters or very short).
- If outreach_type is "email", generate a professional cold email draft with a clear subject line and body.
- If outreach_type is "follow_up", generate a polite follow-up email/message inquiring about the application status.
- Ensure the message highlights how the candidate's skills make them a strong fit for the role. Do not use generic template fields in brackets like [Your Name] if you can avoid it; write a direct, clean response.
"""
    
    try:
        draft = await call_llm(
            provider=provider,
            api_key=api_key,
            prompt=prompt,
            system_instruction=system_instruction
        )
        return OutreachGenerateResponse(generated_text=draft.strip())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate draft: {str(e)}"
        )
