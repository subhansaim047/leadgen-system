-- ============================================================
-- LEADGEN SYSTEM - PostgreSQL Database Schema
-- Version: 1.0.0
-- Run: Automatically executed by Docker on first startup
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── LEADS (Master Table) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source tracking
    source              VARCHAR(50) NOT NULL DEFAULT 'google_maps',
    -- google_maps | outscraper | apify | thyonix | preyreach | csv_import
    source_ids          JSONB DEFAULT '{}',
    -- {"google_place_id": "...", "apify_id": "...", "thyonix_id": "..."}

    -- Deduplication keys
    google_place_id     VARCHAR(255) UNIQUE,
    normalized_phone    VARCHAR(30),
    dedup_hash          VARCHAR(64) UNIQUE,
    -- md5(lower(business_name) + lower(city))

    -- Business Info
    business_name       VARCHAR(255) NOT NULL,
    niche               VARCHAR(100) NOT NULL,
    country             VARCHAR(50) NOT NULL,
    city                VARCHAR(100) NOT NULL,
    state               VARCHAR(100),
    zip_code            VARCHAR(20),
    address             TEXT,
    phone               VARCHAR(50),
    email               VARCHAR(255),
    email_status        VARCHAR(30) DEFAULT 'unverified',
    -- unverified | valid | invalid | catch_all | risky | disposable

    -- Website Info
    website_url         TEXT,
    website_type        VARCHAR(30) DEFAULT 'unknown',
    -- none | broken | outdated | modern | unknown
    opportunity_score   SMALLINT DEFAULT 0 CHECK (opportunity_score BETWEEN 0 AND 100),
    confidence_score    SMALLINT DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100),

    -- Social Profiles
    fb_url              TEXT,
    ig_url              TEXT,
    fb_verified         BOOLEAN DEFAULT FALSE,
    ig_verified         BOOLEAN DEFAULT FALSE,

    -- Google Business Data
    google_rating       NUMERIC(2,1),
    review_count        INT DEFAULT 0,
    google_maps_url     TEXT,
    google_category     VARCHAR(255),

    -- CRM Status
    status              VARCHAR(30) NOT NULL DEFAULT 'new',
    -- new | enriched | audit_queued | audit_done | audit_failed |
    -- outreach_ready | contacted | opened | replied | interested |
    -- proposal_sent | closed | not_interested | duplicate

    -- Metadata
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_contacted_at   TIMESTAMPTZ,
    notes               TEXT
);

