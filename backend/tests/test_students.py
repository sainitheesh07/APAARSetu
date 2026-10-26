import pytest
from fastapi import HTTPException
from app.api.v1.students import create_student, get_students
from app.schemas.student import StudentCreate
from app.models.student import AdmissionStatus, SeatCategory
from app.models.user import User, UserRole

def test_create_and_fetch_student_logic(db):
    iitd_admin = db.query(User).filter(User.email == "admin@iitd.ac.in").first()

    req = StudentCreate(
        apaar_id="667788990011",
        student_name="Anil Kumble",
        dob="2005-06-11",
        gender="Male",
        institution_id=1,
        programme_id=1,
        academic_year="2026-2027",
        admission_id="IITD-2026-CSE-777",
        admission_date="2026-08-01",
        admission_status=AdmissionStatus.ENROLLED,
        seat_category=SeatCategory.REGULAR
    )

    student_resp = create_student(req=req, db=db, user=iitd_admin)
    assert student_resp.student_name == "Anil Kumble"
    assert student_resp.apaar_id_masked == "XXXX-XXXX-0011"
    assert student_resp.admission_id == "IITD-2026-CSE-777"

    # Query back
    results = get_students(search="Anil", db=db, user=iitd_admin)
    assert len(results) >= 1
    assert any(s.admission_id == "IITD-2026-CSE-777" for s in results)

def test_tenant_isolation_violation(db):
    bits_admin = db.query(User).filter(User.email == "admin@bits-pilani.ac.in").first()

    # BITS admin attempting to insert student into IIT Delhi (institution_id=1)
    req = StudentCreate(
        apaar_id="119922883377",
        student_name="Unauthorized Cross Student",
        institution_id=1,  # IIT Delhi
        programme_id=1,
        academic_year="2026-2027",
        admission_id="UNAUTH-001",
        seat_category=SeatCategory.REGULAR
    )

    with pytest.raises(HTTPException) as exc:
        create_student(req=req, db=db, user=bits_admin)
    assert exc.value.status_code == 403
    assert "Unauthorized" in exc.value.detail

def test_cross_institution_duplicate_rejection(db):
    iitd_admin = db.query(User).filter(User.email == "admin@iitd.ac.in").first()

    # Student with APAAR ID '112233445566' is already enrolled in BITS Pilani!
    req = StudentCreate(
        apaar_id="112233445566",
        student_name="Duplicate Cross Student",
        institution_id=1,
        programme_id=1,
        academic_year="2026-2027",
        admission_id="COLLISION-001",
        seat_category=SeatCategory.REGULAR
    )

    with pytest.raises(HTTPException) as exc:
        create_student(req=req, db=db, user=iitd_admin)
    assert exc.value.status_code == 400
    assert "CROSS-INSTITUTION CONFLICT" in exc.value.detail
