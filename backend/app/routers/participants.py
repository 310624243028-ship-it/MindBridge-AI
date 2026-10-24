import datetime
import hashlib
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.audit import log_audit_event
from app.core.security import get_current_user, require_role
from app.database.connection import get_db
from app.models.schemas import ParticipantCreate, ParticipantResponse

router = APIRouter(prefix="/participants", tags=["Participants"])

@router.post("/", response_model=ParticipantResponse)
def register_participant(payload: ParticipantCreate, current_user: dict = Depends(get_current_user)):
    """
    Onboards a participant with cryptographic informed-consent recording.
    Generates a decoupled pseudonymous identifier (e.g. MB-P-XXXX).
    """
    db = get_db()
    p_id = f"p-{uuid.uuid4().hex[:8]}"
    pseudonym_code = f"MB-P-{uuid.uuid4().int % 9000 + 1000}"
    now = datetime.datetime.utcnow().isoformat()

    # Generate cryptographic hash of the signature & consent text
    consent_sig_raw = f"{payload.consent.signature_name}:{payload.consent.consent_version}:{now}"
    consent_hash = hashlib.sha256(consent_sig_raw.encode("utf-8")).hexdigest()

    record = {
        "participant_id": p_id,
        "pseudonym_code": pseudonym_code,
        "age_group": payload.age_group,
        "education_years": payload.education_years,
        "baseline_notes": payload.baseline_notes or "Informed consent verified.",
        "consent_version": payload.consent.consent_version,
        "consent_timestamp": now,
        "consent_signature_hash": consent_hash,
        "created_at": now
    }

    if hasattr(db, "insert"):
        db.insert("PARTICIPANTS", record)
        # Link current user if role is participant
        if current_user.get("role") == "participant":
            for u in db.tables["USERS"]:
                if u["user_id"] == current_user.get("user_id"):
                    u["participant_id"] = p_id
    else:
        query = """
        INSERT INTO MINDBRIDGE.PARTICIPANTS 
        (participant_id, pseudonym_code, age_group, education_years, baseline_notes, consent_version, consent_timestamp, consent_signature_hash, created_at)
        VALUES (:participant_id, :pseudonym_code, :age_group, :education_years, :baseline_notes, :consent_version, CURRENT_TIMESTAMP, :consent_signature_hash, CURRENT_TIMESTAMP)
        """
        db.execute(query, record)
        if current_user.get("role") == "participant":
            db.execute("UPDATE MINDBRIDGE.USERS SET participant_id = :p_id WHERE user_id = :u_id", {
                "p_id": p_id,
                "u_id": current_user.get("user_id")
            })

    log_audit_event(
        action="PARTICIPANT_REGISTERED",
        resource_type="PARTICIPANT",
        resource_id=p_id,
        user_id=current_user.get("user_id"),
        details={"pseudonym_code": pseudonym_code, "consent_version": payload.consent.consent_version}
    )

    return record

@router.get("/", response_model=List[ParticipantResponse])
def list_participants(current_user: dict = Depends(require_role(["clinician", "researcher", "admin"]))):
    """Lists pseudonymous participants for authorized clinical and research personnel."""
    db = get_db()
    rows = db.fetch_all("SELECT * FROM MINDBRIDGE.PARTICIPANTS ORDER BY created_at DESC")
    log_audit_event(
        action="LIST_PARTICIPANTS",
        resource_type="PARTICIPANT_ROSTER",
        user_id=current_user.get("user_id")
    )
    return rows

@router.get("/{participant_id}", response_model=ParticipantResponse)
def get_participant(participant_id: str, current_user: dict = Depends(get_current_user)):
    """Fetches details for a specific pseudonymous participant profile."""
    # Participant role can only fetch their own profile
    if current_user.get("role") == "participant" and current_user.get("participant_id") != participant_id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only access your own participant profile.")

    db = get_db()
    participant = db.fetch_one("SELECT * FROM MINDBRIDGE.PARTICIPANTS WHERE participant_id = :id", {"id": participant_id})
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found.")

    log_audit_event(
        action="VIEW_PARTICIPANT",
        resource_type="PARTICIPANT",
        resource_id=participant_id,
        user_id=current_user.get("user_id")
    )
    return participant
