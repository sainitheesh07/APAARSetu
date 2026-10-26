from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, Token, UserResponse
from app.api.v1.deps import require_current_user
from app.services.audit_service import AuditService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    # Support both new apaarsetu domain and legacy eduverify domain for AICTE admin
    if email_clean in ("aicte.admin@eduverify.gov.in", "aicte.admin@apaarsetu.gov.in"):
        user = db.query(User).filter(User.role == "aicte_admin").first()
    else:
        user = db.query(User).filter(User.email == email_clean).first()
    client_ip = request.client.host if request.client else "unknown"

    if not user or not verify_password(req.password, user.hashed_password):
        # Audit failed login attempt
        AuditService.log(
            db=db,
            action="LOGIN_FAILED",
            entity_type="USER",
            actor_role="UNKNOWN",
            entity_id=req.email,
            outcome="FAILURE",
            metadata={"attempted_email": req.email},
            ip_address=client_ip
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated.")

    user.last_login = datetime.utcnow()
    db.commit()

    # Create access token
    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        institution_id=user.institution_id
    )

    # Audit successful login
    AuditService.log(
        db=db,
        action="LOGIN_SUCCESS",
        entity_type="USER",
        actor_role=user.role.value,
        actor_id=user.id,
        actor_name=user.full_name,
        institution_id=user.institution_id,
        entity_id=str(user.id),
        outcome="SUCCESS",
        ip_address=client_ip
    )

    inst_name = user.institution.name if user.institution else None

    user_resp = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        institution_id=user.institution_id,
        is_active=user.is_active,
        last_login=user.last_login,
        created_at=user.created_at,
        institution_name=inst_name
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role.value,
        user=user_resp
    )

@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(require_current_user)):
    inst_name = user.institution.name if user.institution else None
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        institution_id=user.institution_id,
        is_active=user.is_active,
        last_login=user.last_login,
        created_at=user.created_at,
        institution_name=inst_name
    )

@router.post("/refresh", response_model=Token)
def refresh_token(user: User = Depends(require_current_user)):
    new_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        institution_id=user.institution_id
    )
    inst_name = user.institution.name if user.institution else None
    user_resp = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        institution_id=user.institution_id,
        is_active=user.is_active,
        last_login=user.last_login,
        created_at=user.created_at,
        institution_name=inst_name
    )
    return Token(
        access_token=new_token,
        token_type="bearer",
        role=user.role.value,
        user=user_resp
    )

@router.post("/logout")
def logout(user: User = Depends(require_current_user), db: Session = Depends(get_db)):
    AuditService.log(
        db=db,
        action="LOGOUT",
        entity_type="USER",
        actor_role=user.role.value,
        actor_id=user.id,
        actor_name=user.full_name,
        institution_id=user.institution_id,
        entity_id=str(user.id),
        outcome="SUCCESS"
    )
    return {"message": "Successfully logged out."}
