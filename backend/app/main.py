import asyncio
import logging
import os
from fastapi import FastAPI, Depends, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, get_db
from app.modules.auth.service import seed_head_user

# Import Routers
from app.modules.auth.router import router as auth_router
from app.modules.batches.router import router as batches_router
from app.modules.library.router import router as library_router
from app.modules.leads.router import router as leads_router
from app.modules.attendance.router import router as attendance_router
from app.modules.emails.router import router as emails_router
from app.modules.bulk_upload.router import router as bulk_upload_router
from app.modules.events.router import router as events_router
from app.modules.documents.router import router as documents_router
from app.modules.ai_features.router import router as ai_features_router
from app.modules.digital_library.router import router as digital_library_router


# Import Background worker
from app.workers.due_checker import schedule_due_checker_daemon, run_daily_due_check

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("academy_main")

background_tasks = set()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    await connect_to_mongo()
    db = await get_db()
    
    # Seed Area Head account
    await seed_head_user(db)
    
    # Start the Daily Library Overdue Audit Daemon
    task = asyncio.create_task(schedule_due_checker_daemon(db))
    background_tasks.add(task)
    task.add_done_callback(background_tasks.discard)
    
    yield
    
    # Shutdown actions
    # Cancel background tasks
    for t in background_tasks:
        t.cancel()
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# Set CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Test helper routes router
test_router = APIRouter(prefix="/test", tags=["Testing Helpers"])

@test_router.post("/trigger-daily-check")
async def trigger_due_check_manually(db = Depends(get_db)):
    """Forces immediate execution of the daily return dates and fines audit."""
    results = await run_daily_due_check(db)
    return {
        "status": "success",
        "message": "Daily library lending checks triggered successfully.",
        "results": results
    }

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(batches_router, prefix=settings.API_V1_STR)
app.include_router(library_router, prefix=settings.API_V1_STR)
app.include_router(leads_router, prefix=settings.API_V1_STR)
app.include_router(attendance_router, prefix=settings.API_V1_STR)
app.include_router(emails_router, prefix=settings.API_V1_STR)
app.include_router(bulk_upload_router, prefix=settings.API_V1_STR)
app.include_router(events_router, prefix=settings.API_V1_STR)
app.include_router(documents_router, prefix=settings.API_V1_STR)
app.include_router(ai_features_router, prefix=settings.API_V1_STR)
app.include_router(digital_library_router, prefix=settings.API_V1_STR)
app.include_router(test_router, prefix=settings.API_V1_STR)


# Ensure uploads directories exist
os.makedirs(os.path.join("uploads", "notes"), exist_ok=True)
os.makedirs(os.path.join("uploads", "resumes"), exist_ok=True)

# Mount static uploads
app.mount("/static/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {"message": "Academy Management System Backend Running!"}
