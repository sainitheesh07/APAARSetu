from app.services.verification_service import VerificationService
from app.schemas.verification import VerificationCreateRequest, VerificationPurpose
from app.models.verification import VerificationResult

def test_student_verification_found(db):
    req = VerificationCreateRequest(
        identifier="849302194821",  # Aarav Sharma seeded at IIT Delhi
        purpose=VerificationPurpose.EMPLOYMENT,
        requester_name="TCS Recruitment Cell",
        requester_org="Tata Consultancy Services Ltd",
        consent_reference="CONSENT-TCS-2026-99"
    )

    resp = VerificationService.verify_student(db=db, req=req)
    assert resp.is_verified is True
    assert resp.verification_result == VerificationResult.VERIFIED
    assert resp.institution_name == "Indian Institute of Technology Delhi"
    assert "XXXX-XXXX-4821" in resp.apaar_id_masked
    assert resp.digital_seal_hash is not None
    assert "EDU-VRF-" in resp.reference_no

def test_student_verification_not_found(db):
    req = VerificationCreateRequest(
        identifier="000011112222",
        purpose=VerificationPurpose.EMPLOYMENT,
        requester_name="Wipro HR",
        requester_org="Wipro Ltd"
    )

    resp = VerificationService.verify_student(db=db, req=req)
    assert resp.is_verified is False
    assert resp.verification_result == VerificationResult.RECORD_NOT_FOUND
