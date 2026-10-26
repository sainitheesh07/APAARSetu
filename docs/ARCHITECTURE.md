# EduVerify AI — Technical Architecture & Design Document

**Smart India Hackathon 2026 Problem Statement SIH26263**

---

## 1. Executive Summary

EduVerify AI is an enterprise-grade regulatory compliance, student record management, and verification platform designed for the All India Council for Technical Education (AICTE) and higher educational institutions nationwide. The platform solves the chronic issues of:
1. Fragmented institutional student records
2. Dual enrolments and cross-institution ghost admissions
3. Admissions exceeding approved intake limits
4. Missing, unlinked, or malformed APAAR identifiers
5. Insecure, unverified credentials shared with employers

---

## 2. High-Level System Architecture

```mermaid
flowchart TD
    subgraph Frontend ["Frontend Layer (React 19 + TypeScript + Vite + Tailwind CSS)"]
        UI_Landing["Public Landing & Verification Portal"]
        UI_Admin["AICTE Regulatory Command Center"]
        UI_Campus["Institution Campus Management"]
        UI_Bulk["11-Step Bulk Ingestion Wizard"]
        UI_Audit["Auditor Compliance Console"]
    end

    subgraph API_Gateway ["Backend Services (FastAPI + Pydantic v2)"]
        AUTH_SVC["JWT RBAC Auth Service (Argon2id/Bcrypt)"]
        VAL_ENG["Multi-Tier Validation Engine"]
        SUB_SVC["Bulk Ingestion & Transaction Manager"]
        VRF_SVC["Minimum-Disclosure Verification Service"]
        AUD_SVC["Immutable Audit Logger"]
        ANA_SVC["Intake & Data Quality Analytics Engine"]
    end

    subgraph Adapters ["Integration Adapters"]
        APAAR_ADAPTER["APAAR National Registry Adapter (Simulated/Connected)"]
        AICTE_ADAPTER["AICTE EOA Portal API Adapter (Simulated/Connected)"]
        ABC_ADAPTER["DigiLocker Academic Bank of Credits Adapter"]
    end

    subgraph Persistence ["Persistence Layer"]
        DB[(PostgreSQL / SQLite Dual Engine)]
        TABLE_INST["institutions & programmes"]
        TABLE_STU["students (Masked APAAR + Keyed HMAC)"]
        TABLE_ENR["enrolments"]
        TABLE_ISS["validation_issues"]
        TABLE_LOG["audit_logs"]
    end

    UI_Landing --> VRF_SVC
    UI_Admin --> AUTH_SVC & ANA_SVC & VAL_ENG
    UI_Campus --> SUB_SVC & VAL_ENG
    UI_Bulk --> SUB_SVC
    UI_Audit --> AUD_SVC

    AUTH_SVC & VAL_ENG & SUB_SVC & VRF_SVC & AUD_SVC & ANA_SVC --> DB
    VAL_ENG -.-> APAAR_ADAPTER & AICTE_ADAPTER
    VRF_SVC -.-> ABC_ADAPTER
```

---

## 3. Data Privacy & Cryptographic Model

### A. Privacy-Preserving Keyed Fingerprint (HMAC-SHA256)
APAAR IDs are sensitive national academic identifiers. To comply with Indian data privacy mandates and prevent unrestricted identifier enumeration:
- The full plaintext APAAR ID is **never** saved directly into public database columns.
- Instead, the platform computes a keyed HMAC-SHA256 fingerprint:
  $$\text{Fingerprint} = \text{HMAC-SHA256}(\text{Secret Key}, \text{Cleaned APAAR})$$
- This allows deterministic $O(1)$ duplicate checking across millions of records without exposing the underlying identifier.
- User interfaces and system logs display only the masked representation: `XXXX-XXXX-1234`.

### B. Minimum Disclosure Verification
When employers or third parties verify a student:
- They supply the candidate's APAAR ID or admission ID and verification purpose.
- The platform returns only:
  - Verification Status (`VERIFIED`, `PENDING_REVIEW`, `NOT_VERIFIED`)
  - Masked Name (`R**** S*****`)
  - Masked APAAR (`XXXX-XXXX-1234`)
  - Enrolled Programme & Qualification Level
  - Institution Name & AICTE Code
  - Digital Seal (SHA-256 Digest of Verification Event)
- Full personal details (DOB, address, category, phone) are strictly redacted.

---

## 4. Multi-Tier Validation Pipeline

Every student record (manual or batch CSV) undergoes synchronous multi-tier validation:

```mermaid
sequenceDiagram
    autonumber
    actor Campus as Institution Admin
    participant Engine as Validation Engine
    participant DB as System Database
    participant Audit as Audit Service

    Campus->>Engine: Submit student data (Batch CSV or Single Form)
    Engine->>Engine: Tier 1: Check 12-digit APAAR format & dummy sequence filter
    Engine->>Engine: Tier 2: Batch-internal duplicate check
    Engine->>DB: Tier 3: Query same-campus duplicate in academic year
    Engine->>DB: Tier 4: Cross-institution concurrent enrolment check
    Engine->>DB: Tier 5: Verify AICTE Approved Intake ceiling for Programme
    alt Critical Issue Detected (e.g. Intake Exceeded / Cross-Campus Collision)
        Engine-->>Campus: Return row-level error with remediation suggestion
        Engine->>DB: Record in validation_issues (Status: PENDING)
        Engine->>Audit: Log flagged compliance event
    else All Checks Pass
        Engine->>DB: Transactionally insert Student & Enrolment
        Engine->>Audit: Log successful enrolment
        Engine-->>Campus: Issue Verified Enrolment Receipt
    end
```
