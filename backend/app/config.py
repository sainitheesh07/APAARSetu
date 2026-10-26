import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "APAARSetu"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "eduverify-ai-sih2026-super-secure-production-ready-jwt-secret-key-32chars")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for demo ease

    # Database: SQLite fallback by default for instant local execution, or PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./eduverify.db")

    # External Integration settings
    AICTE_API_BASE_URL: str = os.getenv("AICTE_API_BASE_URL", "https://api.aicte-india.org/v1/mock")
    APAAR_API_BASE_URL: str = os.getenv("APAAR_API_BASE_URL", "https://api.apaar.gov.in/v1/mock")
    AICTE_API_KEY: str = os.getenv("AICTE_API_KEY", "DEMO-AICTE-API-KEY-2026")
    APAAR_API_KEY: str = os.getenv("APAAR_API_KEY", "DEMO-APAAR-API-KEY-2026")
    INTEGRATION_MODE: str = os.getenv("INTEGRATION_MODE", "SIMULATED")  # SIMULATED vs CONNECTED

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
