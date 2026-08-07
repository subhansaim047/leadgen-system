"""
SQLAlchemy ORM Models — mirror of init.sql schema
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    String, Text, Integer, SmallInteger, Boolean,
    Numeric, DateTime, Column, ForeignKey, JSON
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source              = Column(String(50), nullable=False, default="google_maps")
    source_ids          = Column(JSONB, default={})
    google_place_id     = Column(String(255), unique=True)
    normalized_phone    = Column(String(30))
    dedup_hash          = Column(String(64), unique=True)

    business_name       = Column(String(255), nullable=False)
    niche               = Column(String(100), nullable=False)
    country             = Column(String(50), nullable=False)
    city                = Column(String(100), nullable=False)
    state               = Column(String(100))
    zip_code            = Column(String(20))
    address             = Column(Text)
    phone               = Column(String(50))
    email               = Column(String(255))
    email_status        = Column(String(30), default="unverified")

    website_url         = Column(Text)
    website_type        = Column(String(30), default="unknown")
    opportunity_score   = Column(SmallInteger, default=0)
    confidence_score    = Column(SmallInteger, default=50)

    fb_url              = Column(Text)
    ig_url              = Column(Text)
    fb_verified         = Column(Boolean, default=False)
    ig_verified         = Column(Boolean, default=False)

    google_rating       = Column(Numeric(2, 1))
    review_count        = Column(Integer, default=0)
    google_maps_url     = Column(Text)
    google_category     = Column(String(255))

    status              = Column(String(30), nullable=False, default="new")
    notes               = Column(Text)

    created_at          = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at          = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    last_contacted_at   = Column(DateTime(timezone=True))

    # Relationships
    audit               = relationship("WebsiteAudit", back_populates="lead", uselist=False, cascade="all, delete-orphan")
    ai_analysis         = relationship("AIAnalysis", back_populates="lead", uselist=False, cascade="all, delete-orphan")
    outreaches          = relationship("Outreach", back_populates="lead", cascade="all, delete-orphan")


class WebsiteAudit(Base):
    __tablename__ = "website_audits"

    id                      = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id                 = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)

    http_status_code        = Column(Integer)
    final_url               = Column(Text)
    redirect_chain          = Column(JSONB, default=[])
    dns_resolved            = Column(Boolean, default=False)
    ssl_valid               = Column(Boolean, default=False)
    ssl_expiry_date         = Column(String(20))

    is_mobile_responsive    = Column(Boolean, default=False)
    has_viewport_meta       = Column(Boolean, default=False)
    pagespeed_score         = Column(SmallInteger)
    load_time_ms            = Column(Integer)

    detected_cms            = Column(String(100))
    detected_frameworks     = Column(JSONB, default=[])
    copyright_year          = Column(SmallInteger)

    screenshot_desktop_url  = Column(Text)
    screenshot_mobile_url   = Column(Text)
    mockup_preview_url      = Column(Text)

    audit_summary           = Column(Text)
    issues_found            = Column(JSONB, default=[])
    vision_score            = Column(SmallInteger)
    vision_notes            = Column(Text)

    audited_at              = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    lead                    = relationship("Lead", back_populates="audit")


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id                          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id                     = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)

    prospect_reasoning          = Column(Text)
    website_opportunity_summary = Column(Text)

    email_subject               = Column(String(255))
    email_body                  = Column(Text)
    email_followup_1            = Column(Text)
    email_followup_2            = Column(Text)

    fb_dm_text                  = Column(Text)
    ig_dm_text                  = Column(Text)

    model_used                  = Column(String(50))
    prompt_tokens               = Column(Integer)
    completion_tokens           = Column(Integer)
    cost_usd                    = Column(Numeric(8, 6))

    generated_at                = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    lead                        = relationship("Lead", back_populates="ai_analysis")


class Outreach(Base):
    __tablename__ = "outreaches"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id             = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)

    channel             = Column(String(30), nullable=False)
    sequence_step       = Column(SmallInteger, default=1)

    sent_at             = Column(DateTime(timezone=True))
    from_address        = Column(String(255))
    subject             = Column(String(255))
    body_preview        = Column(Text)

    opened_at           = Column(DateTime(timezone=True))
    clicked_at          = Column(DateTime(timezone=True))
    replied_at          = Column(DateTime(timezone=True))
    bounced_at          = Column(DateTime(timezone=True))
    unsubscribed_at     = Column(DateTime(timezone=True))

    status              = Column(String(30), default="pending")
    smartlead_email_id  = Column(String(255))
    resend_email_id     = Column(String(255))

    created_at          = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    lead                = relationship("Lead", back_populates="outreaches")


class ScrapingJob(Base):
    __tablename__ = "scraping_jobs"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_type        = Column(String(50), nullable=False)
    status          = Column(String(30), default="queued")
    niche           = Column(String(100))
    country         = Column(String(50))
    city            = Column(String(100))
    total_found     = Column(Integer, default=0)
    total_new       = Column(Integer, default=0)
    total_skipped   = Column(Integer, default=0)
    error_message   = Column(Text)
    retry_count     = Column(SmallInteger, default=0)
    started_at      = Column(DateTime(timezone=True))
    completed_at    = Column(DateTime(timezone=True))
    created_at      = Column(DateTime(timezone=True), default=datetime.utcnow)
