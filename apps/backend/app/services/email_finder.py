"""
Email Discovery & Verification Service
Sources: Apollo.io (primary), Hunter.io (fallback), website mailto scraping
Verification: ZeroBounce SMTP validation
"""
from typing import Optional
import httpx
from bs4 import BeautifulSoup
from app.core.config import settings


async def find_and_verify_email(
    business_name: str,
    domain: Optional[str],
    website_url: Optional[str],
) -> dict:
    """
    Find and verify email for a business.
    Returns {"email": ..., "email_status": ...}
    """
    email = None

    # ── Step 1: Scrape website for mailto links ────────────────────────────────
    if website_url:
        email = await _scrape_website_email(website_url)

    # ── Step 2: Apollo.io API ─────────────────────────────────────────────────
    if not email and domain and settings.APOLLO_API_KEY:
        email = await _find_via_apollo(business_name, domain)

    # ── Step 3: Hunter.io fallback ────────────────────────────────────────────
    if not email and domain and settings.HUNTER_API_KEY:
        email = await _find_via_hunter(domain)

    if not email:
        return {"email": None, "email_status": "not_found"}

    # ── Step 4: ZeroBounce Verification ──────────────────────────────────────
    status = await _verify_email_zerobounce(email)

    return {"email": email, "email_status": status}


async def _scrape_website_email(url: str) -> Optional[str]:
    """Extract email from website via mailto links and text patterns."""
    import re
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            resp = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
        soup = BeautifulSoup(resp.text, "lxml")

        # Check <a href="mailto:..."> tags first
        for a in soup.find_all("a", href=True):
            if a["href"].startswith("mailto:"):
                email = a["href"].replace("mailto:", "").split("?")[0].strip()
                if "@" in email and "." in email.split("@")[-1]:
                    return email

        # Regex fallback on full page text
        email_pattern = re.compile(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b')
        emails = email_pattern.findall(resp.text)

        # Filter out image/asset emails and common noise
        blocked = ["example.com", "sentry.io", "wixpress.com", "squarespace.com"]
        for email in emails:
            if not any(b in email.lower() for b in blocked):
                return email.lower()

    except Exception:
        pass
    return None


async def _find_via_apollo(business_name: str, domain: str) -> Optional[str]:
    """Find email using Apollo.io People Search API."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.apollo.io/v1/mixed_people/search",
                headers={
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/json",
                    "X-Api-Key": settings.APOLLO_API_KEY,
                },
                json={
                    "q_organization_domains": [domain],
                    "person_titles": ["owner", "manager", "director", "founder", "ceo", "president"],
                    "page": 1,
                    "per_page": 5,
                },
            )
            data = resp.json()

        people = data.get("people", [])
        for person in people:
            email = person.get("email")
            if email and "@" in email and not email.endswith("@gmail.com"):
                return email.lower()

    except Exception:
        pass
    return None


async def _find_via_hunter(domain: str) -> Optional[str]:
    """Find email using Hunter.io Domain Search API."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://api.hunter.io/v2/domain-search",
                params={
                    "domain": domain,
                    "api_key": settings.HUNTER_API_KEY,
                    "limit": 5,
                },
            )
            data = resp.json()

        emails = data.get("data", {}).get("emails", [])
        for item in emails:
            email = item.get("value")
            confidence = item.get("confidence", 0)
            if email and confidence >= 70:
                return email.lower()

    except Exception:
        pass
    return None


async def _verify_email_zerobounce(email: str) -> str:
    """
    Verify email via ZeroBounce SMTP API.
    Returns: valid | invalid | catch_all | risky | disposable | unknown
    """
    if not settings.ZEROBOUNCE_API_KEY:
        return "unverified"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                "https://api.zerobounce.net/v2/validate",
                params={
                    "api_key": settings.ZEROBOUNCE_API_KEY,
                    "email": email,
                    "ip_address": "",
                },
            )
            data = resp.json()

        status = data.get("status", "unknown").lower()
        # ZeroBounce statuses: valid, invalid, catch-all, spamtrap, abuse, do_not_mail, unknown
        mapping = {
            "valid": "valid",
            "invalid": "invalid",
            "catch-all": "catch_all",
            "spamtrap": "risky",
            "abuse": "risky",
            "do_not_mail": "risky",
            "unknown": "unknown",
        }
        return mapping.get(status, "unknown")

    except Exception:
        return "unverified"


def extract_domain(url: str) -> Optional[str]:
    """Extract clean domain from URL."""
    import re
    if not url:
        return None
    match = re.search(r'https?://(?:www\.)?([^/\s]+)', url)
    if match:
        return match.group(1).lower()
    return None
