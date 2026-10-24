import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.connection import init_db_connection, get_db_status
from app.routers import analytics, assessments, auth, clinician, ml_research, participants, system

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("mindbridge")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes database connection and logs system status."""
    logger.info("Starting MindBridge AI Cognitive Screening API...")
    init_db_connection()
    status = get_db_status()
    logger.info(f"Database Adapter: {status['adapter_name']} (is_mock={status['is_mock']})")
    yield
    logger.info("Shutting down MindBridge AI API...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Cognitive Screening & Longitudinal Monitoring Platform for Alzheimer's Research. High-performance persistence backed by Exasol Personal.",
    docs_url=f"{settings.API_V1_STR}/docs",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(participants.router, prefix=settings.API_V1_STR)
app.include_router(assessments.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(clinician.router, prefix=settings.API_V1_STR)
app.include_router(ml_research.router, prefix=settings.API_V1_STR)
app.include_router(system.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "api_docs": f"{settings.API_V1_STR}/docs",
        "clinical_safeguard": settings.CLINICAL_DISCLAIMER
    }
