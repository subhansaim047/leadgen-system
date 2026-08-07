"""
Outreach API Endpoint — sends emails via Smartlead and manages outreach records
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, insert
from pydantic import BaseModel
from typing import Optional
import httpx
from app.core.database import get_db
from app.core.config import settings
from app.models.models import Lead, AIAnalysis, Outreach
from datetime import datetime

router = APIRouter()


class SendEmailRequest(BaseModel):
    lead_id: str
    subject: Optional[str] = None
    body: Optional[str] = None
    # If not provided, uses AI-generated copy from ai_analyses table


class BulkSendRequest(BaseModel):
    lead_ids: list[str]


@router.post("/send-email")
async def send_email(
    body: SendEmailRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Send personalized cold email to a single lead via Smartlead."""
    lead_result = await db.execute(select(Lead).filter(Lead.id == UUID(body.lead_id)))
    lead = lead_result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if not lead.email or lead.email_status not in ["valid", "unverified"]:
        raise HTTPException(status_code=400, detail="No valid email for this lead")

    # Get AI-generated copy if not provided
    subject = body.subject
    email_body = body.body
    if not subject or not email_body:
        ai_result = await db.execute(select(AIAnalysis).filter(AIAnalysis.lead_id == UUID(body.lead_id)))
        ai = ai_result.scalar_one_or_none()
        if ai:
            subject = subject or ai.email_subject
            email_body = email_body or ai.email_body

    if not subject or not email_body:
        raise HTTPException(status_code=400, detail="No email copy available. Run AI analysis first.")

    background_tasks.add_task(
        _dispatch_email,
        lead_id=body.lead_id,
        email=lead.email,
        business_name=lead.business_name,
        subject=subject,
        body_text=email_body,
    )

    return {"status": "queued", "lead_id": body.lead_id, "to": lead.email}


async def _dispatch_email(lead_id: str, email: str, business_name: str, subject: str, body_text: str):
    """Dispatch email via Smartlead API and record the outreach."""
    from app.core.database import AsyncSessionLocal
    from uuid import UUID

    smartlead_email_id = None
    success = False

    if settings.SMARTLEAD_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    f"https://server.smartlead.ai/api/v1/campaigns/{settings.SMARTLEAD_CAMPAIGN_ID}/leads",
                    headers={"api_key": settings.SMARTLEAD_API_KEY, "Content-Type": "application/json"},
                    json={
                        "leads": [{
                            "email": email,
                            "first_name": business_name,
                            "custom_fields": {
                                "business_name": business_name,
                                "custom_subject": subject,
                                "custom_body": body_text,
                            },
                        }]
                    },
                )
                data = resp.json()
                smartlead_email_id = str(data.get("id") or data.get("lead_id") or "")
                success = resp.status_code in [200, 201]
        except Exception as e:
            print(f"Smartlead dispatch error: {e}")

    # Record in DB
    async with AsyncSessionLocal() as db:
        new_outreach = Outreach(
            lead_id=UUID(lead_id),
            channel="email",
            sequence_step=1,
            from_address=settings.RESEND_FROM_EMAIL,
            subject=subject,
            body_preview=body_text[:200],
            status="sent" if success else "failed",
            sent_at=datetime.utcnow() if success else None,
            smartlead_email_id=smartlead_email_id,
        )
        db.add(new_outreach)

        if success:
            await db.execute(
                update(Lead)
                .where(Lead.id == UUID(lead_id))
                .values(status="contacted", last_contacted_at=datetime.utcnow())
            )
        await db.commit()


@router.post("/bulk-send")
async def bulk_send_emails(
    body: BulkSendRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Queue email sending for multiple leads."""
    queued = 0
    for lead_id in body.lead_ids:
        background_tasks.add_task(_prepare_and_send, lead_id)
        queued += 1
    return {"queued": queued}


async def _prepare_and_send(lead_id: str):
    """Helper to prepare and send a single email."""
    from app.core.database import AsyncSessionLocal
    from uuid import UUID

    async with AsyncSessionLocal() as db:
        lead_r = await db.execute(select(Lead).filter(Lead.id == UUID(lead_id)))
        lead = lead_r.scalar_one_or_none()
        if not lead or not lead.email:
            return

        ai_r = await db.execute(select(AIAnalysis).filter(AIAnalysis.lead_id == UUID(lead_id)))
        ai = ai_r.scalar_one_or_none()
        if not ai:
            return

        await _dispatch_email(lead_id, lead.email, lead.business_name, ai.email_subject or "", ai.email_body or "")
