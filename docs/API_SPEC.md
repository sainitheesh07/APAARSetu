# EduVerify AI — REST API Specification (`/api/v1`)

All endpoints are versioned under `/api/v1`. Live interactive OpenAPI Swagger documentation is available at `http://127.0.0.1:8000/docs`.

---

## 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Authenticate user with email and password | No |
| `GET` | `/api/v1/auth/me` | Fetch currently logged-in user profile | Bearer Token |
| `POST` | `/api/v1/auth/refresh` | Refresh expired access token | Bearer Token |
| `POST` | `/api/v1/auth/logout` | Terminate session and write audit log | Bearer Token |

---

## 2. Institutions (`/api/v1/institutions`)

| Method | Endpoint | Description | Permitted Roles |
|---|---|---|---|
| `GET` | `/api/v1/institutions` | Search & filter institutions (state, status, type) | All Authenticated |
| `POST` | `/api/v1/institutions` | Register a new institution | `aicte_admin` |
| `GET` | `/api/v1/institutions/{id}` | Retrieve institution details with metrics | `aicte_admin`, `institution_admin` (own) |
| `PATCH` | `/api/v1/institutions/{id}` | Update institution & approval reference | `aicte_admin` (Approval fields) |

---

## 3. Programmes & Intake (`/api/v1/programmes`)

| Method | Endpoint | Description | Permitted Roles |
|---|---|---|---|
| `GET` | `/api/v1/programmes` | List programmes with live intake utilization | All Authenticated |
| `POST` | `/api/v1/programmes` | Add a programme | `aicte_admin`, `institution_admin` |
| `PATCH` | `/api/v1/programmes/{id}` | Update intake limit (**AICTE Admin Only**) | `aicte_admin` |
| `GET` | `/api/v1/programmes/intake/summary` | Summary of intake vs actual enrolments | All Authenticated |

---

## 4. Students (`/api/v1/students`)

| Method | Endpoint | Description | Permitted Roles |
|---|---|---|---|
| `GET` | `/api/v1/students` | List students with search, filters & pagination | `aicte_admin`, `institution_admin` (isolated) |
| `POST` | `/api/v1/students` | Enroll single student with full validation | `aicte_admin`, `institution_admin` |
| `GET` | `/api/v1/students/{id}` | View student record and enrolment history | Authorized User |
| `PATCH` | `/api/v1/students/{id}` | Update permitted student details | Authorized User |
| `POST` | `/api/v1/students/{id}/corrections` | Submit student data correction request | `student`, `institution_admin` |

---

## 5. Bulk Submissions (`/api/v1/submissions`)

| Method | Endpoint | Description | Permitted Roles |
|---|---|---|---|
| `POST` | `/api/v1/submissions/preview` | Upload CSV, parse, and run validation engine | `institution_admin`, `aicte_admin` |
| `POST` | `/api/v1/submissions/commit` | Transactionally commit valid records | `institution_admin`, `aicte_admin` |
| `GET` | `/api/v1/submissions/error-report/{token}` | Download CSV error report for flagged rows | `institution_admin`, `aicte_admin` |
| `GET` | `/api/v1/submissions/template/sample-csv` | Download sample CSV template | Public / All |
| `GET` | `/api/v1/submissions` | List past batch upload records | `institution_admin`, `aicte_admin` |

---

## 6. Validation Center (`/api/v1/validation`)

| Method | Endpoint | Description | Permitted Roles |
|---|---|---|---|
| `GET` | `/api/v1/validation/issues` | List validation issues with severity filters | `aicte_admin`, `institution_admin`, `auditor` |
| `GET` | `/api/v1/validation/issues/{id}` | Get specific validation issue details | `aicte_admin`, `institution_admin`, `auditor` |
| `POST` | `/api/v1/validation/issues/{id}/resolve` | Resolve issue with mandatory audit explanation | `aicte_admin`, `institution_admin` |

---

## 7. Verification (`/api/v1/verifications`)

| Method | Endpoint | Description | Permitted Roles |
|---|---|---|---|
| `POST` | `/api/v1/verifications` | Minimum disclosure verification lookup | Public / `verifier` |
| `GET` | `/api/v1/verifications/{ref}` | Lookup verification receipt by reference | Public / Verifiers |
| `GET` | `/api/v1/verifications/history/list` | View verification history ledger | `verifier`, `aicte_admin`, `auditor` |

---

## 8. Analytics & Audit (`/api/v1/analytics`, `/api/v1/audit-logs`)

| Method | Endpoint | Description | Permitted Roles |
|---|---|---|---|
| `GET` | `/api/v1/analytics/overview` | National system-wide KPI summary | Authenticated |
| `GET` | `/api/v1/analytics/enrolment` | Department-level intake comparison | Authenticated |
| `GET` | `/api/v1/analytics/categories` | Quota & category breakdown | Authenticated |
| `GET` | `/api/v1/analytics/export-csv` | Download authorized compliance report | Authenticated |
| `GET` | `/api/v1/audit-logs` | Filterable immutable audit logs | `aicte_admin`, `auditor`, `institution_admin` |
| `GET` | `/api/v1/audit-logs/export-csv` | Download regulatory audit trail | `aicte_admin`, `auditor` |
