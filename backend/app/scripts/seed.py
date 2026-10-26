import uuid
from datetime import datetime, timedelta
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash, hash_apaar_id, mask_apaar_id
from app.models.user import User, UserRole
from app.models.institution import Institution, InstitutionType, AICTEApprovalStatus
from app.models.programme import Programme, QualificationLevel
from app.models.student import Student, Enrolment, AdmissionStatus, SeatCategory, RecordStatus
from app.models.submission import DataSubmission, ValidationIssue, SubmissionStatus, IssueSeverity, IssueType, ResolutionStatus
from app.models.verification import VerificationRequest, VerificationPurpose, VerificationResult
from app.models.audit import AuditLog

def seed_database():
    print("Initializing database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Creating demo institutions...")
        # 1. IIT Delhi
        iitd = Institution(
            code="1-AICTE-IITD-001",
            name="Indian Institute of Technology Delhi",
            institution_type=InstitutionType.CENTRAL_GOVERNMENT,
            aicte_approval_status=AICTEApprovalStatus.APPROVED,
            approval_ref="AICTE/NORTH/2026-27/1-IITD-9812",
            state="Delhi",
            district="New Delhi",
            address="Hauz Khas, New Delhi, Delhi 110016",
            contact_email="admin@iitd.ac.in",
            contact_phone="+91-11-2659-7135",
            academic_year="2026-2027",
            registration_status="ACTIVE"
        )
        db.add(iitd)

        # 2. BITS Pilani
        bits = Institution(
            code="1-AICTE-BITS-002",
            name="Birla Institute of Technology and Science, Pilani",
            institution_type=InstitutionType.DEEMED_UNIVERSITY,
            aicte_approval_status=AICTEApprovalStatus.APPROVED,
            approval_ref="AICTE/NORTH-WEST/2026-27/1-BITS-4411",
            state="Rajasthan",
            district="Jhunjhunu",
            address="Vidya Vihar Campus, Pilani, Rajasthan 333031",
            contact_email="admin@bits-pilani.ac.in",
            contact_phone="+91-1596-245074",
            academic_year="2026-2027",
            registration_status="ACTIVE"
        )
        db.add(bits)
        db.commit()
        db.refresh(iitd)
        db.refresh(bits)

        print("Creating demo programmes & approved intake limits...")
        # Programmes for IIT Delhi
        p_iitd_cse = Programme(
            institution_id=iitd.id,
            name="Computer Science and Engineering",
            code="CSE",
            qualification_level=QualificationLevel.UNDERGRADUATE,
            approved_intake=120,
            academic_year="2026-2027",
            is_active=True
        )
        p_iitd_ece = Programme(
            institution_id=iitd.id,
            name="Electronics and Communication Engineering",
            code="ECE",
            qualification_level=QualificationLevel.UNDERGRADUATE,
            approved_intake=60,
            academic_year="2026-2027",
            is_active=True
        )
        p_iitd_me = Programme(
            institution_id=iitd.id,
            name="Mechanical Engineering",
            code="ME",
            qualification_level=QualificationLevel.UNDERGRADUATE,
            approved_intake=60,
            academic_year="2026-2027",
            is_active=True
        )
        db.add_all([p_iitd_cse, p_iitd_ece, p_iitd_me])

        # Programmes for BITS Pilani
        p_bits_cs = Programme(
            institution_id=bits.id,
            name="Computer Science",
            code="CS",
            qualification_level=QualificationLevel.UNDERGRADUATE,
            approved_intake=100,
            academic_year="2026-2027",
            is_active=True
        )
        p_bits_eee = Programme(
            institution_id=bits.id,
            name="Electrical and Electronics Engineering",
            code="EEE",
            qualification_level=QualificationLevel.UNDERGRADUATE,
            approved_intake=80,
            academic_year="2026-2027",
            is_active=True
        )
        db.add_all([p_bits_cs, p_bits_eee])
        db.commit()
        db.refresh(p_iitd_cse)
        db.refresh(p_iitd_ece)
        db.refresh(p_iitd_me)
        db.refresh(p_bits_cs)
        db.refresh(p_bits_eee)

        print("Creating demo user accounts for all roles...")
        default_pwd = get_password_hash("Password@123")

        u_aicte_admin = User(
            email="aicte.admin@apaarsetu.gov.in",
            hashed_password=default_pwd,
            full_name="Dr. Anil Sahasrabudhe (AICTE Director)",
            role=UserRole.AICTE_ADMIN,
            institution_id=None,
            is_active=True
        )
        u_iitd_admin = User(
            email="admin@iitd.ac.in",
            hashed_password=default_pwd,
            full_name="Prof. Rangan Banerjee (IITD Dean Academic)",
            role=UserRole.INSTITUTION_ADMIN,
            institution_id=iitd.id,
            is_active=True
        )
        u_bits_admin = User(
            email="admin@bits-pilani.ac.in",
            hashed_password=default_pwd,
            full_name="Dr. V. Ramgopal Rao (BITS Vice Chancellor)",
            role=UserRole.INSTITUTION_ADMIN,
            institution_id=bits.id,
            is_active=True
        )
        u_verifier = User(
            email="verifier@tcs.com",
            hashed_password=default_pwd,
            full_name="Pooja Kulkarni (TCS Corporate Background Check)",
            role=UserRole.VERIFIER,
            institution_id=None,
            is_active=True
        )
        u_auditor = User(
            email="auditor@cag.gov.in",
            hashed_password=default_pwd,
            full_name="Rajesh Verma (CAG Senior Auditor)",
            role=UserRole.AUDITOR,
            institution_id=None,
            is_active=True
        )
        u_student = User(
            email="student@iitd.ac.in",
            hashed_password=default_pwd,
            full_name="Aarav Sharma (Student)",
            role=UserRole.STUDENT,
            institution_id=iitd.id,
            is_active=True
        )

        db.add_all([u_aicte_admin, u_iitd_admin, u_bits_admin, u_verifier, u_auditor, u_student])
        db.commit()
        db.refresh(u_aicte_admin)
        db.refresh(u_iitd_admin)

        print("Creating synthetic students & enrolments...")
        # Seed students for IIT Delhi CSE
        synthetic_students_data = [
            ("Aarav Sharma", "2005-04-12", "Male", "IITD-2026-CSE-001", "849302194821", p_iitd_cse, SeatCategory.REGULAR),
            ("Priya Patel", "2005-07-23", "Female", "IITD-2026-CSE-002", "948201948201", p_iitd_cse, SeatCategory.REGULAR),
            ("Rohan Gupta", "2004-11-05", "Male", "IITD-2026-ECE-001", "739102847192", p_iitd_ece, SeatCategory.REGULAR),
            ("Ananya Rao", "2005-02-18", "Female", "IITD-2026-CSE-003", "583920194821", p_iitd_cse, SeatCategory.SUPERNUMERARY_TFW),
            ("Vikram Singh", "2005-09-14", "Male", "IITD-2026-ME-001", "392810482910", p_iitd_me, SeatCategory.REGULAR),
            ("Sneha Reddy", "2005-12-01", "Female", "IITD-2026-CSE-004", "192837465019", p_iitd_cse, SeatCategory.REGULAR),
            ("Aditya Verma", "2004-08-30", "Male", "IITD-2026-ECE-002", "882910492810", p_iitd_ece, SeatCategory.SUPERNUMERARY_EWS),
            ("Ishita Nair", "2005-03-25", "Female", "IITD-2026-CSE-005", "472910482910", p_iitd_cse, SeatCategory.REGULAR),
            ("Kavya Iyer", "2005-06-15", "Female", "IITD-2026-CSE-006", "381920491029", p_iitd_cse, SeatCategory.NRI),
            ("Manish Joshi", "2004-10-10", "Male", "IITD-2026-ME-002", "901928471920", p_iitd_me, SeatCategory.REGULAR),
        ]

        created_students = []
        for name, dob, gender, adm_id, apaar, prog, cat in synthetic_students_data:
            st = Student(
                apaar_id_masked=mask_apaar_id(apaar),
                apaar_hash=hash_apaar_id(apaar),
                student_name=name,
                dob=dob,
                gender=gender,
                institution_id=iitd.id,
                programme_id=prog.id,
                academic_year="2026-2027",
                admission_id=adm_id,
                admission_date="2026-08-01",
                admission_status=AdmissionStatus.ENROLLED,
                seat_category=cat,
                record_status=RecordStatus.VERIFIED,
                source_of_submission="CSV_BULK"
            )
            db.add(st)
            db.flush()

            enr = Enrolment(
                student_id=st.id,
                institution_id=iitd.id,
                programme_id=prog.id,
                academic_year="2026-2027",
                admission_status=AdmissionStatus.ENROLLED,
                seat_category=cat
            )
            db.add(enr)
            created_students.append(st)

        # Seed students for BITS Pilani
        # Note: BITS student "Karan Malhotra" has APAAR ID '112233445566' which will be used to demonstrate cross-institution duplicate conflict!
        bits_students_data = [
            ("Karan Malhotra", "2005-01-10", "Male", "BITS-2026-CS-001", "112233445566", p_bits_cs, SeatCategory.REGULAR),
            ("Divya Sundaram", "2005-05-20", "Female", "BITS-2026-CS-002", "223344556677", p_bits_cs, SeatCategory.REGULAR),
            ("Siddharth Jain", "2004-09-18", "Male", "BITS-2026-EEE-001", "334455667788", p_bits_eee, SeatCategory.REGULAR),
            ("Tanvi Deshmukh", "2005-11-12", "Female", "BITS-2026-CS-003", "445566778899", p_bits_cs, SeatCategory.SUPERNUMERARY_TFW),
        ]

        for name, dob, gender, adm_id, apaar, prog, cat in bits_students_data:
            st = Student(
                apaar_id_masked=mask_apaar_id(apaar),
                apaar_hash=hash_apaar_id(apaar),
                student_name=name,
                dob=dob,
                gender=gender,
                institution_id=bits.id,
                programme_id=prog.id,
                academic_year="2026-2027",
                admission_id=adm_id,
                admission_date="2026-08-01",
                admission_status=AdmissionStatus.ENROLLED,
                seat_category=cat,
                record_status=RecordStatus.VERIFIED,
                source_of_submission="CSV_BULK"
            )
            db.add(st)
            db.flush()

            enr = Enrolment(
                student_id=st.id,
                institution_id=bits.id,
                programme_id=prog.id,
                academic_year="2026-2027",
                admission_status=AdmissionStatus.ENROLLED,
                seat_category=cat
            )
            db.add(enr)

        db.commit()

        print("Creating sample data submissions and validation issues...")
        sub1 = DataSubmission(
            institution_id=iitd.id,
            submitted_by=u_iitd_admin.id,
            academic_year="2026-2027",
            programme_id=p_iitd_cse.id,
            filename="iitd_cse_batch_2026_round1.csv",
            total_rows=10,
            accepted_rows=8,
            rejected_rows=2,
            pending_review_rows=2,
            status=SubmissionStatus.COMPLETED
        )
        db.add(sub1)
        db.flush()

        issue1 = ValidationIssue(
            submission_id=sub1.id,
            row_number=4,
            issue_type=IssueType.DUPLICATE_APAAR_IN_FILE,
            severity=IssueSeverity.CRITICAL,
            description="Duplicate APAAR ID '849302194821' appeared twice in uploaded CSV file.",
            raw_record_snippet="Admission ID: IITD-2026-CSE-004, APAAR: XXXX-XXXX-4821",
            resolution_status=ResolutionStatus.PENDING
        )
        issue2 = ValidationIssue(
            submission_id=sub1.id,
            row_number=9,
            issue_type=IssueType.MISSING_APAAR_ID,
            severity=IssueSeverity.CRITICAL,
            description="Student 'Rohit Mehta' record missing mandatory 12-digit APAAR identifier.",
            raw_record_snippet="Admission ID: IITD-2026-CSE-009, APAAR: MISSING",
            resolution_status=ResolutionStatus.PENDING
        )
        db.add_all([issue1, issue2])

        print("Creating sample verification queries...")
        v1 = VerificationRequest(
            reference_no="EDU-VRF-2026-A1B2C3D4",
            requester_id=u_verifier.id,
            requester_name="Pooja Kulkarni (TCS)",
            requester_org="Tata Consultancy Services Ltd",
            purpose=VerificationPurpose.EMPLOYMENT,
            student_id=created_students[0].id,
            identifier_queried="XXXX-XXXX-4821",
            verification_result=VerificationResult.VERIFIED,
            consent_reference="CONSENT-TCS-2026-8841",
            ip_address="192.168.1.50"
        )
        db.add(v1)

        print("Creating regulatory audit logs...")
        logs = [
            AuditLog(
                actor_id=u_aicte_admin.id,
                actor_name=u_aicte_admin.full_name,
                actor_role=u_aicte_admin.role.value,
                action="SYSTEM_INIT_APPROVED_LIMITS",
                entity_type="SYSTEM",
                entity_id="GLOBAL",
                outcome="SUCCESS",
                metadata_json='{"academic_year": "2026-2027", "institutions_configured": 2}'
            ),
            AuditLog(
                actor_id=u_iitd_admin.id,
                actor_name=u_iitd_admin.full_name,
                actor_role=u_iitd_admin.role.value,
                institution_id=iitd.id,
                action="CSV_SUBMISSION_COMMITTED",
                entity_type="SUBMISSION",
                entity_id=str(sub1.id),
                outcome="SUCCESS",
                metadata_json='{"filename": "iitd_cse_batch_2026_round1.csv", "accepted_count": 8, "rejected_count": 2}'
            ),
            AuditLog(
                actor_id=u_verifier.id,
                actor_name=u_verifier.full_name,
                actor_role=u_verifier.role.value,
                action="STUDENT_VERIFICATION_PERFORMED",
                entity_type="VERIFICATION",
                entity_id="EDU-VRF-2026-A1B2C3D4",
                outcome="SUCCESS",
                metadata_json='{"purpose": "EMPLOYMENT", "result": "VERIFIED"}'
            )
        ]
        db.add_all(logs)

        db.commit()
        print("\n Database seed completed successfully!")
        print("Demo Accounts:")
        print("1. AICTE Admin: aicte.admin@apaarsetu.gov.in / Password@123")
        print("2. Institution 1 Admin (IIT Delhi): admin@iitd.ac.in / Password@123")
        print("3. Institution 2 Admin (BITS Pilani): admin@bits-pilani.ac.in / Password@123")
        print("4. Authorized Verifier: verifier@tcs.com / Password@123")
        print("5. Auditor: auditor@cag.gov.in / Password@123")
        print("6. Student: student@iitd.ac.in / Password@123")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
