"""Jobs listing endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import ScrapingJob

router = APIRouter()

@router.get("")
async def list_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ScrapingJob).order_by(ScrapingJob.created_at.desc()).limit(50))
    jobs = result.scalars().all()
    return [
        {
            "id": str(j.id),
            "job_type": j.job_type,
            "status": j.status,
            "niche": j.niche,
            "city": j.city,
            "total_new": j.total_new,
            "total_skipped": j.total_skipped,
            "error_message": j.error_message,
            "created_at": j.created_at.isoformat() if j.created_at else None,
        }
        for j in jobs
    ]
