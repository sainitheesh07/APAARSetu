from app.services.submission_service import SubmissionService
from app.models.user import User

def test_csv_preview_and_commit_flow(db):
    iitd_admin = db.query(User).filter(User.email == "admin@iitd.ac.in").first()

    csv_content = (
        "student_name,admission_id,apaar_id,programme_code,seat_category\n"
        "Batch Student A,IITD-2026-CSE-B1,665544332211,CSE,REGULAR\n"
        "Batch Student B,IITD-2026-ECE-B2,776655443322,ECE,REGULAR\n"
        "Invalid APAAR Student,IITD-2026-CSE-B3,1234,CSE,REGULAR\n"
    )

    preview = SubmissionService.parse_and_preview(
        db=db,
        file_bytes=csv_content.encode("utf-8"),
        filename="test_batch_upload.csv",
        institution_id=1,
        academic_year="2026-2027",
        user=iitd_admin
    )

    assert preview.total_rows == 3
    assert preview.summary.valid_rows == 2
    assert preview.summary.invalid_rows == 1
    assert preview.submission_token is not None

    # Error report generation
    error_csv = SubmissionService.generate_error_report_csv(preview.submission_token)
    assert "Invalid APAAR Student" in error_csv

    # Commit valid rows
    commit_res = SubmissionService.commit_submission(
        db=db,
        token=preview.submission_token,
        user=iitd_admin,
        commit_mode="VALID_ONLY"
    )

    assert commit_res.accepted_count == 2
    assert commit_res.rejected_count == 1
    assert commit_res.status == "COMPLETED"
