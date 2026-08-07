"""
Scraper API Endpoint — triggers lead discovery jobs
"""
import asyncio
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert
from app.core.database import get_db
from app.models.models import Lead, ScrapingJob
from app.scrapers.google_maps_scraper import scrape_google_maps, scrape_apify_no_website, build_dedup_hash
import hashlib, uuid
from datetime import datetime

router = APIRouter()


class ScrapeRequest(BaseModel):
    niche: str
    city: str
    country: str
    limit: int = 50
    source: str = "outscraper"  # outscraper | apify


@router.post("/trigger")
async def trigger_scrape(
    body: ScrapeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Trigger a lead discovery job for a niche/city combination."""
    # Create job record
    job = ScrapingJob(
        job_type="lead_discovery",
        status="queued",
        niche=body.niche,
        country=body.country,
        city=body.city,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    background_tasks.add_task(
        _run_scrape_job,
        str(job.id),
        body.niche,
        body.city,
        body.country,
        body.limit,
        body.source,
    )
    return {"job_id": str(job.id), "status": "queued"}


async def _run_scrape_job(
    job_id: str,
    niche: str,
    city: str,
    country: str,
    limit: int,
    source: str,
):
    """Background task: scrape leads and save to DB with deduplication."""
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        # Mark job as running
        from sqlalchemy import update
        await db.execute(
            update(ScrapingJob)
            .where(ScrapingJob.id == job_id)
            .values(status="running", started_at=datetime.utcnow())
        )
        await db.commit()

        total_found = 0
        total_new = 0
        total_skipped = 0
        error_message = None

        try:
            # ── Scrape leads ────────────────────────────────────────────
            if source == "apify":
                raw_leads = await scrape_apify_no_website(niche, city, country, limit)
            else:
                raw_leads = await scrape_google_maps(niche, city, country, limit)

            total_found = len(raw_leads)

            # ── Deduplicate and insert ──────────────────────────────────
            for lead_data in raw_leads:
                # Check for existing by google_place_id or dedup_hash
                existing = None
                if lead_data.get("google_place_id"):
                    result = await db.execute(
                        select(Lead).filter(Lead.google_place_id == lead_data["google_place_id"])
                    )
                    existing = result.scalar_one_or_none()

                if not existing and lead_data.get("dedup_hash"):
                    result = await db.execute(
                        select(Lead).filter(Lead.dedup_hash == lead_data["dedup_hash"])
                    )
                    existing = result.scalar_one_or_none()

                if existing:
                    # Update confidence score if found in another source
                    if existing.confidence_score < 70:
                        existing.confidence_score = min(100, existing.confidence_score + 20)
                        await db.commit()
                    total_skipped += 1
                    continue

                # Insert new lead
                new_lead = Lead(**{k: v for k, v in lead_data.items() if hasattr(Lead, k)})
                db.add(new_lead)
                total_new += 1

            await db.commit()

            await db.execute(
                update(ScrapingJob)
                .where(ScrapingJob.id == job_id)
                .values(
                    status="completed",
                    total_found=total_found,
                    total_new=total_new,
                    total_skipped=total_skipped,
                    completed_at=datetime.utcnow(),
                )
            )

        except Exception as e:
            error_message = str(e)[:500]
            await db.execute(
                update(ScrapingJob)
                .where(ScrapingJob.id == job_id)
                .values(status="failed", error_message=error_message, completed_at=datetime.utcnow())
            )
        finally:
            await db.commit()


@router.get("/jobs")
async def list_jobs(db: AsyncSession = Depends(get_db)):
    """List recent scraping jobs."""
    result = await db.execute(
        select(ScrapingJob).order_by(ScrapingJob.created_at.desc()).limit(20)
    )
    jobs = result.scalars().all()
    return [
        {
            "id": str(j.id),
            "job_type": j.job_type,
            "status": j.status,
            "niche": j.niche,
            "city": j.city,
            "country": j.country,
            "total_found": j.total_found,
            "total_new": j.total_new,
            "total_skipped": j.total_skipped,
            "error_message": j.error_message,
            "created_at": j.created_at.isoformat() if j.created_at else None,
        }
        for j in jobs
    ]
