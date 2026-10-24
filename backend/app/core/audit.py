import datetime
import json
import logging
import uuid
from typing import Any, Dict, Optional
from app.database.connection import get_db

logger = logging.getLogger("mindbridge.audit")

def log_audit_event(
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    user_id: Optional[str] = None,
    ip_address: Optional[str] = "127.0.0.1",
    details: Optional[Dict[str, Any]] = None
):
    """
    Records an immutable audit event in the Exasol AUDIT_LOGS table.
    Ensures HIPAA/GDPR compliance for participant data access and clinical exports.
    """
    db = get_db()
    log_id = f"aud-{uuid.uuid4().hex[:12]}"
    now = datetime.datetime.utcnow().isoformat()
    details_str = json.dumps(details or {})

    record = {
        "log_id": log_id,
        "user_id": user_id or "anonymous",
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id or "",
        "ip_address": ip_address or "127.0.0.1",
        "timestamp": now,
        "details_json": details_str
    }

    try:
        if hasattr(db, "insert"):
            # Mock adapter
            db.insert("AUDIT_LOGS", record)
        else:
            # Real Exasol parameterized insert
            query = """
            INSERT INTO MINDBRIDGE.AUDIT_LOGS 
            (log_id, user_id, action, resource_type, resource_id, ip_address, timestamp, details_json)
            VALUES (:log_id, :user_id, :action, :resource_type, :resource_id, :ip_address, CURRENT_TIMESTAMP, :details_json)
            """
            db.execute(query, {
                "log_id": log_id,
                "user_id": user_id or "anonymous",
                "action": action,
                "resource_type": resource_type,
                "resource_id": resource_id or "",
                "ip_address": ip_address or "127.0.0.1",
                "details_json": details_str
            })
        logger.info(f"[AUDIT] {action} on {resource_type}:{resource_id} by {user_id}")
    except Exception as e:
        logger.error(f"Failed to record audit event: {e}")
