import json
import logging
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.modules.ai_features.llm_client import call_llm
from app.modules.ai_features.schemas import RAGRecommendation, ATSAnalysisResponse

logger = logging.getLogger("ai_agent_workflow")

async def parse_pdf_text(file_bytes: bytes) -> str:
    """
    Parses a PDF file from bytes and extracts all printable text.
    """
    try:
        import io
        from pypdf import PdfReader
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error parsing PDF text: {str(e)}")
        raise ValueError(f"Failed to parse PDF resume: {str(e)}")

async def run_rag_search(db: AsyncIOMotorDatabase, keywords: List[str]) -> List[RAGRecommendation]:
    """
    RAG Searcher Agent: Searches db.batches, db.notes, and db.books for items matching missing skill keywords.
    """
    recommendations = []
    if not keywords:
        return recommendations

    # Clean keywords to avoid regex issues
    clean_keywords = [kw.strip() for kw in keywords if len(kw.strip()) > 1]
    if not clean_keywords:
        return recommendations

    # Search Batches (Courses)
    try:
        batches_cursor = db.batches.find({"is_open": True})
        async for batch in batches_cursor:
            batch_name = batch.get("name", "")
            batch_desc = batch.get("description", "")
            for kw in clean_keywords:
                if kw.lower() in batch_name.lower() or kw.lower() in batch_desc.lower():
                    recommendations.append(RAGRecommendation(
                        type="batch",
                        title=f"Course: {batch_name}",
                        description=f"Active batch opening. Can help you learn: {kw}.",
                        link_or_details=f"Batch ID: {str(batch['_id'])}"
                    ))
                    break  # Avoid duplicates for same batch
    except Exception as e:
        logger.warning(f"RAG search on batches failed: {e}")

    # Search Notes (Course study material)
    try:
        notes_cursor = db.notes.find()
        async for note in notes_cursor:
            title = note.get("title", "")
            description = note.get("description", "")
            for kw in clean_keywords:
                if kw.lower() in title.lower() or kw.lower() in description.lower():
                    recommendations.append(RAGRecommendation(
                        type="note",
                        title=f"Study Material: {title}",
                        description=f"Lecture notes / guides. Refers to: {kw}.",
                        link_or_details=f"/documents/notes/{str(note['_id'])}/download"
                    ))
                    break
    except Exception as e:
        logger.warning(f"RAG search on notes failed: {e}")

    # Search Books (Library catalog)
    try:
        books_cursor = db.books.find()
        async for book in books_cursor:
            title = book.get("title", "")
            author = book.get("author", "")
            for kw in clean_keywords:
                if kw.lower() in title.lower():
                    recommendations.append(RAGRecommendation(
                        type="book",
                        title=f"Book: {title}",
                        description=f"Library book by {author}. Covers: {kw}.",
                        link_or_details=f"Book ID: {str(book['_id'])}"
                    ))
                    break
    except Exception as e:
        logger.warning(f"RAG search on books failed: {e}")

    # Deduplicate and limit recommendations to top 8 items to prevent prompt overflow
    seen = set()
    deduped = []
    for r in recommendations:
        key = (r.type, r.title)
        if key not in seen:
            seen.add(key)
            deduped.append(r)
            
    return deduped[:8]

