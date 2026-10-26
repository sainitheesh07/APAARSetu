from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.institution import Institution
from app.schemas.auth import UserCreate, UserResponse
from app.api.v1.deps import require_role
from app.core.security import get_password_hash
from app.services.audit_service import AuditService

router = APIRouter(prefix="/users", tags=["User Management"])

@router.get("", response_model=List[UserResponse])
def get_users(
    role: Optional[UserRole] = None,
    institution_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.AICTE_ADMIN]))
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if institution_id:
        query = query.filter(User.institution_id == institution_id)

    users = query.order_by(User.created_at.desc()).all()
    results = []
    for u in users:
        results.append(UserResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            institution_id=u.institution_id,
            is_active=u.is_active,
            last_login=u.last_login,
            created_at=u.created_at,
            institution_name=u.institution.name if u.institution else None
        ))
    return results

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    req: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.AICTE_ADMIN]))
):
    existing = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    if req.role == UserRole.INSTITUTION_ADMIN and not req.institution_id:
        raise HTTPException(status_code=400, detail="institution_id is required for Institution Administrator accounts.")

    user = User(
        email=req.email.strip().lower(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name.strip(),
        role=req.role,
        institution_id=req.institution_id,
        is_active=req.is_active
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    AuditService.log(
        db=db,
        action="USER_CREATED",
        entity_type="USER",
        actor_role=admin.role.value,
        actor_id=admin.id,
        actor_name=admin.full_name,
        institution_id=user.institution_id,
        entity_id=str(user.id),
        outcome="SUCCESS",
        metadata={"email": user.email, "role": user.role.value}
    )

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

@router.patch("/{id}/toggle-active", response_model=UserResponse)
def toggle_user_active(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.AICTE_ADMIN]))
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own administrator account.")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)

    AuditService.log(
        db=db,
        action="USER_STATUS_TOGGLED",
        entity_type="USER",
        actor_role=admin.role.value,
        actor_id=admin.id,
        actor_name=admin.full_name,
        institution_id=user.institution_id,
        entity_id=str(user.id),
        outcome="SUCCESS",
        metadata={"is_active": user.is_active}
    )

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
