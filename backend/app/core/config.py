import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MindBridge AI — Cognitive Screening Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Exasol Configuration
    EXASOL_HOST: str = os.getenv("EXASOL_HOST", "localhost")
    EXASOL_PORT: int = int(os.getenv("EXASOL_PORT", "8563"))
    EXASOL_USER: str = os.getenv("EXASOL_USER", "sys")
    EXASOL_PASSWORD: str = os.getenv("EXASOL_PASSWORD", "exasol")
    EXASOL_SCHEMA: str = os.getenv("EXASOL_SCHEMA", "MINDBRIDGE")
    EXASOL_USE_ENCRYPTION: bool = os.getenv("EXASOL_USE_ENCRYPTION", "false").lower() == "true"
    EXASOL_CONNECTION_TIMEOUT: int = int(os.getenv("EXASOL_CONNECTION_TIMEOUT", "4"))
    
    # Explicit Mock Mode toggle (if true or if connection fails, explicit mock adapter is used)
    USE_MOCK_EXASOL: bool = os.getenv("USE_MOCK_EXASOL", "auto").lower() in ("true", "1", "yes")
    
    # Security & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "mindbridge-secure-key-2026-cognitive-screening-exasol")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Clinical Disclaimer
    CLINICAL_DISCLAIMER: str = (
        "MindBridge AI is an investigational screening and longitudinal research instrument. "
        "It does NOT diagnose Alzheimer's disease, Mild Cognitive Impairment (MCI), or any form of dementia. "
        "Scores and model predictions are research benchmarks that require comprehensive clinical evaluation by licensed medical professionals."
    )

    model_config = {"case_sensitive": True, "env_file": ".env"}

settings = Settings()
