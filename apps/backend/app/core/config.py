"""
Application Configuration — reads from .env file
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    POSTGRES_USER: str = "leadgen_admin"
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str = "leadgen"

    # Security
    API_SECRET_TOKEN: str

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://yourdomain.com",
    ]

    # Lead Discovery APIs
    OUTSCRAPER_API_KEY: str = ""
    APIFY_API_TOKEN: str = ""
    APIFY_ACTOR_ID: str = "blueberry_delicacy/no-website-finder"
    SERPAPI_KEY: str = ""

    # Email Discovery
    APOLLO_API_KEY: str = ""
    HUNTER_API_KEY: str = ""
    ZEROBOUNCE_API_KEY: str = ""

    # OpenAI
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_VISION_MODEL: str = "gpt-4o"

    # Email Outreach
    SMARTLEAD_API_KEY: str = ""
    SMARTLEAD_CAMPAIGN_ID: str = ""
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = ""

    # Playwright
    PLAYWRIGHT_MAX_CONCURRENCY: int = 5
    PLAYWRIGHT_TIMEOUT_MS: int = 15000

    # Quotas
    DAILY_LEAD_TARGET: int = 500
    MAX_LEADS_PER_NICHE_PER_DAY: int = 50

    # Alerts
    DISCORD_WEBHOOK_URL: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
