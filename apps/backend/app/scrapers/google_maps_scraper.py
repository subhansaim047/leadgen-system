"""
Google Maps Lead Scraper — via Outscraper API
Discovers local businesses by niche and location.
Includes deduplication and confidence scoring.
"""
import hashlib
import re
from typing import Optional
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from app.core.config import settings

OUTSCRAPER_BASE_URL = "https://api.outscraper.com"

# Social URL patterns that indicate "no real website"
FAKE_WEBSITE_PATTERNS = [
    "facebook.com", "fb.com",
    "instagram.com", "yelp.com",
    "yellowpages.com", "foursquare.com",
    "tripadvisor.com", "google.com/maps",
    "nextdoor.com", "thumbtack.com",
    "angi.com", "homeadvisor.com",
    "bbb.org", "linkedin.com",
]


def normalize_phone(phone: str) -> Optional[str]:
    """Strip all non-numeric chars, return E.164-ish normalized phone."""
    if not phone:
        return None
    digits = re.sub(r"\D", "", phone)
    if len(digits) >= 10:
        return digits[-10:]  # Last 10 digits
    return None


def build_dedup_hash(business_name: str, city: str) -> str:
    """Build a deterministic deduplication hash."""
    raw = f"{business_name.lower().strip()}{city.lower().strip()}"
    return hashlib.md5(raw.encode()).hexdigest()


def is_fake_website(url: Optional[str]) -> bool:
    """Returns True if the URL is a social/directory site, not a real website."""
    if not url:
        return True
    url_lower = url.lower()
    return any(pattern in url_lower for pattern in FAKE_WEBSITE_PATTERNS)


def classify_website_type(url: Optional[str]) -> str:
    """Initial classification before full audit."""
    if not url or is_fake_website(url):
        return "none"
    return "unknown"  # Will be updated after Playwright audit


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=30))
async def scrape_google_maps(
    niche: str,
    city: str,
    country: str,
    limit: int = 50,
) -> list[dict]:
    """
    Call Outscraper API to get Google Maps business listings.
    Returns list of normalized lead dicts.
    """
    query = f"{niche} in {city}, {country}"

    params = {
        "query": query,
        "limit": limit,
        "async": "false",
        "fields": "name,full_address,city,state,postal_code,country,phone,site,rating,reviews,place_id,google_maps_url,category",
    }

    headers = {
        "X-API-KEY": settings.OUTSCRAPER_API_KEY,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(
            f"{OUTSCRAPER_BASE_URL}/maps/search-v3",
            params=params,
            headers=headers,
        )
        response.raise_for_status()
        data = response.json()

    raw_results = data.get("data", [])
    if isinstance(raw_results, list) and raw_results and isinstance(raw_results[0], list):
        raw_results = raw_results[0]

    leads = []
    for item in raw_results:
        website = item.get("site") or item.get("website")
        phone = item.get("phone") or item.get("phone_number")

        lead = {
            "source": "outscraper",
            "source_ids": {"google_place_id": item.get("place_id")},
            "google_place_id": item.get("place_id"),
            "business_name": item.get("name", "Unknown"),
            "niche": niche,
            "country": country,
            "city": city,
            "state": item.get("state"),
            "zip_code": item.get("postal_code"),
            "address": item.get("full_address"),
            "phone": phone,
            "normalized_phone": normalize_phone(phone),
            "dedup_hash": build_dedup_hash(item.get("name", ""), city),
            "website_url": None if is_fake_website(website) else website,
            "website_type": classify_website_type(website),
            "google_rating": item.get("rating"),
            "review_count": item.get("reviews") or item.get("reviews_count") or 0,
            "google_maps_url": item.get("google_maps_url"),
            "google_category": item.get("category"),
            "confidence_score": 50,  # Will increase with validation
        }
        leads.append(lead)

    return leads


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=30))
async def scrape_apify_no_website(
    niche: str,
    city: str,
    country: str,
    limit: int = 50,
) -> list[dict]:
    """
    Call Apify No-Website Business Finder Actor API.
    Returns leads that have been pre-filtered to have no website.
    """
    headers = {
        "Authorization": f"Bearer {settings.APIFY_API_TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "searchQuery": f"{niche} in {city}",
        "maxResults": limit,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        # Start the actor run
        run_response = await client.post(
            f"https://api.apify.com/v2/acts/{settings.APIFY_ACTOR_ID}/runs",
            json=payload,
            headers=headers,
        )
        run_response.raise_for_status()
        run_id = run_response.json()["data"]["id"]

        # Poll for completion
        import asyncio
        for _ in range(30):
            await asyncio.sleep(5)
            status_resp = await client.get(
                f"https://api.apify.com/v2/actor-runs/{run_id}",
                headers=headers,
            )
            status = status_resp.json()["data"]["status"]
            if status == "SUCCEEDED":
                break

        # Fetch results
        dataset_id = run_response.json()["data"]["defaultDatasetId"]
        items_resp = await client.get(
            f"https://api.apify.com/v2/datasets/{dataset_id}/items",
            headers=headers,
        )
        items = items_resp.json()

    leads = []
    for item in items:
        phone = item.get("phone")
        city_val = item.get("city", city)
        name = item.get("title") or item.get("name", "Unknown")

        lead = {
            "source": "apify",
            "source_ids": {"apify_id": item.get("placeId")},
            "google_place_id": item.get("placeId"),
            "business_name": name,
            "niche": niche,
            "country": country,
            "city": city_val,
            "address": item.get("address"),
            "phone": phone,
            "normalized_phone": normalize_phone(phone),
            "dedup_hash": build_dedup_hash(name, city_val),
            "website_url": None,
            "website_type": "none",
            "google_rating": item.get("rating"),
            "review_count": item.get("reviewsCount", 0),
            "confidence_score": 70,  # Apify pre-filters, so higher base confidence
        }
        leads.append(lead)

    return leads
