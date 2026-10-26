from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.student import Student, Enrolment, SeatCategory, AdmissionStatus, RecordStatus
from app.models.programme import Programme
from app.models.institution import Institution
from app.models.user import User, UserRole
from app.models.verification import StudentCorrectionRequest
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, EnrolmentResponse
from app.schemas.verification import StudentCorrectionCreate, StudentCorrectionResponse
from app.api.v1.deps import require_current_user, verify_institution_access
from app.core.security import hash_apaar_id, mask_apaar_id
from app.services.validation_engine import ValidationEngine
from app.services.audit_service import AuditService

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("", response_model=List[StudentResponse])
def get_students(
    institution_id: Optional[int] = None,
    programme_id: Optional[int] = None,
    academic_year: Optional[str] = None,
    seat_category: Optional[SeatCategory] = None,
    record_status: Optional[RecordStatus] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    query = db.query(Student)

    # Tenant Isolation: Institution admin cannot view other institutions
    if user.role == UserRole.INSTITUTION_ADMIN:
        query = query.filter(Student.institution_id == user.institution_id)
    elif user.role == UserRole.STUDENT:
        # A student can only view their own record
        query = query.filter(Student.id == str(user.id))
    elif institution_id:
        query = query.filter(Student.institution_id == institution_id)

    if programme_id:
        query = query.filter(Student.programme_id == programme_id)
    if academic_year:
        query = query.filter(Student.academic_year == academic_year)
    if seat_category:
        query = query.filter(Student.seat_category == seat_category)
    if record_status:
        query = query.filter(Student.record_status == record_status)

    if search:
        s = search.strip()
        query = query.filter(
            (Student.student_name.ilike(f"%{s}%")) |
            (Student.admission_id.ilike(f"%{s}%")) |
            (Student.apaar_id_masked.ilike(f"%{s}%"))
        )

    students = query.order_by(Student.created_at.desc()).offset(skip).limit(limit).all()

    results = []
    for st in students:
        resp = StudentResponse(
            id=st.id,
            apaar_id_masked=st.apaar_id_masked,
            student_name=st.student_name,
            dob=st.dob,
            gender=st.gender,
            institution_id=st.institution_id,
            institution_name=st.institution.name if st.institution else "N/A",
            programme_id=st.programme_id,
            programme_name=st.programme.name if st.programme else "N/A",
            programme_code=st.programme.code if st.programme else "N/A",
            academic_year=st.academic_year,
            admission_id=st.admission_id,
            admission_date=st.admission_date,
            admission_status=st.admission_status,
            seat_category=st.seat_category,
            record_status=st.record_status,
            source_of_submission=st.source_of_submission,
            created_at=st.created_at,
            updated_at=st.updated_at,
            enrolments=[
                EnrolmentResponse(
                    id=e.id,
                    institution_id=e.institution_id,
                    institution_name=e.institution.name if e.institution else "N/A",
                    programme_id=e.programme_id,
                    programme_name=e.programme.name if e.programme else "N/A",
                    academic_year=e.academic_year,
                    admission_status=e.admission_status,
                    seat_category=e.seat_category,
                    created_at=e.created_at
                )
                for e in st.enrolments
            ]
        )
        results.append(resp)

    return results

@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    req: StudentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    verify_institution_access(req.institution_id, user)

    # 1. Validate APAAR ID
    is_valid_apaar, apaar_err = ValidationEngine.validate_apaar_format(req.apaar_id)
    if not is_valid_apaar:
        raise HTTPException(status_code=400, detail=apaar_err)

    apaar_hash = hash_apaar_id(req.apaar_id)
    masked_apaar = mask_apaar_id(req.apaar_id)

    # 2. Check for duplicate within institution & academic year
    existing = db.query(Student).filter(
        Student.apaar_hash == apaar_hash,
        Student.institution_id == req.institution_id,
        Student.academic_year == req.academic_year
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Student with APAAR ID {masked_apaar} is already enrolled in this institution (Admission ID: {existing.admission_id}).")

    # 3. Check for cross-institution dual enrolment conflict
    cross_inst = db.query(Student).join(Institution).filter(
        Student.apaar_hash == apaar_hash,
        Student.institution_id != req.institution_id,
        Student.academic_year == req.academic_year
    ).first()
    if cross_inst:
        raise HTTPException(
            status_code=400,
            detail=f"CROSS-INSTITUTION CONFLICT: APAAR ID {masked_apaar} is concurrently enrolled at '{cross_inst.institution.name}' (Code: {cross_inst.institution.code}) for academic year {req.academic_year}. Dual enrolment is prohibited without formal transfer authorization."
        )

    # 4. Check programme validity & intake
    prog = db.query(Programme).filter(
        Programme.id == req.programme_id,
        Programme.institution_id == req.institution_id
    ).first()
    if not prog or not prog.is_active:
        raise HTTPException(status_code=400, detail="Selected programme is invalid or not active for this institution.")

    # Intake check if regular
    if req.seat_category == SeatCategory.REGULAR:
        current_reg = db.query(Student).filter(
            Student.programme_id == prog.id,
            Student.academic_year == req.academic_year,
            Student.seat_category == SeatCategory.REGULAR
        ).count()
        if current_reg >= prog.approved_intake:
            raise HTTPException(
                status_code=400,
                detail=f"AICTE Approved Intake Ceiling Exceeded: Programme '{prog.name}' has reached its approved limit of {prog.approved_intake} regular students."
            )

    student = Student(
        apaar_id_masked=masked_apaar,
        apaar_hash=apaar_hash,
        student_name=req.student_name.strip(),
        dob=req.dob,
        gender=req.gender,
        institution_id=req.institution_id,
        programme_id=req.programme_id,
        academic_year=req.academic_year,
        admission_id=req.admission_id.strip(),
        admission_date=req.admission_date,
        admission_status=req.admission_status,
        seat_category=req.seat_category,
        record_status=RecordStatus.VERIFIED,
        source_of_submission="MANUAL"
    )
    db.add(student)
    db.flush()

    enrolment = Enrolment(
        student_id=student.id,
        institution_id=student.institution_id,
        programme_id=student.programme_id,
        academic_year=student.academic_year,
        admission_status=student.admission_status,
        seat_category=student.seat_category
    )
    db.add(enrolment)
    db.commit()
    db.refresh(student)

    AuditService.log(
        db=db,
        action="STUDENT_CREATED",
        entity_type="STUDENT",
        actor_role=user.role.value,
        actor_id=user.id,
        actor_name=user.full_name,
        institution_id=student.institution_id,
        entity_id=student.id,
        outcome="SUCCESS",
        metadata={"admission_id": student.admission_id, "masked_apaar": masked_apaar}
    )

    return StudentResponse(
        id=student.id,
        apaar_id_masked=student.apaar_id_masked,
        student_name=student.student_name,
        dob=student.dob,
        gender=student.gender,
        institution_id=student.institution_id,
        institution_name=student.institution.name if student.institution else "N/A",
        programme_id=student.programme_id,
        programme_name=student.programme.name if student.programme else "N/A",
        programme_code=student.programme.code if student.programme else "N/A",
        academic_year=student.academic_year,
        admission_id=student.admission_id,
        admission_date=student.admission_date,
        admission_status=student.admission_status,
        seat_category=student.seat_category,
        record_status=student.record_status,
        source_of_submission=student.source_of_submission,
        created_at=student.created_at,
        updated_at=student.updated_at,
        enrolments=[]
    )

@router.get("/{id}", response_model=StudentResponse)
def get_student(
    id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found.")

    verify_institution_access(student.institution_id, user)

    return StudentResponse(
        id=student.id,
        apaar_id_masked=student.apaar_id_masked,
        student_name=student.student_name,
        dob=student.dob,
        gender=student.gender,
        institution_id=student.institution_id,
        institution_name=student.institution.name if student.institution else "N/A",
        programme_id=student.programme_id,
        programme_name=student.programme.name if student.programme else "N/A",
        programme_code=student.programme.code if student.programme else "N/A",
        academic_year=student.academic_year,
        admission_id=student.admission_id,
        admission_date=student.admission_date,
        admission_status=student.admission_status,
        seat_category=student.seat_category,
        record_status=student.record_status,
        source_of_submission=student.source_of_submission,
        created_at=student.created_at,
        updated_at=student.updated_at,
        enrolments=[
            EnrolmentResponse(
                id=e.id,
                institution_id=e.institution_id,
                institution_name=e.institution.name if e.institution else "N/A",
                programme_id=e.programme_id,
                programme_name=e.programme.name if e.programme else "N/A",
                academic_year=e.academic_year,
                admission_status=e.admission_status,
                seat_category=e.seat_category,
                created_at=e.created_at
            )
            for e in student.enrolments
        ]
    )

@router.patch("/{id}", response_model=StudentResponse)
def update_student(
    id: str,
    req: StudentUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found.")

    verify_institution_access(student.institution_id, user)

    update_data = req.dict(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(student, field, val)

    db.commit()
    db.refresh(student)

    AuditService.log(
        db=db,
        action="STUDENT_UPDATED",
        entity_type="STUDENT",
        actor_role=user.role.value,
        actor_id=user.id,
        actor_name=user.full_name,
        institution_id=student.institution_id,
        entity_id=student.id,
        outcome="SUCCESS",
        metadata={"updated_fields": list(update_data.keys())}
    )

    return StudentResponse(
        id=student.id,
        apaar_id_masked=student.apaar_id_masked,
        student_name=student.student_name,
        dob=student.dob,
        gender=student.gender,
        institution_id=student.institution_id,
        institution_name=student.institution.name if student.institution else "N/A",
        programme_id=student.programme_id,
        programme_name=student.programme.name if student.programme else "N/A",
        programme_code=student.programme.code if student.programme else "N/A",
        academic_year=student.academic_year,
        admission_id=student.admission_id,
        admission_date=student.admission_date,
        admission_status=student.admission_status,
        seat_category=student.seat_category,
        record_status=student.record_status,
        source_of_submission=student.source_of_submission,
        created_at=student.created_at,
        updated_at=student.updated_at,
        enrolments=[]
    )

@router.post("/{id}/corrections", response_model=StudentCorrectionResponse)
def submit_correction(
    id: str,
    req: StudentCorrectionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found.")

    cur_val = getattr(student, req.field_to_correct, None)

    corr = StudentCorrectionRequest(
        student_id=student.id,
        field_to_correct=req.field_to_correct,
        current_value=str(cur_val) if cur_val is not None else None,
        proposed_value=req.proposed_value,
        reason=req.reason,
        supporting_doc_ref=req.supporting_doc_ref,
        status="PENDING"
    )
    db.add(corr)
    db.commit()
    db.refresh(corr)

    AuditService.log(
        db=db,
        action="STUDENT_CORRECTION_REQUESTED",
        entity_type="STUDENT",
        actor_role=user.role.value,
        actor_id=user.id,
        actor_name=user.full_name,
        institution_id=student.institution_id,
        entity_id=student.id,
        outcome="SUCCESS",
        metadata={"field": req.field_to_correct, "proposed": req.proposed_value}
    )

    return StudentCorrectionResponse(
        id=corr.id,
        student_id=corr.student_id,
        student_name=student.student_name,
        field_to_correct=corr.field_to_correct,
        current_value=corr.current_value,
        proposed_value=corr.proposed_value,
        reason=corr.reason,
        supporting_doc_ref=corr.supporting_doc_ref,
        status=corr.status,
        created_at=corr.created_at
    )
