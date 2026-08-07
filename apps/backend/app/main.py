"""
LEADGEN SYSTEM - FastAPI Application Entry Point
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base
from app.api.endpoints import leads, scraper, auditor, outreach, webhooks, export, jobs


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    print("✅ LeadGen API starting up...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Database tables verified/created.")
    except Exception as e:
        print(f"⚠️ Database init notice: {e}")
    yield
    print("🛑 LeadGen API shutting down...")


app = FastAPI(
    title="LeadGen System API",
    description="AI-powered lead generation and outreach automation backend.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── STATIC FILES (Screenshots) ──────────────────────────────────────────────
os.makedirs("/app/screenshots", exist_ok=True)
app.mount("/screenshots", StaticFiles(directory="/app/screenshots"), name="screenshots")

# ─── ROUTERS ─────────────────────────────────────────────────────────────────
app.include_router(leads.router,     prefix="/api/leads",    tags=["Leads"])
app.include_router(scraper.router,   prefix="/api/scraper",  tags=["Scraper"])
app.include_router(auditor.router,   prefix="/api/audit",    tags=["Auditor"])
app.include_router(outreach.router,  prefix="/api/outreach", tags=["Outreach"])
app.include_router(webhooks.router,  prefix="/api/webhooks", tags=["Webhooks"])
app.include_router(export.router,    prefix="/api/export",   tags=["Export"])
app.include_router(jobs.router,      prefix="/api/jobs",     tags=["Jobs"])


@app.get("/", tags=["System"])
async def root():
    return {"status": "ok", "service": "leadgen-api", "version": "1.0.0"}


@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "service": "leadgen-api", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