-- ─── WEBSITE AUDITS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS website_audits (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id                 UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

    -- HTTP Checks
    http_status_code        INT,
    final_url               TEXT,
    -- After redirects
    redirect_chain          JSONB DEFAULT '[]',
    dns_resolved            BOOLEAN DEFAULT FALSE,
    ssl_valid               BOOLEAN DEFAULT FALSE,
    ssl_expiry_date         DATE,

    -- Responsiveness
    is_mobile_responsive    BOOLEAN DEFAULT FALSE,
    has_viewport_meta       BOOLEAN DEFAULT FALSE,

    -- Performance
    pagespeed_score         SMALLINT,
    -- 0-100 from Google PageSpeed API
    load_time_ms            INT,

    -- Technology
    detected_cms            VARCHAR(100),
    -- WordPress | Wix | Squarespace | Shopify | Custom | None
    detected_frameworks     JSONB DEFAULT '[]',
    -- ['jQuery 1.12', 'Bootstrap 3']
    copyright_year          SMALLINT,

    -- Screenshots
    screenshot_desktop_url  TEXT,
    screenshot_mobile_url   TEXT,
    mockup_preview_url      TEXT,
    -- AI-generated mockup for "no-website" leads

    -- Audit Summary
    audit_summary           TEXT,
    -- Human-readable summary of issues found
    issues_found            JSONB DEFAULT '[]',
    -- ['No SSL', 'Not mobile responsive', 'Load time > 5s']

    -- GPT-4o Vision Score (Optional)
    vision_score            SMALLINT,
    vision_notes            TEXT,

    audited_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── AI ANALYSES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_analyses (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id                     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

    -- Prospect Evaluation
    prospect_reasoning          TEXT,
    -- Why this is a good prospect
    website_opportunity_summary TEXT,
    -- Short client-facing summary of website issues

    -- Email Outreach Copy
    email_subject               VARCHAR(255),
    email_body                  TEXT,
    email_followup_1            TEXT,
    email_followup_2            TEXT,

    -- Social DM Copy
    fb_dm_text                  TEXT,
    ig_dm_text                  TEXT,

    -- AI Metadata
    model_used                  VARCHAR(50),
    prompt_tokens               INT,
    completion_tokens           INT,
    cost_usd                    NUMERIC(8,6),

    generated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── OUTREACH HISTORY ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outreaches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

    channel         VARCHAR(30) NOT NULL,
    -- email | facebook | instagram | whatsapp | phone
    sequence_step   SMALLINT DEFAULT 1,
    -- 1 = initial, 2 = follow-up 1, 3 = follow-up 2

    -- Sending
    sent_at         TIMESTAMPTZ,
    from_address    VARCHAR(255),
    subject         VARCHAR(255),
    body_preview    TEXT,

    -- Tracking (Email)
    opened_at       TIMESTAMPTZ,
    clicked_at      TIMESTAMPTZ,
    replied_at      TIMESTAMPTZ,
    bounced_at      TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,

    -- Status
    status          VARCHAR(30) DEFAULT 'pending',
    -- pending | sent | opened | clicked | replied | bounced | unsubscribed

    -- External IDs
    smartlead_email_id VARCHAR(255),
    resend_email_id    VARCHAR(255),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SETTINGS (Runtime Config stored in DB) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT,
    description TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SCRAPING JOBS (Audit Trail) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scraping_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type        VARCHAR(50) NOT NULL,
    -- lead_discovery | website_audit | email_enrichment | ai_generation
    status          VARCHAR(30) DEFAULT 'queued',
    -- queued | running | completed | failed | retrying
    niche           VARCHAR(100),
    country         VARCHAR(50),
    city            VARCHAR(100),
    total_found     INT DEFAULT 0,
    total_new       INT DEFAULT 0,
    total_skipped   INT DEFAULT 0,
    error_message   TEXT,
    retry_count     SMALLINT DEFAULT 0,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_google_place_id ON leads(google_place_id);
CREATE INDEX IF NOT EXISTS idx_leads_dedup_hash ON leads(dedup_hash);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_niche_city ON leads(niche, city);
CREATE INDEX IF NOT EXISTS idx_leads_country ON leads(country);
CREATE INDEX IF NOT EXISTS idx_leads_website_type ON leads(website_type);
CREATE INDEX IF NOT EXISTS idx_leads_opportunity_score ON leads(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_confidence_score ON leads(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreaches_lead_id ON outreaches(lead_id);
CREATE INDEX IF NOT EXISTS idx_outreaches_status ON outreaches(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);

-- ─── AUTO-UPDATE TIMESTAMP FUNCTION ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── DEFAULT SETTINGS ─────────────────────────────────────────────────────────
INSERT INTO settings (key, value, description) VALUES
    ('daily_lead_target', '500', 'Target number of new leads to discover per day'),
    ('max_leads_per_niche', '50', 'Max leads per niche per day'),
    ('playwright_concurrency', '5', 'Max parallel Playwright browser instances'),
    ('email_daily_limit', '40', 'Max emails to send per inbox per day'),
    ('auto_approve_emails', 'false', 'Auto-send emails without manual review'),
    ('target_niches', '["Auto Detailing","Car Wash","HVAC","Plumbing","Roofing","Landscaping","Cleaning Services","Dental Clinics","Medical Suppliers","Construction Companies"]', 'Target niches for lead discovery'),
    ('target_countries', '["USA","Canada","UK","Australia","UAE"]', 'Target countries for lead discovery')
ON CONFLICT (key) DO NOTHING;
