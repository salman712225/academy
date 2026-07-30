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
    await db.notes.delete_many({})
    await db.resumes.delete_many({})
    
    yield db
    
    # Cleanup files
    if os.path.exists("uploads/notes"):
        for f in os.listdir("uploads/notes"):
            try:
                os.remove(os.path.join("uploads/notes", f))
            except Exception:
                pass
    if os.path.exists("uploads/resumes"):
        for f in os.listdir("uploads/resumes"):
            try:
                os.remove(os.path.join("uploads/resumes", f))
            except Exception:
                pass


@pytest.mark.anyio
async def test_documents_flow(setup_test_db):
    db = setup_test_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Register head, trainer, and student
        await ac.post("/api/auth/register", json={
            "email": "doc_head@academy.com",
            "name": "Doc Head",
            "role": "head",
            "password": "Password123!"
        })
        await ac.post("/api/auth/register", json={
            "email": "doc_trainer@academy.com",
            "name": "Doc Trainer",
            "role": "trainer",
            "password": "Password123!"
        })
        await ac.post("/api/auth/register", json={
            "email": "doc_student@academy.com",
            "name": "Doc Student",
            "role": "student",
            "password": "Password123!"
        })

        # 2. Get tokens
        login_head = await ac.post("/api/auth/login", json={"email": "doc_head@academy.com", "password": "Password123!"})
        head_token = login_head.json()["access_token"]
        head_headers = {"Authorization": f"Bearer {head_token}"}

        login_student = await ac.post("/api/auth/login", json={"email": "doc_student@academy.com", "password": "Password123!"})
        student_token = login_student.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}

        # 3. Head uploads a note (success case - PDF)
        pdf_file = io.BytesIO(b"%PDF-1.4 ... test pdf content")
        files = {"file": ("lecture1.pdf", pdf_file, "application/pdf")}
        data = {"title": "FastAPI Lecture 1", "description": "Introduction to FastAPI framework"}
        
        upload_resp = await ac.post("/api/documents/notes/upload", headers=head_headers, data=data, files=files)
        assert upload_resp.status_code == 201
        note_data = upload_resp.json()
        assert note_data["title"] == "FastAPI Lecture 1"
        assert note_data["filename"] == "lecture1.pdf"
        assert "uploads/notes/" in note_data["filepath"]
        note_id = note_data["id"]

        # 4. Head uploads invalid format (error case - TXT)
        txt_file = io.BytesIO(b"some text content")
        files_invalid = {"file": ("lecture1.txt", txt_file, "text/plain")}
        upload_invalid_resp = await ac.post("/api/documents/notes/upload", headers=head_headers, data=data, files=files_invalid)
        assert upload_invalid_resp.status_code == 400
        assert "Only PDF, PPT, and PPTX" in upload_invalid_resp.json()["detail"]

        # 5. Student lists notes
        list_notes_resp = await ac.get("/api/documents/notes", headers=student_headers)
        assert list_notes_resp.status_code == 200
        notes_list = list_notes_resp.json()
        assert len(notes_list) == 1
        assert notes_list[0]["title"] == "FastAPI Lecture 1"

        # 6. Student uploads resume (success case - PDF)
        resume_pdf = io.BytesIO(b"%PDF-1.4 ... test resume content")
        files_resume = {"file": ("my_resume.pdf", resume_pdf, "application/pdf")}
        
        resume_resp = await ac.post("/api/documents/resumes/upload", headers=student_headers, files=files_resume)
        assert resume_resp.status_code == 200
        resume_data = resume_resp.json()
        assert resume_data["student_email"] == "doc_student@academy.com"
        assert resume_data["filename"] == "my_resume.pdf"
        assert "uploads/resumes/" in resume_data["filepath"]

        # 7. Student uploads invalid format resume (error case - DOCX)
        resume_docx = io.BytesIO(b"docx content")
        files_docx = {"file": ("my_resume.docx", resume_docx, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        resume_invalid_resp = await ac.post("/api/documents/resumes/upload", headers=student_headers, files=files_docx)
        assert resume_invalid_resp.status_code == 400
        assert "Resumes must be in PDF format" in resume_invalid_resp.json()["detail"]

        # 8. Student gets own resume status
        my_resume_resp = await ac.get("/api/documents/resumes/my-resume", headers=student_headers)
        assert my_resume_resp.status_code == 200
        assert my_resume_resp.json()["filename"] == "my_resume.pdf"

        # 9. Head lists student resumes
        resumes_list_resp = await ac.get("/api/documents/resumes", headers=head_headers)
        assert resumes_list_resp.status_code == 200
        resumes_list = resumes_list_resp.json()
        assert len(resumes_list) == 1
        assert resumes_list[0]["student_email"] == "doc_student@academy.com"

        # 10. Student tries to list student resumes (unauthorized check)
        unauth_list_resp = await ac.get("/api/documents/resumes", headers=student_headers)
        assert unauth_list_resp.status_code == 403

        # 11. Download note and resume
        download_note_resp = await ac.get(f"/api/documents/notes/{note_id}/download", headers=student_headers)
        assert download_note_resp.status_code == 200
        assert download_note_resp.content == b"%PDF-1.4 ... test pdf content"
        assert "attachment" in download_note_resp.headers["content-disposition"]
        assert 'filename="lecture1.pdf"' in download_note_resp.headers["content-disposition"]

        login_trainer = await ac.post("/api/auth/login", json={"email": "doc_trainer@academy.com", "password": "Password123!"})
        trainer_token = login_trainer.json()["access_token"]
        trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
        
        resume_id = resumes_list[0]["id"]
        download_resume_resp = await ac.get(f"/api/documents/resumes/{resume_id}/download", headers=trainer_headers)
        assert download_resume_resp.status_code == 200
        assert download_resume_resp.content == b"%PDF-1.4 ... test resume content"
        assert "attachment" in download_resume_resp.headers["content-disposition"]
        assert 'filename="my_resume.pdf"' in download_resume_resp.headers["content-disposition"]

        # 12. Head deletes the note
        delete_note_resp = await ac.delete(f"/api/documents/notes/{note_id}", headers=head_headers)
        assert delete_note_resp.status_code == 204

        # 13. Student lists notes (should be empty now)
        list_empty_resp = await ac.get("/api/documents/notes", headers=student_headers)
        assert list_empty_resp.status_code == 200
        assert len(list_empty_resp.json()) == 0
