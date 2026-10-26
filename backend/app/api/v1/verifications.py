from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.verification import VerificationRequest
from app.models.student import Student
from app.models.user import User, UserRole
from app.schemas.verification import VerificationCreateRequest, VerificationResponse
from app.api.v1.deps import get_current_user, require_current_user
from app.services.verification_service import VerificationService

router = APIRouter(prefix="/verifications", tags=["Verification"])

@router.post("", response_model=VerificationResponse)
def create_verification(
    req: VerificationCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user)
):
    client_ip = request.client.host if request.client else "unknown"
    return VerificationService.verify_student(
        db=db,
        req=req,
        current_user=user,
        ip_address=client_ip
    )

@router.get("/{reference}", response_model=VerificationResponse)
def get_verification_by_reference(
    reference: str,
    db: Session = Depends(get_db)
):
    vr = db.query(VerificationRequest).filter(VerificationRequest.reference_no == reference.strip()).first()
    if not vr:
        raise HTTPException(status_code=404, detail="Verification reference not found.")

    student = vr.student
    inst_name = student.institution.name if student and student.institution else "N/A"
    inst_code = student.institution.code if student and student.institution else "N/A"
    prog_name = student.programme.name if student and student.programme else "N/A"
    qual_level = student.programme.qualification_level.value if student and student.programme else "N/A"
    acad_year = student.academic_year if student else "N/A"
    adm_status = student.admission_status.value if student else "N/A"
    seat_cat = student.seat_category.value if student else "N/A"

    return VerificationResponse(
        reference_no=vr.reference_no,
        verification_result=vr.verification_result,
        is_verified=vr.verification_result.value == "VERIFIED",
        student_name_masked=VerificationService._mask_name(student.student_name) if student else None,
        apaar_id_masked=vr.identifier_queried,
        institution_name=inst_name,
        institution_code=inst_code,
        programme_name=prog_name,
        qualification_level=qual_level,
        academic_year=acad_year,
        admission_status=adm_status,
        seat_category=seat_cat,
        verified_at=vr.created_at,
        purpose=vr.purpose.value,
        verification_notes=f"Digital Verification record generated on {vr.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}."
    )

@router.get("/history/list", response_model=List[VerificationResponse])
def get_verification_history(
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    query = db.query(VerificationRequest)
    if user.role == UserRole.VERIFIER:
        query = query.filter(VerificationRequest.requester_id == user.id)
    elif user.role not in [UserRole.AICTE_ADMIN, UserRole.AUDITOR]:
        raise HTTPException(status_code=403, detail="Unauthorized access to verification history.")

    records = query.order_by(VerificationRequest.created_at.desc()).limit(100).all()
    results = []
    for vr in records:
        st = vr.student
        results.append(VerificationResponse(
            reference_no=vr.reference_no,
            verification_result=vr.verification_result,
            is_verified=vr.verification_result.value == "VERIFIED",
            student_name_masked=VerificationService._mask_name(st.student_name) if st else None,
            apaar_id_masked=vr.identifier_queried,
            institution_name=st.institution.name if st and st.institution else "N/A",
            institution_code=st.institution.code if st and st.institution else "N/A",
            programme_name=st.programme.name if st and st.programme else "N/A",
            qualification_level=st.programme.qualification_level.value if st and st.programme else "N/A",
            academic_year=st.academic_year if st else "N/A",
            admission_status=st.admission_status.value if st else "N/A",
            seat_category=st.seat_category.value if st else "N/A",
            verified_at=vr.created_at,
            purpose=vr.purpose.value,
            verification_notes="Historical record"
        ))
    return results
