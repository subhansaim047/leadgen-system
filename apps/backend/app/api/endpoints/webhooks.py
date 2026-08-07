"""
Webhook Handler — receives events from Smartlead, Resend etc.
Updates lead outreach status in real-time.
"""
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update, select
from fastapi import Depends
from app.core.database import get_db
from app.models.models import Outreach, Lead
from datetime import datetime

router = APIRouter()


@router.post("/smartlead")
async def smartlead_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Handle Smartlead email event webhooks.
    Events: EMAIL_SENT, EMAIL_OPENED, EMAIL_CLICKED, EMAIL_REPLIED, EMAIL_BOUNCED
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = payload.get("event_type", "").upper()
    email_id = payload.get("email_id") or payload.get("lead_id")

    if not email_id:
        return {"status": "ignored", "reason": "no email_id"}

    # Find outreach record
    result = await db.execute(
        select(Outreach).filter(Outreach.smartlead_email_id == str(email_id))
    )
    outreach = result.scalar_one_or_none()

    if not outreach:
        return {"status": "ignored", "reason": "outreach not found"}

    now = datetime.utcnow()

    # Map events to DB updates
    event_map = {
        "EMAIL_SENT":     {"status": "sent",         "sent_at": now},
        "EMAIL_OPENED":   {"status": "opened",       "opened_at": now},
        "EMAIL_CLICKED":  {"status": "clicked",      "clicked_at": now},
        "EMAIL_REPLIED":  {"status": "replied",      "replied_at": now},
        "EMAIL_BOUNCED":  {"status": "bounced",      "bounced_at": now},
        "UNSUBSCRIBED":   {"status": "unsubscribed", "unsubscribed_at": now},
    }

    update_data = event_map.get(event_type)
    if update_data:
        await db.execute(
            update(Outreach).where(Outreach.id == outreach.id).values(**update_data)
        )

        # Mirror important statuses to Lead.status
        lead_status_map = {
            "opened": "opened",
            "replied": "replied",
        }
        if update_data["status"] in lead_status_map:
            await db.execute(
                update(Lead).where(Lead.id == outreach.lead_id).values(
                    status=lead_status_map[update_data["status"]],
                    last_contacted_at=now,
                )
            )

        await db.commit()

    return {"status": "ok", "event": event_type}


@router.post("/resend")
async def resend_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Resend email webhooks."""
    payload = await request.json()
    event_type = payload.get("type", "")
    data = payload.get("data", {})
    email_id = data.get("email_id")

    if not email_id:
        return {"status": "ignored"}

    result = await db.execute(
        select(Outreach).filter(Outreach.resend_email_id == str(email_id))
    )
    outreach = result.scalar_one_or_none()

    if not outreach:
        return {"status": "ignored"}

    now = datetime.utcnow()
    if event_type == "email.delivered":
        await db.execute(update(Outreach).where(Outreach.id == outreach.id).values(status="sent", sent_at=now))
    elif event_type == "email.opened":
        await db.execute(update(Outreach).where(Outreach.id == outreach.id).values(status="opened", opened_at=now))
    elif event_type == "email.bounced":
        await db.execute(update(Outreach).where(Outreach.id == outreach.id).values(status="bounced", bounced_at=now))

    await db.commit()
    return {"status": "ok"}
