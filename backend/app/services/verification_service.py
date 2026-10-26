import re
import uuid
import hashlib
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.student import Student, RecordStatus, AdmissionStatus
from app.models.institution import Institution
from app.models.programme import Programme
from app.models.verification import VerificationRequest, VerificationPurpose, VerificationResult
from app.models.user import User
from app.services.audit_service import AuditService
from app.schemas.verification import VerificationCreateRequest, VerificationResponse
from app.core.security import hash_apaar_id, mask_apaar_id

class VerificationService:

    @staticmethod
    def _mask_name(name: str) -> str:
        """Masks student name for privacy: 'Rahul Sharma' -> 'R**** S*****'"""
        parts = name.split()
        masked_parts = []
        for p in parts:
            if len(p) <= 2:
                masked_parts.append(p[0] + "*")
            else:
                masked_parts.append(p[0] + "*" * (len(p) - 1))
        return " ".join(masked_parts)

    @classmethod
    def verify_student(
        cls,
        db: Session,
        req: VerificationCreateRequest,
        current_user: Optional[User] = None,
        ip_address: Optional[str] = None
    ) -> VerificationResponse:
        
        query_val = req.identifier.strip()
        student = None

        # Check if query_val is 12-digit numeric APAAR ID
        cleaned_id = re.sub(r"[-\s]", "", query_val)
        if re.match(r"^\d{12}$", cleaned_id):
            apaar_hash = hash_apaar_id(cleaned_id)
            student = db.query(Student).filter(Student.apaar_hash == apaar_hash).first()
        else:
            # Query by Admission ID
            query = db.query(Student).filter(Student.admission_id == query_val)
            if req.institution_code:
                query = query.join(Institution).filter(Institution.code == req.institution_code.strip())
            student = query.first()

        ref_no = f"EDU-VRF-{datetime.utcnow().year}-{uuid.uuid4().hex[:8].upper()}"

        if not student:
            result = VerificationResult.RECORD_NOT_FOUND
            is_verified = False
            notes = "No matching student record found with the provided credentials."
            student_id = None
            masked_name = None
            masked_apaar = mask_apaar_id(query_val)
            inst_name = None
            inst_code = None
            prog_name = None
            qual_level = None
            acad_year = None
            adm_status = None
            seat_cat = None
        else:
            student_id = student.id
            inst = student.institution
            prog = student.programme
            inst_name = inst.name if inst else "Unknown Institution"
            inst_code = inst.code if inst else "N/A"
            prog_name = prog.name if prog else "Unknown Programme"
            qual_level = prog.qualification_level.value if prog else "Undergraduate"
            acad_year = student.academic_year
            adm_status = student.admission_status.value
            seat_cat = student.seat_category.value
            masked_apaar = student.apaar_id_masked
            
            # If current user is student themselves or institution admin of this institution, show full name, else masked
            if current_user and (current_user.id == student.id or current_user.institution_id == student.institution_id):
                masked_name = student.student_name
            else:
                masked_name = cls._mask_name(student.student_name)

            if student.record_status == RecordStatus.FLAGGED:
                result = VerificationResult.PENDING_REVIEW
                is_verified = False
                notes = "Record is currently flagged for institutional administrative review."
            elif student.admission_status == AdmissionStatus.WITHDRAWN:
                result = VerificationResult.NOT_VERIFIED
                is_verified = False
                notes = "Student has formally withdrawn from the enrolled programme."
            else:
                result = VerificationResult.VERIFIED
                is_verified = True
                notes = f"Verified: Authentic AICTE-recognized student enrolled in {prog_name} ({inst_name})."

        # Generate Digital Seal Hash (SHA-256 fingerprint of the verification record)
        seal_content = f"{ref_no}:{student_id}:{result.value}:{datetime.utcnow().isoformat()}"
        digital_seal = hashlib.sha256(seal_content.encode()).hexdigest()

        # Save verification log
        vr = VerificationRequest(
            reference_no=ref_no,
            requester_id=current_user.id if current_user else None,
            requester_name=req.requester_name,
            requester_org=req.requester_org,
            purpose=req.purpose,
            student_id=student_id,
            identifier_queried=mask_apaar_id(query_val),
            verification_result=result,
            consent_reference=req.consent_reference,
            ip_address=ip_address
        )
        db.add(vr)
        db.commit()

        # Audit log the verification inquiry
        AuditService.log(
            db=db,
            action="STUDENT_VERIFICATION_PERFORMED",
            entity_type="VERIFICATION",
            actor_role=current_user.role.value if current_user else "PUBLIC_VERIFIER",
            actor_id=current_user.id if current_user else None,
            actor_name=req.requester_name,
            institution_id=student.institution_id if student else None,
            entity_id=ref_no,
            outcome="SUCCESS" if is_verified else "FLAGGED",
            metadata={
                "purpose": req.purpose.value,
                "result": result.value,
                "queried_masked": mask_apaar_id(query_val)
            },
            ip_address=ip_address
        )

        return VerificationResponse(
            reference_no=ref_no,
            verification_result=result,
            is_verified=is_verified,
            student_name_masked=masked_name,
            apaar_id_masked=masked_apaar,
            institution_name=inst_name,
            institution_code=inst_code,
            programme_name=prog_name,
            qualification_level=qual_level,
            academic_year=acad_year,
            admission_status=adm_status,
            seat_category=seat_cat,
            verified_at=datetime.utcnow(),
            purpose=req.purpose.value,
            verification_notes=notes,
            digital_seal_hash=digital_seal
        )
