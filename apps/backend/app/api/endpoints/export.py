"""Placeholder endpoints for export and jobs."""
from fastapi import APIRouter
router = APIRouter()

@router.get("/leads/csv")
async def export_leads_csv():
    return {"message": "Use /api/leads/export/csv endpoint"}
