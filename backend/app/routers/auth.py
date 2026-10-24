import datetime
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.audit import log_audit_event
from app.core.security import create_access_token, get_current_user, get_password_hash, verify_password
from app.database.connection import get_db
from app.models.schemas import Token, UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 password login returning signed JWT."""
    db = get_db()
    user = None

    if hasattr(db, "fetch_one"):
        user = db.fetch_one("SELECT * FROM MINDBRIDGE.USERS WHERE email = :email", {"email": form_data.username})
    else:
        rows = db.fetch_all(f"SELECT * FROM MINDBRIDGE.USERS WHERE email = '{form_data.username}'")
        user = rows[0] if rows else None

    if not user or not verify_password(form_data.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token({
        "sub": user["email"],
        "user_id": user["user_id"],
        "role": user["role"],
        "participant_id": user.get("participant_id")
    })

    log_audit_event(
        action="USER_LOGIN",
        resource_type="USER",
        resource_id=user["user_id"],
        user_id=user["user_id"],
        details={"role": user["role"]}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
        "user_id": user["user_id"],
        "email": user["email"],
        "full_name": user.get("full_name"),
        "participant_id": user.get("participant_id")
    }

@router.post("/login-json", response_model=Token)
def login_json(payload: UserLogin):
    """JSON login for web clients."""
    db = get_db()
    user = None
    if hasattr(db, "fetch_one"):
        user = db.fetch_one("SELECT * FROM MINDBRIDGE.USERS WHERE email = :email", {"email": payload.email})

    if not user or not verify_password(payload.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token({
        "sub": user["email"],
        "user_id": user["user_id"],
        "role": user["role"],
        "participant_id": user.get("participant_id")
    })

    log_audit_event(
        action="USER_LOGIN_JSON",
        resource_type="USER",
        resource_id=user["user_id"],
        user_id=user["user_id"]
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
        "user_id": user["user_id"],
        "email": user["email"],
        "full_name": user.get("full_name"),
        "participant_id": user.get("participant_id")
    }

@router.post("/register", response_model=UserResponse)
def register(payload: UserCreate):
    """Registers a new user account."""
    db = get_db()
    existing = db.fetch_one("SELECT * FROM MINDBRIDGE.USERS WHERE email = :email", {"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    new_id = f"u-{uuid.uuid4().hex[:8]}"
    now = datetime.datetime.utcnow().isoformat()
    record = {
        "user_id": new_id,
        "email": payload.email,
        "hashed_password": get_password_hash(payload.password),
        "role": payload.role,
        "full_name": payload.full_name or payload.email.split("@")[0].title(),
        "participant_id": None,
        "is_active": True,
        "created_at": now
    }

    if hasattr(db, "insert"):
        db.insert("USERS", record)
    else:
        query = """
        INSERT INTO MINDBRIDGE.USERS (user_id, email, hashed_password, role, full_name, participant_id, is_active, created_at)
        VALUES (:user_id, :email, :hashed_password, :role, :full_name, :participant_id, :is_active, CURRENT_TIMESTAMP)
        """
        db.execute(query, record)

    log_audit_event(
        action="USER_REGISTRATION",
        resource_type="USER",
        resource_id=new_id,
        user_id=new_id,
        details={"role": payload.role}
    )

    return record

@router.get("/me")
def get_current_user_profile(user: dict = Depends(get_current_user)):
    """Returns profile for currently authenticated user."""
    db = get_db()
    user_row = db.fetch_one("SELECT * FROM MINDBRIDGE.USERS WHERE user_id = :id", {"id": user.get("user_id")})
    if not user_row:
        return user
    return {
        "user_id": user_row.get("user_id"),
        "email": user_row.get("email"),
        "role": user_row.get("role"),
        "full_name": user_row.get("full_name"),
        "participant_id": user_row.get("participant_id"),
        "is_active": user_row.get("is_active")
    }

@router.post("/demo-switch/{role}", response_model=Token)
def demo_switch(role: str):
    """
    Demo fast switcher for evaluation:
    Instantly returns credentials for pre-seeded Clinician, Researcher, Participant, or Admin.
    """
    db = get_db()
    role_lower = role.lower()
    user = db.fetch_one("SELECT * FROM MINDBRIDGE.USERS WHERE role = :role", {"role": role_lower})
    if not user:
        raise HTTPException(status_code=404, detail=f"No seeded account found for role '{role_lower}'.")

    access_token = create_access_token({
        "sub": user["email"],
        "user_id": user["user_id"],
        "role": user["role"],
        "participant_id": user.get("participant_id")
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
        "user_id": user["user_id"],
        "email": user["email"],
        "full_name": user.get("full_name"),
        "participant_id": user.get("participant_id")
    }
