from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.programme import Programme
from app.models.institution import Institution
from app.models.student import Student, SeatCategory
from app.models.user import User, UserRole
from app.schemas.programme import ProgrammeCreate, ProgrammeUpdate, ProgrammeResponse, IntakeSummary
from app.api.v1.deps import require_current_user, require_role, verify_institution_access
from app.services.audit_service import AuditService

router = APIRouter(prefix="/programmes", tags=["Programmes"])

@router.get("", response_model=List[ProgrammeResponse])
def get_programmes(
    institution_id: Optional[int] = None,
    academic_year: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    query = db.query(Programme)

    if user.role == UserRole.INSTITUTION_ADMIN:
        query = query.filter(Programme.institution_id == user.institution_id)
    elif institution_id:
        query = query.filter(Programme.institution_id == institution_id)

    if academic_year:
        query = query.filter(Programme.academic_year == academic_year)

    programmes = query.all()
    results = []

    for p in programmes:
        reg_count = db.query(Student).filter(
            Student.programme_id == p.id,
            Student.seat_category == SeatCategory.REGULAR
        ).count()

        sup_count = db.query(Student).filter(
            Student.programme_id == p.id,
            Student.seat_category != SeatCategory.REGULAR
        ).count()

        remaining = max(0, p.approved_intake - reg_count)
        util_pct = (reg_count / p.approved_intake * 100.0) if p.approved_intake > 0 else 0.0

        resp = ProgrammeResponse(
            id=p.id,
            institution_id=p.institution_id,
            institution_name=p.institution.name if p.institution else "N/A",
            name=p.name,
            code=p.code,
            qualification_level=p.qualification_level,
            approved_intake=p.approved_intake,
            academic_year=p.academic_year,
            is_active=p.is_active,
            created_at=p.created_at,
            updated_at=p.updated_at,
            enrolled_count=reg_count,
            supernumerary_count=sup_count,
            remaining_intake=remaining,
            intake_utilization_pct=round(util_pct, 1)
        )
        results.append(resp)

    return results

@router.post("", response_model=ProgrammeResponse, status_code=status.HTTP_201_CREATED)
def create_programme(
    req: ProgrammeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    verify_institution_access(req.institution_id, user)
    # Only AICTE Admin can approve new intake quota
    if user.role == UserRole.INSTITUTION_ADMIN:
        # Check if institution is approved
        inst = db.query(Institution).filter(Institution.id == req.institution_id).first()
        if not inst:
            raise HTTPException(status_code=404, detail="Institution not found.")

    prog = Programme(
        institution_id=req.institution_id,
        name=req.name.strip(),
        code=req.code.strip().upper(),
        qualification_level=req.qualification_level,
        approved_intake=req.approved_intake,
        academic_year=req.academic_year,
        is_active=req.is_active
    )
    db.add(prog)
    db.commit()
    db.refresh(prog)

    AuditService.log(
        db=db,
        action="PROGRAMME_CREATED",
        entity_type="PROGRAMME",
        actor_role=user.role.value,
        actor_id=user.id,
        actor_name=user.full_name,
        institution_id=prog.institution_id,
        entity_id=str(prog.id),
        outcome="SUCCESS",
        metadata={"code": prog.code, "name": prog.name, "approved_intake": prog.approved_intake}
    )

    return ProgrammeResponse(
        id=prog.id,
        institution_id=prog.institution_id,
        institution_name=prog.institution.name if prog.institution else "N/A",
        name=prog.name,
        code=prog.code,
        qualification_level=prog.qualification_level,
        approved_intake=prog.approved_intake,
        academic_year=prog.academic_year,
        is_active=prog.is_active,
        created_at=prog.created_at,
        updated_at=prog.updated_at,
        enrolled_count=0,
        supernumerary_count=0,
        remaining_intake=prog.approved_intake,
        intake_utilization_pct=0.0
    )

@router.patch("/{id}", response_model=ProgrammeResponse)
def update_programme(
    id: int,
    req: ProgrammeUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    prog = db.query(Programme).filter(Programme.id == id).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Programme not found.")

    verify_institution_access(prog.institution_id, user)

    # STRICT RULE: An institution administrator must NEVER be able to change their own official intake limit!
    if req.approved_intake is not None and user.role != UserRole.AICTE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AICTE Regulatory Restriction: Approved intake capacity can only be modified by an authorized AICTE Administrator."
        )

    update_data = req.dict(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(prog, field, val)

    db.commit()
    db.refresh(prog)

    AuditService.log(
        db=db,
        action="PROGRAMME_UPDATED",
        entity_type="PROGRAMME",
        actor_role=user.role.value,
        actor_id=user.id,
        actor_name=user.full_name,
        institution_id=prog.institution_id,
        entity_id=str(prog.id),
        outcome="SUCCESS",
        metadata={"updated_fields": list(update_data.keys())}
    )

    reg_count = db.query(Student).filter(
        Student.programme_id == prog.id,
        Student.seat_category == SeatCategory.REGULAR
    ).count()

    sup_count = db.query(Student).filter(
        Student.programme_id == prog.id,
        Student.seat_category != SeatCategory.REGULAR
    ).count()

    remaining = max(0, prog.approved_intake - reg_count)
    util_pct = (reg_count / prog.approved_intake * 100.0) if prog.approved_intake > 0 else 0.0

    return ProgrammeResponse(
        id=prog.id,
        institution_id=prog.institution_id,
        institution_name=prog.institution.name if prog.institution else "N/A",
        name=prog.name,
        code=prog.code,
        qualification_level=prog.qualification_level,
        approved_intake=prog.approved_intake,
        academic_year=prog.academic_year,
        is_active=prog.is_active,
        created_at=prog.created_at,
        updated_at=prog.updated_at,
        enrolled_count=reg_count,
        supernumerary_count=sup_count,
        remaining_intake=remaining,
        intake_utilization_pct=round(util_pct, 1)
    )

@router.get("/intake/summary", response_model=List[IntakeSummary])
def get_intake_summary(
    institution_id: Optional[int] = None,
    academic_year: Optional[str] = "2026-2027",
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    query = db.query(Programme).filter(Programme.academic_year == academic_year)
    if user.role == UserRole.INSTITUTION_ADMIN:
        query = query.filter(Programme.institution_id == user.institution_id)
    elif institution_id:
        query = query.filter(Programme.institution_id == institution_id)

    programmes = query.all()
    summaries = []

    for p in programmes:
        reg_count = db.query(Student).filter(
            Student.programme_id == p.id,
            Student.seat_category == SeatCategory.REGULAR
        ).count()

        sup_count = db.query(Student).filter(
            Student.programme_id == p.id,
            Student.seat_category != SeatCategory.REGULAR
        ).count()

        total = reg_count + sup_count
        excess = max(0, reg_count - p.approved_intake)
        remaining = max(0, p.approved_intake - reg_count)
        util_pct = (reg_count / p.approved_intake * 100.0) if p.approved_intake > 0 else 0.0

        summaries.append(IntakeSummary(
            programme_id=p.id,
            programme_name=p.name,
            programme_code=p.code,
            approved_intake=p.approved_intake,
            regular_enrolled=reg_count,
            supernumerary_enrolled=sup_count,
            total_enrolled=total,
            remaining_seats=remaining,
            excess_enrolment=excess,
            utilization_pct=round(util_pct, 1),
            is_overrun=reg_count > p.approved_intake
        ))

    return summaries
