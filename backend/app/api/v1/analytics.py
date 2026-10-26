import io
import csv
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.analytics import (
    OverviewStats, ProgrammeIntakeMetric, CategoryDistribution,
    StateDistribution, TrendMetric, InstitutionDashboardStats
)
from app.api.v1.deps import require_current_user, verify_institution_access
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])

@router.get("/overview", response_model=OverviewStats)
def get_analytics_overview(
    institution_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    target_inst = user.institution_id if user.role == UserRole.INSTITUTION_ADMIN else institution_id
    return AnalyticsService.get_overview_stats(db=db, institution_id=target_inst)

@router.get("/enrolment", response_model=List[ProgrammeIntakeMetric])
def get_programme_metrics(
    institution_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    target_inst = user.institution_id if user.role == UserRole.INSTITUTION_ADMIN else institution_id
    return AnalyticsService.get_programme_metrics(db=db, institution_id=target_inst)

@router.get("/categories", response_model=List[CategoryDistribution])
def get_categories(
    institution_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    target_inst = user.institution_id if user.role == UserRole.INSTITUTION_ADMIN else institution_id
    return AnalyticsService.get_category_distribution(db=db, institution_id=target_inst)

@router.get("/states", response_model=List[StateDistribution])
def get_states(
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    return AnalyticsService.get_state_distribution(db=db)

@router.get("/trends", response_model=List[TrendMetric])
def get_trends(
    institution_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    target_inst = user.institution_id if user.role == UserRole.INSTITUTION_ADMIN else institution_id
    return AnalyticsService.get_trend_metrics(db=db, institution_id=target_inst)

@router.get("/institution-dashboard", response_model=InstitutionDashboardStats)
def get_institution_dashboard(
    institution_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    target_inst = user.institution_id if user.role == UserRole.INSTITUTION_ADMIN else institution_id
    if not target_inst:
        raise HTTPException(status_code=400, detail="institution_id is required.")

    verify_institution_access(target_inst, user)
    return AnalyticsService.get_institution_dashboard(db=db, institution_id=target_inst)

@router.get("/export-csv")
def export_analytics_csv(
    institution_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    target_inst = user.institution_id if user.role == UserRole.INSTITUTION_ADMIN else institution_id
    metrics = AnalyticsService.get_programme_metrics(db=db, institution_id=target_inst)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Programme Code",
        "Programme Name",
        "Approved Intake Capacity",
        "Regular Enrolled",
        "Supernumerary Enrolled",
        "Total Enrolled",
        "Remaining Seats",
        "Intake Utilization %",
        "Compliance Status"
    ])

    for m in metrics:
        status_text = "OVERRUN EXCEEDED" if m.is_overrun else "COMPLIANT"
        writer.writerow([
            m.code,
            m.programme_name,
            m.approved_intake,
            m.regular_enrolled,
            m.supernumerary_enrolled,
            m.total_enrolled,
            m.remaining_seats,
            f"{m.utilization_pct}%",
            status_text
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=apaarsetu_programme_analytics_report.csv"}
    )
