import datetime
import json
import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.audit import log_audit_event
from app.core.security import get_current_user
from app.database.connection import get_db
from app.models.schemas import SessionComplete, SessionCreate, SessionResponse, TaskResultCreate, TaskResultResponse
from app.services.scoring import calculate_normative_score

router = APIRouter(prefix="/assessments", tags=["Assessments"])

@router.post("/start", response_model=SessionResponse)
def start_assessment_session(payload: SessionCreate, current_user: dict = Depends(get_current_user)):
    """Initializes a new standardized assessment session."""
    db = get_db()
    # Verify participant exists
    p = db.fetch_one("SELECT * FROM MINDBRIDGE.PARTICIPANTS WHERE participant_id = :id", {"id": payload.participant_id})
    if not p:
        raise HTTPException(status_code=404, detail="Participant does not exist.")

    session_id = f"sess-{uuid.uuid4().hex[:10]}"
    now = datetime.datetime.utcnow().isoformat()
    dev_meta = json.dumps(payload.device_metadata or {"client": "web_browser"})

    record = {
        "session_id": session_id,
        "participant_id": payload.participant_id,
        "status": "in_progress",
        "started_at": now,
        "completed_at": None,
        "total_duration_ms": 0,
        "device_metadata": dev_meta,
        "consent_confirmed": payload.consent_confirmed
    }

    if hasattr(db, "insert"):
        db.insert("ASSESSMENT_SESSIONS", record)
    else:
        query = """
        INSERT INTO MINDBRIDGE.ASSESSMENT_SESSIONS 
        (session_id, participant_id, status, started_at, completed_at, total_duration_ms, device_metadata, consent_confirmed)
        VALUES (:session_id, :participant_id, :status, CURRENT_TIMESTAMP, NULL, 0, :device_metadata, :consent_confirmed)
        """
        db.execute(query, record)

    log_audit_event(
        action="START_ASSESSMENT_SESSION",
        resource_type="SESSION",
        resource_id=session_id,
        user_id=current_user.get("user_id"),
        details={"participant_id": payload.participant_id}
    )

    return record

@router.post("/tasks/submit", response_model=TaskResultResponse)
def submit_task_result(payload: TaskResultCreate, current_user: dict = Depends(get_current_user)):
    """
    Submits trial metrics for a specific cognitive task.
    Automatically applies normative baseline adjustments to compute Z-score and percentile rank.
    """
    db = get_db()
    
    # Retrieve participant demographic profile for normative baseline adjustments
    participant = db.fetch_one("SELECT * FROM MINDBRIDGE.PARTICIPANTS WHERE participant_id = :id", {"id": payload.participant_id})
    age_group = participant.get("age_group", "60-69") if participant else "60-69"
    education_years = participant.get("education_years", 14) if participant else 14

    # Calculate Z-score and percentile rank
    z_score, percentile, _ = calculate_normative_score(
        task_type=payload.task_type,
        raw_score=payload.raw_score,
        age_group=age_group,
        education_years=education_years
    )

    res_id = f"res-{uuid.uuid4().hex[:10]}"
    now = datetime.datetime.utcnow().isoformat()
    
    metrics_dict = {
        "trials_detail": [t.model_dump() for t in payload.trials_detail] if payload.trials_detail else [],
        "extra_metrics": payload.extra_metrics or {}
    }

    record = {
        "result_id": res_id,
        "session_id": payload.session_id,
        "participant_id": payload.participant_id,
        "task_type": payload.task_type,
        "task_name": payload.task_name,
        "total_trials": payload.total_trials,
        "correct_trials": payload.correct_trials,
        "error_count": payload.error_count,
        "omission_count": payload.omission_count,
        "commission_count": payload.commission_count,
        "mean_reaction_time_ms": payload.mean_reaction_time_ms,
        "median_reaction_time_ms": payload.median_reaction_time_ms,
        "raw_score": payload.raw_score,
        "standardized_z_score": z_score,
        "percentile_rank": percentile,
        "metrics_json": json.dumps(metrics_dict),
        "created_at": now
    }

    if hasattr(db, "insert"):
        db.insert("TASK_RESULTS", record)
    else:
        query = """
        INSERT INTO MINDBRIDGE.TASK_RESULTS 
        (result_id, session_id, participant_id, task_type, task_name, total_trials, correct_trials, error_count, 
         omission_count, commission_count, mean_reaction_time_ms, median_reaction_time_ms, raw_score, standardized_z_score, 
         percentile_rank, metrics_json, created_at)
        VALUES (:result_id, :session_id, :participant_id, :task_type, :task_name, :total_trials, :correct_trials, :error_count,
         :omission_count, :commission_count, :mean_reaction_time_ms, :median_reaction_time_ms, :raw_score, :standardized_z_score,
         :percentile_rank, :metrics_json, CURRENT_TIMESTAMP)
        """
        db.execute(query, record)

    log_audit_event(
        action="SUBMIT_TASK_RESULT",
        resource_type="TASK_RESULT",
        resource_id=res_id,
        user_id=current_user.get("user_id"),
        details={"task_type": payload.task_type, "z_score": z_score}
    )

    return record

@router.post("/session/{session_id}/complete")
def complete_assessment_session(session_id: str, payload: SessionComplete, current_user: dict = Depends(get_current_user)):
    """Marks an active assessment session as completed and logs final duration."""
    db = get_db()
    now = datetime.datetime.utcnow().isoformat()

    if hasattr(db, "tables"):
        for s in db.tables["ASSESSMENT_SESSIONS"]:
            if s["session_id"] == session_id:
                s["status"] = "completed"
                s["completed_at"] = now
                s["total_duration_ms"] = payload.total_duration_ms
                break
    else:
        query = """
        UPDATE MINDBRIDGE.ASSESSMENT_SESSIONS
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP, total_duration_ms = :dur
        WHERE session_id = :sid
        """
        db.execute(query, {"dur": payload.total_duration_ms, "sid": session_id})

    log_audit_event(
        action="COMPLETE_ASSESSMENT_SESSION",
        resource_type="SESSION",
        resource_id=session_id,
        user_id=current_user.get("user_id"),
        details={"duration_ms": payload.total_duration_ms}
    )

    return {"status": "success", "session_id": session_id, "completed_at": now}

@router.get("/session/{session_id}")
def get_session_details(session_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieves session metadata and all recorded task results."""
    db = get_db()
    session = db.fetch_one("SELECT * FROM MINDBRIDGE.ASSESSMENT_SESSIONS WHERE session_id = :id", {"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    tasks = db.fetch_all("SELECT * FROM MINDBRIDGE.TASK_RESULTS WHERE session_id = :id", {"id": session_id})
    return {"session": session, "tasks": tasks}

@router.get("/participant/{participant_id}")
def get_participant_sessions(participant_id: str, current_user: dict = Depends(get_current_user)):
    """Lists all assessment sessions and task results for a participant."""
    db = get_db()
    sessions = db.fetch_all("SELECT * FROM MINDBRIDGE.ASSESSMENT_SESSIONS WHERE participant_id = :id ORDER BY started_at DESC", {"id": participant_id})
    tasks = db.fetch_all("SELECT * FROM MINDBRIDGE.TASK_RESULTS WHERE participant_id = :id ORDER BY created_at ASC", {"id": participant_id})
    return {"sessions": sessions, "tasks": tasks}
