export type UserRole = 'aicte_admin' | 'institution_admin' | 'verifier' | 'auditor' | 'student';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  institution_id: number | null;
  institution_name?: string | null;
  is_active: boolean;
  last_login?: string | null;
  created_at: string;
}

export interface Institution {
  id: number;
  code: string;
  name: string;
  institution_type: string;
  aicte_approval_status: 'APPROVED' | 'PENDING_INSPECTION' | 'SUSPENDED' | 'REJECTED';
  approval_ref?: string | null;
  state: string;
  district: string;
  address?: string | null;
  contact_email: string;
  contact_phone?: string | null;
  academic_year: string;
  registration_status: string;
  created_at: string;
  updated_at: string;
  total_programmes?: number;
  total_approved_intake?: number;
  total_enrolled?: number;
}

export interface Programme {
  id: number;
  institution_id: number;
  institution_name?: string;
  name: string;
  code: string;
  qualification_level: string;
  approved_intake: number;
  academic_year: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  enrolled_count: number;
  supernumerary_count: number;
  remaining_intake: number;
  intake_utilization_pct: number;
}

export interface Enrolment {
  id: number;
  institution_id: number;
  institution_name?: string;
  programme_id: number;
  programme_name?: string;
  academic_year: string;
  admission_status: string;
  seat_category: string;
  created_at: string;
}

export interface Student {
  id: string;
  apaar_id_masked: string;
  student_name: string;
  dob?: string | null;
  gender?: string | null;
  institution_id: number;
  institution_name?: string;
  programme_id: number;
  programme_name?: string;
  programme_code?: string;
  academic_year: string;
  admission_id: string;
  admission_date?: string | null;
  admission_status: 'ENROLLED' | 'TRANSFERRED' | 'WITHDRAWN' | 'GRADUATED';
  seat_category: string;
  record_status: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED';
  source_of_submission: string;
  created_at: string;
  updated_at: string;
  enrolments?: Enrolment[];
}

export interface RowIssueDetail {
  row_number: number;
  field: string;
  issue_type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  suggested_fix?: string | null;
}

export interface RowValidationResult {
  row_number: number;
  student_name: string;
  admission_id: string;
  apaar_id_masked: string;
  programme_code: string;
  seat_category: string;
  academic_year: string;
  is_valid: boolean;
  issues: RowIssueDetail[];
}

export interface ValidationSummary {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicate_in_file_count: number;
  duplicate_existing_count: number;
  cross_institution_count: number;
  intake_exceeded_count: number;
  missing_apaar_count: number;
  can_commit: boolean;
}

export interface PreviewResponse {
  submission_token: string;
  filename: string;
  total_rows: number;
  headers: string[];
  preview_rows: Record<string, any>[];
  row_results: RowValidationResult[];
  summary: ValidationSummary;
}

export interface CommitResponse {
  submission_id: number;
  status: string;
  total_processed: number;
  accepted_count: number;
  rejected_count: number;
  message: string;
}

export interface ValidationIssue {
  id: number;
  submission_id?: number | null;
  student_id?: string | null;
  row_number?: number | null;
  issue_type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  raw_record_snippet?: string | null;
  resolution_status: 'PENDING' | 'RESOLVED' | 'EXCEPTION_APPROVED' | 'REJECTED';
  reviewed_by?: number | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  resolution_notes?: string | null;
  created_at: string;
  institution_id?: number | null;
  institution_name?: string | null;
}

export interface VerificationResponse {
  reference_no: string;
  verification_result: 'VERIFIED' | 'NOT_VERIFIED' | 'PENDING_REVIEW' | 'INSUFFICIENT_CONSENT' | 'RECORD_NOT_FOUND';
  is_verified: boolean;
  student_name_masked?: string | null;
  apaar_id_masked?: string | null;
  institution_name?: string | null;
  institution_code?: string | null;
  programme_name?: string | null;
  qualification_level?: string | null;
  academic_year?: string | null;
  admission_status?: string | null;
  seat_category?: string | null;
  verified_at: string;
  purpose: string;
  verification_notes?: string | null;
  digital_seal_hash?: string | null;
}

export interface OverviewStats {
  total_institutions: number;
  approved_institutions: number;
  total_programmes: number;
  total_students: number;
  total_approved_intake: number;
  intake_utilization_pct: number;
  pending_submissions: number;
  unresolved_issues: number;
  duplicate_alerts: number;
  missing_apaar_count: number;
  data_quality_score: number;
}

export interface ProgrammeIntakeMetric {
  programme_id: number;
  programme_name: string;
  code: string;
  approved_intake: number;
  regular_enrolled: number;
  supernumerary_enrolled: number;
  total_enrolled: number;
  remaining_seats: number;
  utilization_pct: number;
  is_overrun: boolean;
}

export interface CategoryDistribution {
  name: string;
  count: number;
  percentage: number;
}

export interface StateDistribution {
  state: string;
  institution_count: number;
  student_count: number;
}

export interface TrendMetric {
  period: string;
  enrolments: number;
  submissions: number;
}

export interface InstitutionDashboardStats {
  institution_name: string;
  institution_code: string;
  aicte_status: string;
  total_approved_intake: number;
  total_enrolled: number;
  remaining_seats: number;
  supernumerary_enrolled: number;
  nri_oci_enrolled: number;
  pending_submissions: number;
  unresolved_issues: number;
  data_quality_score: number;
  programmes: ProgrammeIntakeMetric[];
}

export interface AuditLog {
  id: number;
  actor_id?: number | null;
  actor_name?: string | null;
  actor_role: string;
  institution_id?: number | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  outcome: string;
  metadata_json?: string | null;
  ip_address?: string | null;
  created_at: string;
}
