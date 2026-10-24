import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field

# ----------------- Auth Schemas -----------------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    email: str
    full_name: Optional[str] = None
    participant_id: Optional[str] = None

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    participant_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = Field(default="participant", description="participant, clinician, researcher, admin")
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    user_id: str
    email: str
    role: str
    full_name: Optional[str] = None
    participant_id: Optional[str] = None
    is_active: bool
    created_at: Any

# ----------------- Participant & Consent Schemas -----------------
class ParticipantConsent(BaseModel):
    agreed_to_research: bool = True
    agreed_to_pseudonymization: bool = True
    agreed_to_longitudinal_tracking: bool = True
    understands_not_diagnostic: bool = True
    signature_name: str
    consent_version: str = "v1.2-irb-approved"

class ParticipantCreate(BaseModel):
    age_group: str = Field(..., description="50-59, 60-69, 70-79, 80+")
    education_years: int = Field(..., ge=0, le=30)
    baseline_notes: Optional[str] = None
    consent: ParticipantConsent

class ParticipantResponse(BaseModel):
    participant_id: str
    pseudonym_code: str
    age_group: str
    education_years: int
    baseline_notes: Optional[str] = None
    consent_version: str
    consent_timestamp: Any
    created_at: Any

# ----------------- Assessment Session Schemas -----------------
class SessionCreate(BaseModel):
    participant_id: str
    device_metadata: Optional[Dict[str, Any]] = None
    consent_confirmed: bool = True

class SessionResponse(BaseModel):
    session_id: str
    participant_id: str
    status: str
    started_at: Any
    completed_at: Optional[Any] = None
    total_duration_ms: Optional[int] = None
    device_metadata: Optional[str] = None
    consent_confirmed: bool

class SessionComplete(BaseModel):
    total_duration_ms: int

# ----------------- Task Result Schemas -----------------
class TrialDetail(BaseModel):
    trial_index: int
    stimulus: Optional[str] = None
    response: Optional[str] = None
    is_correct: bool
    reaction_time_ms: float
    is_omission: bool = False
    is_commission: bool = False

class TaskResultCreate(BaseModel):
    session_id: str
    participant_id: str
    task_type: str = Field(..., description="word_recall_immediate, word_recall_delayed, digit_span, stroop_interference, trail_making_b, semantic_fluency")
    task_name: str
    total_trials: int
    correct_trials: int
    error_count: int
    omission_count: int = 0
    commission_count: int = 0
    mean_reaction_time_ms: float
    median_reaction_time_ms: float
    raw_score: float
    trials_detail: Optional[List[TrialDetail]] = None
    extra_metrics: Optional[Dict[str, Any]] = None

class TaskResultResponse(BaseModel):
    result_id: str
    session_id: str
    participant_id: str
    task_type: str
    task_name: str
    total_trials: int
    correct_trials: int
    error_count: int
    omission_count: int
    commission_count: int
    mean_reaction_time_ms: Optional[float] = None
    median_reaction_time_ms: Optional[float] = None
    raw_score: float
    standardized_z_score: Optional[float] = None
    percentile_rank: Optional[float] = None
    metrics_json: Optional[str] = None
    created_at: Any

# ----------------- Clinician & Longitudinal Schemas -----------------
class DomainScore(BaseModel):
    domain: str  # Memory, Attention/Working Memory, Executive Function, Processing Speed, Language
    raw_score: float
    z_score: float
    percentile: float
    status: str  # Normal, Mild Variance, Borderline, Needs Review

class SessionSummaryReport(BaseModel):
    session_id: str
    date: str
    total_duration_seconds: int
    composite_cognitive_index: float
    domain_scores: List[DomainScore]
    tasks_completed: int

class ClinicianScreeningReport(BaseModel):
    report_id: str
    generated_at: str
    participant_id: str
    pseudonym_code: str
    age_group: str
    education_years: int
    clinician_name: str
    total_sessions_tracked: int
    baseline_date: str
    latest_session_date: str
    domain_summary: List[DomainScore]
    longitudinal_trajectory: List[Dict[str, Any]]
    research_risk_flag: str  # Stable, Slight Decline, High Longitudinal Variance
    clinical_notes: str
    clinical_safeguard_disclaimer: str

# ----------------- ML Research Schemas -----------------
class MLEvaluationRecordResponse(BaseModel):
    evaluation_id: str
    model_name: str
    model_version: str
    evaluation_date: Any
    dataset_description: str
    sample_size: int
    roc_auc: float
    sensitivity: float
    specificity: float
    precision_score: float
    recall_score: float
    f1_score: float
    brier_score: float
    is_synthetic_benchmark: bool
    fairness_metrics_json: Optional[str] = None

class MLPredictionRequest(BaseModel):
    age_group: str
    education_years: int
    immediate_recall_z: float
    delayed_recall_z: float
    digit_span_z: float
    stroop_interference_ms: float
    trail_making_seconds: float
    prior_decline_slope: Optional[float] = 0.0

class MLPredictionResponse(BaseModel):
    investigational_risk_score: float  # 0.0 - 1.0 (calibrated probability)
    risk_category: str  # Low Risk, Moderate Longitudinal Variance, Elevated Research Flag
    confidence_interval: List[float]
    feature_contributions: Dict[str, float]
    model_version: str
    is_diagnostic: bool = False
    disclaimer: str

# ----------------- System & DB Diagnostics -----------------
class DatabaseStatusResponse(BaseModel):
    is_mock: bool
    adapter_name: str
    host: str
    port: int
    schema_name: str
    error_message: Optional[str] = None
    health: Dict[str, Any]
    active_participants_count: int
    total_sessions_count: int
    total_task_results_count: int
