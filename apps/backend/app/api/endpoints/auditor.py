"""
Auditor API Endpoint — triggers website audit for a lead
"""
from uuid import UUID
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.core.database import get_db
from app.models.models import Lead, WebsiteAudit, AIAnalysis, ScrapingJob
from app.auditors.playwright_auditor import audit_website, calculate_opportunity_score
from app.scrapers.social_finder import discover_social_profiles
from app.services.email_finder import find_and_verify_email, extract_domain
from app.ai.openai_service import generate_lead_analysis
from datetime import datetime

router = APIRouter()


@router.post("/trigger/{lead_id}")
async def trigger_audit(
    lead_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Trigger full enrichment pipeline for a single lead."""
    result = await db.execute(select(Lead).filter(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Update status
    await db.execute(
        update(Lead).where(Lead.id == lead_id).values(status="audit_queued")
    )
    await db.commit()

    background_tasks.add_task(_run_full_pipeline, str(lead_id))
    return {"status": "pipeline_queued", "lead_id": str(lead_id)}


@router.post("/trigger-batch")
async def trigger_batch_audit(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Trigger audit for all leads with status 'new'."""
    result = await db.execute(
        select(Lead).filter(Lead.status == "new").limit(50)
    )
    leads = result.scalars().all()

    queued = 0
    for lead in leads:
        await db.execute(
            update(Lead).where(Lead.id == lead.id).values(status="audit_queued")
        )
        background_tasks.add_task(_run_full_pipeline, str(lead.id))
        queued += 1

    await db.commit()
    return {"queued": queued}


async def _run_full_pipeline(lead_id: str):
    """
    Full enrichment pipeline for one lead:
    1. Website audit (Playwright)
    2. Social profile discovery
    3. Email discovery + verification
    4. AI analysis + copy generation
    5. Update lead status to outreach_ready
    """
    from app.core.database import AsyncSessionLocal
    from uuid import UUID

    async with AsyncSessionLocal() as db:
        lead_result = await db.execute(select(Lead).filter(Lead.id == UUID(lead_id)))
        lead = lead_result.scalar_one_or_none()
        if not lead:
            return

        lead_dict = {
            "id": str(lead.id),
            "business_name": lead.business_name,
            "niche": lead.niche,
            "country": lead.country,
            "city": lead.city,
            "phone": lead.phone,
            "website_url": lead.website_url,
            "website_type": lead.website_type,
            "google_rating": float(lead.google_rating) if lead.google_rating else None,
            "review_count": lead.review_count,
        }

        # ── Step 1: Website Audit ────────────────────────────────────────
        try:
            audit_result = await audit_website(lead_id, lead.website_url, lead.business_name)
            opportunity_score = await calculate_opportunity_score(audit_result)

            # Determine final website_type
            issues = audit_result.get("issues_found", [])
            http_code = audit_result.get("http_status_code")
            if not lead.website_url or "No website detected" in issues:
                website_type = "none"
            elif http_code in [404, 500, 0, None] or not audit_result.get("dns_resolved"):
                website_type = "broken"
            elif len(issues) >= 2:
                website_type = "outdated"
            else:
                website_type = "modern"

            # Confidence boost for Playwright-validated "none"
            confidence_boost = 30 if website_type == "none" else 0

            # Save audit record
            existing_audit = await db.execute(select(WebsiteAudit).filter(WebsiteAudit.lead_id == UUID(lead_id)))
            existing = existing_audit.scalar_one_or_none()

            if not existing:
                new_audit = WebsiteAudit(
                    lead_id=UUID(lead_id),
                    **{k: v for k, v in audit_result.items() if k != "lead_id" and hasattr(WebsiteAudit, k)}
                )
                db.add(new_audit)
            else:
                for k, v in audit_result.items():
                    if k != "lead_id" and hasattr(existing, k):
                        setattr(existing, k, v)

            await db.execute(
                update(Lead).where(Lead.id == UUID(lead_id)).values(
                    website_type=website_type,
                    opportunity_score=opportunity_score,
                    confidence_score=min(100, lead.confidence_score + confidence_boost),
                    status="audit_done",
                )
            )
            await db.commit()

        except Exception as e:
            await db.execute(
                update(Lead).where(Lead.id == UUID(lead_id)).values(status="audit_failed")
            )
            await db.commit()
            return

        # ── Step 2: Social Discovery ─────────────────────────────────────
        try:
            social = await discover_social_profiles(
                business_name=lead.business_name,
                city=lead.city,
                phone=lead.phone,
                website_url=lead.website_url,
            )
            await db.execute(
                update(Lead).where(Lead.id == UUID(lead_id)).values(**social)
            )
            await db.commit()
        except Exception:
            pass

        # ── Step 3: Email Discovery ──────────────────────────────────────
        try:
            domain = extract_domain(lead.website_url) if lead.website_url else None
            email_result = await find_and_verify_email(
                business_name=lead.business_name,
                domain=domain,
                website_url=lead.website_url,
            )
            await db.execute(
                update(Lead).where(Lead.id == UUID(lead_id)).values(**email_result)
            )
            await db.commit()
        except Exception:
            pass

        # ── Step 4: AI Analysis ──────────────────────────────────────────
        try:
            # Only generate if no existing analysis
            ai_check = await db.execute(select(AIAnalysis).filter(AIAnalysis.lead_id == UUID(lead_id)))
            if not ai_check.scalar_one_or_none():
                # Refresh lead dict with latest data
                lead_result2 = await db.execute(select(Lead).filter(Lead.id == UUID(lead_id)))
                lead2 = lead_result2.scalar_one_or_none()
                lead_dict2 = {
                    "business_name": lead2.business_name if lead2 else lead.business_name,
                    "niche": lead2.niche if lead2 else lead.niche,
                    "country": lead2.country if lead2 else lead.country,
                    "city": lead2.city if lead2 else lead.city,
                    "phone": lead2.phone if lead2 else lead.phone,
                    "website_url": lead2.website_url if lead2 else lead.website_url,
                    "google_rating": float(lead2.google_rating) if lead2 and lead2.google_rating else None,
                    "review_count": lead2.review_count if lead2 else 0,
                }

                ai_data = await generate_lead_analysis(lead_dict2, audit_result)
                new_ai = AIAnalysis(lead_id=UUID(lead_id), **ai_data)
                db.add(new_ai)
                await db.commit()

        except Exception:
            pass

        # ── Step 5: Mark as Outreach Ready ───────────────────────────────
        await db.execute(
            update(Lead).where(Lead.id == UUID(lead_id)).values(status="outreach_ready")
        )
        await db.commit()
