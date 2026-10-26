from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.institution import Institution, AICTEApprovalStatus, InstitutionType
from app.models.programme import Programme
from app.models.student import Student
from app.models.user import User, UserRole
from app.schemas.institution import InstitutionCreate, InstitutionUpdate, InstitutionResponse
from app.api.v1.deps import require_current_user, require_role, verify_institution_access
from app.services.audit_service import AuditService

router = APIRouter(prefix="/institutions", tags=["Institutions"])

@router.get("", response_model=List[InstitutionResponse])
def get_institutions(
    state: Optional[str] = None,
    status_filter: Optional[AICTEApprovalStatus] = Query(None, alias="status"),
    institution_type: Optional[InstitutionType] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    query = db.query(Institution)

    # If institution admin, only return their institution
    if user.role == UserRole.INSTITUTION_ADMIN:
        query = query.filter(Institution.id == user.institution_id)
    else:
        if state:
            query = query.filter(Institution.state.ilike(f"%{state}%"))
        if status_filter:
            query = query.filter(Institution.aicte_approval_status == status_filter)
        if institution_type:
            query = query.filter(Institution.institution_type == institution_type)
        if search:
            query = query.filter(
                (Institution.name.ilike(f"%{search}%")) |
                (Institution.code.ilike(f"%{search}%")) |
                (Institution.district.ilike(f"%{search}%"))
            )

    institutions = query.all()
    results = []

    for inst in institutions:
        prog_count = db.query(Programme).filter(Programme.institution_id == inst.id).count()
        intake_sum = db.query(func.coalesce(func.sum(Programme.approved_intake), 0)).filter(Programme.institution_id == inst.id).scalar() or 0
        enrolled_count = db.query(Student).filter(Student.institution_id == inst.id).count()

        resp = InstitutionResponse(
            id=inst.id,
            code=inst.code,
            name=inst.name,
            institution_type=inst.institution_type,
            aicte_approval_status=inst.aicte_approval_status,
            approval_ref=inst.approval_ref,
            state=inst.state,
            district=inst.district,
            address=inst.address,
            contact_email=inst.contact_email,
            contact_phone=inst.contact_phone,
            academic_year=inst.academic_year,
            registration_status=inst.registration_status,
            created_at=inst.created_at,
            updated_at=inst.updated_at,
            total_programmes=prog_count,
            total_approved_intake=intake_sum,
            total_enrolled=enrolled_count
        )
        results.append(resp)

    return results

@router.post("", response_model=InstitutionResponse, status_code=status.HTTP_201_CREATED)
def create_institution(
    req: InstitutionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role([UserRole.AICTE_ADMIN]))
):
    existing = db.query(Institution).filter(Institution.code == req.code.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Institution with Permanent ID '{req.code}' already exists.")

    inst = Institution(
        code=req.code.strip().upper(),
        name=req.name.strip(),
        institution_type=req.institution_type,
        aicte_approval_status=req.aicte_approval_status,
        approval_ref=req.approval_ref,
        state=req.state.strip(),
        district=req.district.strip(),
        address=req.address,
        contact_email=req.contact_email.strip().lower(),
        contact_phone=req.contact_phone,
        academic_year=req.academic_year
    )
    db.add(inst)
    db.commit()
    db.refresh(inst)

    AuditService.log(
        db=db,
        action="INSTITUTION_REGISTERED",
        entity_type="INSTITUTION",
        actor_role=user.role.value,
        actor_id=user.id,
        actor_name=user.full_name,
        institution_id=inst.id,
        entity_id=str(inst.id),
        outcome="SUCCESS",
        metadata={"code": inst.code, "name": inst.name}
    )

    return InstitutionResponse(
        id=inst.id,
        code=inst.code,
        name=inst.name,
        institution_type=inst.institution_type,
        aicte_approval_status=inst.aicte_approval_status,
        approval_ref=inst.approval_ref,
        state=inst.state,
        district=inst.district,
        address=inst.address,
        contact_email=inst.contact_email,
        contact_phone=inst.contact_phone,
        academic_year=inst.academic_year,
        registration_status=inst.registration_status,
        created_at=inst.created_at,
        updated_at=inst.updated_at,
        total_programmes=0,
        total_approved_intake=0,
        total_enrolled=0
    )

@router.get("/{id}", response_model=InstitutionResponse)
def get_institution(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    verify_institution_access(id, user)
    inst = db.query(Institution).filter(Institution.id == id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found.")

    prog_count = db.query(Programme).filter(Programme.institution_id == inst.id).count()
    intake_sum = db.query(func.coalesce(func.sum(Programme.approved_intake), 0)).filter(Programme.institution_id == inst.id).scalar() or 0
    enrolled_count = db.query(Student).filter(Student.institution_id == inst.id).count()

    return InstitutionResponse(
        id=inst.id,
        code=inst.code,
        name=inst.name,
        institution_type=inst.institution_type,
        aicte_approval_status=inst.aicte_approval_status,
        approval_ref=inst.approval_ref,
        state=inst.state,
        district=inst.district,
        address=inst.address,
        contact_email=inst.contact_email,
        contact_phone=inst.contact_phone,
        academic_year=inst.academic_year,
        registration_status=inst.registration_status,
        created_at=inst.created_at,
        updated_at=inst.updated_at,
        total_programmes=prog_count,
        total_approved_intake=intake_sum,
        total_enrolled=enrolled_count
    )

@router.patch("/{id}", response_model=InstitutionResponse)
def update_institution(
    id: int,
    req: InstitutionUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    verify_institution_access(id, user)
    inst = db.query(Institution).filter(Institution.id == id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found.")

    # Only AICTE Admin can change approval status or approval ref
    if req.aicte_approval_status and user.role != UserRole.AICTE_ADMIN:
        raise HTTPException(status_code=403, detail="Only AICTE Administrators can update AICTE approval status.")
    if req.approval_ref and user.role != UserRole.AICTE_ADMIN:
        raise HTTPException(status_code=403, detail="Only AICTE Administrators can modify AICTE approval reference numbers.")

    update_data = req.dict(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(inst, field, val)

    db.commit()
    db.refresh(inst)

    AuditService.log(
        db=db,
        action="INSTITUTION_UPDATED",
        entity_type="INSTITUTION",
        actor_role=user.role.value,
        actor_id=user.id,
        actor_name=user.full_name,
        institution_id=inst.id,
        entity_id=str(inst.id),
        outcome="SUCCESS",
        metadata={"updated_fields": list(update_data.keys())}
    )

    prog_count = db.query(Programme).filter(Programme.institution_id == inst.id).count()
    intake_sum = db.query(func.coalesce(func.sum(Programme.approved_intake), 0)).filter(Programme.institution_id == inst.id).scalar() or 0
    enrolled_count = db.query(Student).filter(Student.institution_id == inst.id).count()

    return InstitutionResponse(
        id=inst.id,
        code=inst.code,
        name=inst.name,
        institution_type=inst.institution_type,
        aicte_approval_status=inst.aicte_approval_status,
        approval_ref=inst.approval_ref,
        state=inst.state,
        district=inst.district,
        address=inst.address,
        contact_email=inst.contact_email,
        contact_phone=inst.contact_phone,
        academic_year=inst.academic_year,
        registration_status=inst.registration_status,
        created_at=inst.created_at,
        updated_at=inst.updated_at,
        total_programmes=prog_count,
        total_approved_intake=intake_sum,
        total_enrolled=enrolled_count
    )