async def run_ats_analyzer_agentic_workflow(
    resume_text: str,
    job_description: str,
    db: AsyncIOMotorDatabase,
    provider: str,
    api_key: str
) -> ATSAnalysisResponse:
    """
    Executes a multi-agent stateful analysis workflow:
    1. Extractor & Skill auditor (Extract match/miss skills)
    2. RAG Searcher (Query db for notes, courses, books matching miss skills)
    3. Explainable AI auditor (Generate final scoring, weights, breakdown report)
    """
    # Node 1: Skill auditor
    extractor_instruction = (
        "You are an ATS Resume Skill Auditor. Your task is to compare the candidate's resume text "
        "against the target Job Description. Identify exactly which skills/technologies match, and "
        "which skills/technologies are required by the Job Description but missing from the resume. "
        "You must output a valid JSON object matching this structure EXACTLY: "
        "{\n"
        '  "matching_keywords": ["react", "git", ...],\n'
        '  "missing_keywords": ["fastapi", "docker", ...]\n'
        "}\n"
        "Do not include any markup, markdown tags, or extra chat explanation. Output only valid JSON."
    )
    
    prompt = f"RESUME TEXT:\n{resume_text}\n\nJOB DESCRIPTION:\n{job_description}"
    
    extractor_response = await call_llm(
        provider=provider,
        api_key=api_key,
        prompt=prompt,
        system_instruction=extractor_instruction,
        response_format_json=True
    )
    
    # Parse extracted lists
    try:
        # Strip markdown code block wrappers if any were hallucinated
        cleaned_json = extractor_response.strip()
        if cleaned_json.startswith("```"):
            lines = cleaned_json.split("\n")
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                cleaned_json = "\n".join(lines[1:-1])
        
        extracted_data = json.loads(cleaned_json)
        matching_keywords = extracted_data.get("matching_keywords", [])
        missing_keywords = extracted_data.get("missing_keywords", [])
    except Exception as e:
        logger.error(f"Failed to parse extractor response: {extractor_response}. Error: {e}")
        matching_keywords = []
        missing_keywords = []

    # Node 2: RAG Searcher
    # Use missing keywords to query internal collections for courses, documents, library books
    rag_recs = await run_rag_search(db, missing_keywords)

    # Node 3: Explainable AI Auditor (Scoring and Explanation)
    explainer_instruction = (
        "You are an Explainable AI ATS Auditor. Evaluate the candidate's resume against the Job Description. "
        "You must calculate a matching score (0 to 100) based on skill match (40%), experience relevance (30%), "
        "and credentials/formatting (30%). "
        "Provide a detailed, professional, transparent written explanation of why the score was assigned, "
        "detailing the exact weights breakdown (e.g. 'Skills: 25/40, Experience: 15/30...'). "
        "Also list core strengths, and actionable suggestions to improve the resume. "
        "You must output a valid JSON object matching this structure EXACTLY:\n"
        "{\n"
        '  "score": 75,\n'
        '  "explanation": "Detailed explanation of the weights: ...",\n'
        '  "strengths": ["Strong React background", "Good team experience"],\n'
        '  "suggestions": ["Add Docker deployment details", "Elaborate on FastAPI backends"]\n'
        "}\n"
        "Do not include any extra text. Output ONLY valid JSON."
    )
    
    explainer_prompt = (
        f"RESUME TEXT:\n{resume_text}\n\n"
        f"JOB DESCRIPTION:\n{job_description}\n\n"
        f"MATCHING SKILLS:\n{', '.join(matching_keywords)}\n\n"
        f"MISSING SKILLS:\n{', '.join(missing_keywords)}"
    )
    
    explainer_response = await call_llm(
        provider=provider,
        api_key=api_key,
        prompt=explainer_prompt,
        system_instruction=explainer_instruction,
        response_format_json=True
    )
    
    try:
        cleaned_explainer = explainer_response.strip()
        if cleaned_explainer.startswith("```"):
            lines = cleaned_explainer.split("\n")
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                cleaned_explainer = "\n".join(lines[1:-1])
                
        evaluation = json.loads(cleaned_explainer)
        score = evaluation.get("score", 0)
        explanation = evaluation.get("explanation", "No explanation compiled.")
        strengths = evaluation.get("strengths", [])
        suggestions = evaluation.get("suggestions", [])
    except Exception as e:
        logger.error(f"Failed to parse explainer response: {explainer_response}. Error: {e}")
        score = 0
        explanation = f"Error parsing AI Auditor output: {str(e)}"
        strengths = []
        suggestions = ["Rewrite bullet points to match JD keywords.", "Review missing technical capabilities."]

    return ATSAnalysisResponse(
        score=score,
        explanation=explanation,
        matching_keywords=matching_keywords,
        missing_keywords=missing_keywords,
        strengths=strengths,
        suggestions=suggestions,
        rag_recommendations=rag_recs
    )
