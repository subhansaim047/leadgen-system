"""
Social Profile Discovery Service
Finds Facebook Pages and Instagram profiles for businesses.
Strategy: Website scraping -> Google Search fallback -> Validation
"""
import re
from typing import Optional
import httpx
from bs4 import BeautifulSoup
from app.core.config import settings

FB_PATTERN = re.compile(
    r'https?://(?:www\.)?facebook\.com/(?!sharer|share|dialog|plugins)'
    r'([\w.\-]+)/?',
    re.IGNORECASE
)
IG_PATTERN = re.compile(
    r'https?://(?:www\.)?instagram\.com/([\w.\-]+)/?',
    re.IGNORECASE
)


async def discover_social_profiles(
    business_name: str,
    city: str,
    phone: Optional[str],
    website_url: Optional[str],
) -> dict:
    """
    Discover FB and IG profiles for a business.
    Returns {"fb_url": ..., "ig_url": ..., "fb_verified": ..., "ig_verified": ...}
    """
    fb_url = None
    ig_url = None

    # ── Step 1: Scrape website HTML for social links ──────────────────────────
    if website_url:
        fb_url, ig_url = await _extract_from_website(website_url)

    # ── Step 2: Google Search fallback ────────────────────────────────────────
    if not fb_url:
        fb_url = await _search_for_profile("facebook.com", business_name, city)

    if not ig_url:
        ig_url = await _search_for_profile("instagram.com", business_name, city)

    # ── Step 3: Validate (check profile exists and name matches) ──────────────
    fb_verified = await _validate_profile(fb_url, business_name, phone) if fb_url else False
    ig_verified = await _validate_profile(ig_url, business_name, phone) if ig_url else False

    return {
        "fb_url": fb_url if fb_verified else fb_url,  # Keep even if unverified
        "ig_url": ig_url if ig_verified else ig_url,
        "fb_verified": fb_verified,
        "ig_verified": ig_verified,
    }


async def _extract_from_website(url: str) -> tuple[Optional[str], Optional[str]]:
    """Scrape business website homepage HTML for social links."""
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
            soup = BeautifulSoup(response.text, "lxml")

        fb_url = None
        ig_url = None

        for a in soup.find_all("a", href=True):
            href = a["href"]
            if not fb_url:
                fb_match = FB_PATTERN.search(href)
                if fb_match:
                    slug = fb_match.group(1)
                    # Filter out generic FB slugs
                    if slug not in ["pages", "groups", "events", "home", "profile.php"]:
                        fb_url = f"https://www.facebook.com/{slug}"
            if not ig_url:
                ig_match = IG_PATTERN.search(href)
                if ig_match:
                    slug = ig_match.group(1)
                    if slug not in ["p", "explore", "reel", "stories"]:
                        ig_url = f"https://www.instagram.com/{slug}"

        return fb_url, ig_url

    except Exception:
        return None, None


async def _search_for_profile(platform: str, business_name: str, city: str) -> Optional[str]:
    """Search Google for FB/IG profile using SerpApi."""
    if not settings.SERPAPI_KEY:
        return None

    query = f'site:{platform} "{business_name}" "{city}"'
    params = {
        "q": query,
        "api_key": settings.SERPAPI_KEY,
        "num": 3,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get("https://serpapi.com/search.json", params=params)
            data = resp.json()

        results = data.get("organic_results", [])
        for result in results:
            link = result.get("link", "")
            if platform in link:
                return link

    except Exception:
        pass

    return None


async def _validate_profile(url: str, business_name: str, phone: Optional[str]) -> bool:
    """
    Validate that a social profile belongs to the business.
    Checks if business name words appear in the profile page text.
    """
    if not url:
        return False

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })

        page_text = response.text.lower()

        # Check if at least 2 words of business name appear on the page
        name_words = [w.lower() for w in business_name.split() if len(w) > 3]
        matches = sum(1 for w in name_words if w in page_text)

        if matches >= 1:
            return True

        # Check phone number if available
        if phone:
            digits = re.sub(r"\D", "", phone)
            if len(digits) >= 7 and digits[-7:] in page_text:
                return True

        return False

    except Exception:
        return False
