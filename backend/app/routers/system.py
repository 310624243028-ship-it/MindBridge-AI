from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from app.core.security import get_current_user, require_role
from app.database.connection import get_db, get_db_status
from app.models.schemas import DatabaseStatusResponse

router = APIRouter(prefix="/system", tags=["System & Exasol Diagnostics"])

@router.get("/health")
def health_check():
    """Quick API health endpoint."""
    return {"status": "ok", "service": "MindBridge AI Cognitive Screening API", "version": "1.0.0"}

@router.get("/db-status", response_model=DatabaseStatusResponse)
def get_database_status():
    """
    Returns full database diagnostic details including:
    - Active adapter (Real Exasol vs Explicit Mock Exasol)
    - Connection parameters (host, port, schema)
    - Health check ping
    - Total record counts across tables
    """
    db = get_db()
    status_info = get_db_status()

    # Query row counts
    participants_count = 0
    sessions_count = 0
    tasks_count = 0

    if hasattr(db, "tables"):
        participants_count = len(db.tables.get("PARTICIPANTS", []))
        sessions_count = len(db.tables.get("ASSESSMENT_SESSIONS", []))
        tasks_count = len(db.tables.get("TASK_RESULTS", []))
    else:
        try:
            p_rows = db.fetch_all("SELECT COUNT(*) AS CNT FROM MINDBRIDGE.PARTICIPANTS")
            participants_count = p_rows[0].get("cnt", 0) if p_rows else 0
            s_rows = db.fetch_all("SELECT COUNT(*) AS CNT FROM MINDBRIDGE.ASSESSMENT_SESSIONS")
            sessions_count = s_rows[0].get("cnt", 0) if s_rows else 0
            t_rows = db.fetch_all("SELECT COUNT(*) AS CNT FROM MINDBRIDGE.TASK_RESULTS")
            tasks_count = t_rows[0].get("cnt", 0) if t_rows else 0
        except Exception:
            pass

    return {
        "is_mock": status_info["is_mock"],
        "adapter_name": status_info["adapter_name"],
        "host": status_info["host"],
        "port": status_info["port"],
        "schema_name": status_info["schema"],
        "error_message": status_info.get("error_message"),
        "health": status_info.get("health", {}),
        "active_participants_count": participants_count,
        "total_sessions_count": sessions_count,
        "total_task_results_count": tasks_count
    }

@router.get("/audit-logs")
def get_audit_logs(current_user: dict = Depends(require_role(["admin", "researcher"]))):
    """Retrieves immutable audit logs for compliance review."""
    db = get_db()
    logs = db.fetch_all("SELECT * FROM MINDBRIDGE.AUDIT_LOGS ORDER BY timestamp DESC")
    return logs
