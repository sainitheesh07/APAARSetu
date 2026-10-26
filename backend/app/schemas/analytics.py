from typing import List, Optional
from pydantic import BaseModel

class OverviewStats(BaseModel):
    total_institutions: int
    approved_institutions: int
    total_programmes: int
    total_students: int
    total_approved_intake: int
    intake_utilization_pct: float
    pending_submissions: int
    unresolved_issues: int
    duplicate_alerts: int
    missing_apaar_count: int
    data_quality_score: float

class ProgrammeIntakeMetric(BaseModel):
    programme_id: int
    programme_name: str
    code: str
    approved_intake: int
    regular_enrolled: int
    supernumerary_enrolled: int
    total_enrolled: int
    remaining_seats: int
    utilization_pct: float
    is_overrun: bool

class CategoryDistribution(BaseModel):
    name: str
    count: int
    percentage: float

class StateDistribution(BaseModel):
    state: str
    institution_count: int
    student_count: int

class TrendMetric(BaseModel):
    period: str
    enrolments: int
    submissions: int

class DataQualityMetric(BaseModel):
    overall_score: float
    verified_percentage: float
    apaar_coverage_percentage: float
    zero_duplicate_percentage: float
    intake_compliance_percentage: float

class InstitutionDashboardStats(BaseModel):
    institution_name: str
    institution_code: str
    aicte_status: str
    total_approved_intake: int
    total_enrolled: int
    remaining_seats: int
    supernumerary_enrolled: int
    nri_oci_enrolled: int
    pending_submissions: int
    unresolved_issues: int
    data_quality_score: float
    programmes: List[ProgrammeIntakeMetric]
