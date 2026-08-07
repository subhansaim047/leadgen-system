"""
Leads API Endpoints
Full CRUD + filtering + bulk actions for Lead management
"""
from uuid import UUID
from typing import Optional
import csv
import io

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.models.models import Lead, WebsiteAudit, AIAnalysis, Outreach
from app.core.security import verify_token

router = APIRouter()


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class LeadStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class LeadBulkStatusUpdate(BaseModel):
    lead_ids: list[str]
    status: str


# ─── GET /api/leads ───────────────────────────────────────────────────────────
@router.get("")
async def list_leads(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    status: Optional[str] = None,
    niche: Optional[str] = None,
    country: Optional[str] = None,
    city: Optional[str] = None,
    website_type: Optional[str] = None,
    min_opportunity: Optional[int] = None,
    min_confidence: Optional[int] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List leads with filtering and pagination."""
    query = select(Lead).order_by(Lead.created_at.desc())

    if status:
        query = query.filter(Lead.status == status)
    if niche:
        query = query.filter(Lead.niche == niche)
    if country:
        query = query.filter(Lead.country == country)
    if city:
        query = query.filter(Lead.city.ilike(f"%{city}%"))
    if website_type:
        query = query.filter(Lead.website_type == website_type)
    if min_opportunity is not None:
        query = query.filter(Lead.opportunity_score >= min_opportunity)
    if min_confidence is not None:
        query = query.filter(Lead.confidence_score >= min_confidence)
    if search:
        query = query.filter(Lead.business_name.ilike(f"%{search}%"))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    # Paginate
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    result = await db.execute(query)
    leads = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": -(-total // per_page),  # Ceiling division
        "data": [_serialize_lead(lead) for lead in leads],
    }


# ─── GET /api/leads/{id} ──────────────────────────────────────────────────────
@router.get("/{lead_id}")
async def get_lead(lead_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get single lead with all related data."""
    result = await db.execute(select(Lead).filter(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead_data = _serialize_lead(lead)

    # Attach audit data
    audit_result = await db.execute(select(WebsiteAudit).filter(WebsiteAudit.lead_id == lead_id))
    audit = audit_result.scalar_one_or_none()
    lead_data["audit"] = _serialize_audit(audit) if audit else None

    # Attach AI analysis
    ai_result = await db.execute(select(AIAnalysis).filter(AIAnalysis.lead_id == lead_id))
    ai = ai_result.scalar_one_or_none()
    lead_data["ai_analysis"] = _serialize_ai(ai) if ai else None

    # Attach outreaches
    out_result = await db.execute(select(Outreach).filter(Outreach.lead_id == lead_id).order_by(Outreach.sent_at.desc()))
    outreaches = out_result.scalars().all()
    lead_data["outreaches"] = [_serialize_outreach(o) for o in outreaches]

    return lead_data


# ─── PATCH /api/leads/{id}/status ────────────────────────────────────────────
@router.patch("/{lead_id}/status")
async def update_lead_status(
    lead_id: UUID,
    body: LeadStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update lead status manually from CRM."""
    valid_statuses = [
        "new", "enriched", "audit_queued", "audit_done", "audit_failed",
        "outreach_ready", "contacted", "opened", "replied", "interested",
        "proposal_sent", "closed", "not_interested",
    ]
    if body.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status: {body.status}")

    await db.execute(
        update(Lead)
        .where(Lead.id == lead_id)
        .values(status=body.status, notes=body.notes)
    )
    await db.commit()
    return {"success": True, "new_status": body.status}


# ─── POST /api/leads/bulk-status ─────────────────────────────────────────────
@router.post("/bulk-status")
async def bulk_update_status(
    body: LeadBulkStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Bulk update status for multiple leads."""
    from uuid import UUID as UUIDType
    ids = [UUIDType(i) for i in body.lead_ids]
    await db.execute(
        update(Lead).where(Lead.id.in_(ids)).values(status=body.status)
    )
    await db.commit()
    return {"success": True, "updated_count": len(ids), "new_status": body.status}


# ─── GET /api/leads/export/csv ────────────────────────────────────────────────
@router.get("/export/csv")
async def export_leads_csv(
    status: Optional[str] = None,
    niche: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Export filtered leads as CSV download."""
    query = select(Lead).order_by(Lead.created_at.desc())
    if status:
        query = query.filter(Lead.status == status)
    if niche:
        query = query.filter(Lead.niche == niche)

    result = await db.execute(query)
    leads = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Business Name", "Niche", "Country", "City", "Phone", "Email",
        "Website", "Website Type", "Opportunity Score", "Rating", "Reviews",
        "Facebook", "Instagram", "Status", "Created At",
    ])
    for lead in leads:
        writer.writerow([
            lead.business_name, lead.niche, lead.country, lead.city,
            lead.phone, lead.email, lead.website_url, lead.website_type,
            lead.opportunity_score, lead.google_rating, lead.review_count,
            lead.fb_url, lead.ig_url, lead.status,
            lead.created_at.isoformat() if lead.created_at else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads_export.csv"},
    )


# ─── GET /api/leads/stats ─────────────────────────────────────────────────────
@router.get("/stats/overview")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Return KPI stats for dashboard overview."""
    total = await db.scalar(select(func.count(Lead.id)))
    by_status = {}
    for status in ["new", "outreach_ready", "contacted", "replied", "interested", "closed"]:
        count = await db.scalar(select(func.count(Lead.id)).filter(Lead.status == status))
        by_status[status] = count or 0

    no_website = await db.scalar(select(func.count(Lead.id)).filter(Lead.website_type == "none"))
    outdated = await db.scalar(select(func.count(Lead.id)).filter(Lead.website_type == "outdated"))

    return {
        "total_leads": total or 0,
        "by_status": by_status,
        "no_website": no_website or 0,
        "outdated_website": outdated or 0,
    }


# ─── Serializers ──────────────────────────────────────────────────────────────
def _serialize_lead(lead: Lead) -> dict:
    return {
        "id": str(lead.id),
        "business_name": lead.business_name,
        "niche": lead.niche,
        "country": lead.country,
        "city": lead.city,
        "state": lead.state,
        "address": lead.address,
        "phone": lead.phone,
        "email": lead.email,
        "email_status": lead.email_status,
        "website_url": lead.website_url,
        "website_type": lead.website_type,
        "opportunity_score": lead.opportunity_score,
        "confidence_score": lead.confidence_score,
        "fb_url": lead.fb_url,
        "ig_url": lead.ig_url,
        "fb_verified": lead.fb_verified,
        "ig_verified": lead.ig_verified,
        "google_rating": float(lead.google_rating) if lead.google_rating else None,
        "review_count": lead.review_count,
        "google_maps_url": lead.google_maps_url,
        "status": lead.status,
        "source": lead.source,
        "notes": lead.notes,
        "created_at": lead.created_at.isoformat() if lead.created_at else None,
        "updated_at": lead.updated_at.isoformat() if lead.updated_at else None,
    }


def _serialize_audit(audit: WebsiteAudit) -> dict:
    return {
        "id": str(audit.id),
        "http_status_code": audit.http_status_code,
        "ssl_valid": audit.ssl_valid,
        "is_mobile_responsive": audit.is_mobile_responsive,
        "pagespeed_score": audit.pagespeed_score,
        "load_time_ms": audit.load_time_ms,
        "detected_cms": audit.detected_cms,
        "detected_frameworks": audit.detected_frameworks,
        "copyright_year": audit.copyright_year,
        "screenshot_desktop_url": audit.screenshot_desktop_url,
        "screenshot_mobile_url": audit.screenshot_mobile_url,
        "audit_summary": audit.audit_summary,
        "issues_found": audit.issues_found,
    }


def _serialize_ai(ai: AIAnalysis) -> dict:
    return {
        "id": str(ai.id),
        "prospect_reasoning": ai.prospect_reasoning,
        "website_opportunity_summary": ai.website_opportunity_summary,
        "email_subject": ai.email_subject,
        "email_body": ai.email_body,
        "email_followup_1": ai.email_followup_1,
        "email_followup_2": ai.email_followup_2,
        "fb_dm_text": ai.fb_dm_text,
        "ig_dm_text": ai.ig_dm_text,
    }


def _serialize_outreach(o: Outreach) -> dict:
    return {
        "id": str(o.id),
        "channel": o.channel,
        "status": o.status,
        "sent_at": o.sent_at.isoformat() if o.sent_at else None,
        "opened_at": o.opened_at.isoformat() if o.opened_at else None,
        "replied_at": o.replied_at.isoformat() if o.replied_at else None,
    }
