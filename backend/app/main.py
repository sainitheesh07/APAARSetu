from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.core.database import engine, Base
import app.models  # Ensure all models are registered with Base

# Import API routers
from app.api.v1.auth import router as auth_router
from app.api.v1.institutions import router as institutions_router
from app.api.v1.programmes import router as programmes_router
from app.api.v1.students import router as students_router
from app.api.v1.submissions import router as submissions_router
from app.api.v1.validation import router as validation_router
from app.api.v1.verifications import router as verifications_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.audit import router as audit_router
from app.api.v1.users import router as users_router
from app.api.v1.settings import router as settings_router

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="APAARSetu — API Documentation",
    description=(
        "**APAARSetu** is an APAAR-Based Student Data Management, Verification, and Analytics Platform "
        "built for AICTE-Approved Institutions under the Ministry of Education, Government of India.\n\n"
        "Features:\n"
        "- Multi-tier APAAR & Institutional Student Validation Engine\n"
        "- Automated Cross-Institution Duplicate & Dual Enrolment Detection\n"
        "- AICTE Approved Intake Ceiling Enforcement & Overrun Alerts\n"
        "- Complete 11-step Bulk CSV Ingestion with Transactional Rollback\n"
        "- Minimum Disclosure Employer Verification Portal with Digital Seals\n"
        "- Immutable Regulatory Audit Trail & Transparent Data Quality Scoring"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(institutions_router, prefix=settings.API_V1_STR)
app.include_router(programmes_router, prefix=settings.API_V1_STR)
app.include_router(students_router, prefix=settings.API_V1_STR)
app.include_router(submissions_router, prefix=settings.API_V1_STR)
app.include_router(validation_router, prefix=settings.API_V1_STR)
app.include_router(verifications_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    from app.core.database import SessionLocal
    from app.models.user import User
    from app.scripts.seed import seed_database
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            print("Database is empty. Auto-seeding initial records...")
            seed_database()
            print("Auto-seed completed successfully!")
    except Exception as e:
        print(f"Startup check/seed note: {e}")
    finally:
        db.close()

@app.get("/", tags=["System"])
@app.head("/", tags=["System"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "status": "ONLINE",
        "description": "APAARSetu — AICTE APAAR Student Verification & Intake Platform API is active.",
        "documentation": "/docs",
        "health": "/health",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "mode": settings.INTEGRATION_MODE,
        "database": "CONNECTED"
    }

@app.get("/ready", tags=["System"])
def readiness_check():
    return {"ready": True}
