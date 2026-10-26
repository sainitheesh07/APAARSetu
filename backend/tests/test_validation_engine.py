from app.services.validation_engine import ValidationEngine
from app.core.database import SessionLocal
from app.models.submission import IssueType, IssueSeverity

def test_apaar_format_checker():
    # Valid 12 digits
    valid, err = ValidationEngine.validate_apaar_format("849302194821")
    assert valid is True
    assert err is None

    # Missing
    valid, err = ValidationEngine.validate_apaar_format("")
    assert valid is False
    assert "missing" in err.lower()

    # Short (e.g. 10 digits)
    valid, err = ValidationEngine.validate_apaar_format("1234567890")
    assert valid is False
    assert "12 numeric digits" in err

    # Dummy all zeros
    valid, err = ValidationEngine.validate_apaar_format("000000000000")
    assert valid is False

def test_batch_validation_duplicate_and_cross_institution():
    db = SessionLocal()
    try:
        # Batch containing:
        # Row 1: Valid student
        # Row 2: Duplicate APAAR of Row 1 in same file
        # Row 3: APAAR belonging to BITS Pilani student '112233445566' (Cross-institution collision!)
        rows = [
            {
                "student_name": "Test Student 1",
                "admission_id": "TEST-001",
                "apaar_id": "999888777666",
                "programme_code": "CSE",
                "seat_category": "REGULAR"
            },
            {
                "student_name": "Test Student 2",
                "admission_id": "TEST-002",
                "apaar_id": "999888777666",  # Duplicate in file
                "programme_code": "CSE",
                "seat_category": "REGULAR"
            },
            {
                "student_name": "Test Student 3",
                "admission_id": "TEST-003",
                "apaar_id": "112233445566",  # Cross-institution enrolled at BITS Pilani!
                "programme_code": "CSE",
                "seat_category": "REGULAR"
            }
        ]

        row_results, summary = ValidationEngine.validate_batch(
            db=db,
            institution_id=1,  # IIT Delhi
            academic_year="2026-2027",
            rows=rows
        )

        assert summary.total_rows == 3
        assert summary.duplicate_in_file_count == 1
        assert summary.cross_institution_count == 1
        assert row_results[0].is_valid is True
        assert row_results[1].is_valid is False
        assert any(i.issue_type == IssueType.DUPLICATE_APAAR_IN_FILE for i in row_results[1].issues)
        assert row_results[2].is_valid is False
        assert any(i.issue_type == IssueType.CROSS_INSTITUTION_ENROLMENT for i in row_results[2].issues)
    finally:
        db.close()
