"""
Website Auditor Service — Playwright-based full website audit
Checks: HTTP status, SSL, mobile responsiveness, performance, tech stack, screenshots
"""
import asyncio
import hashlib
import os
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Optional
import httpx
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
from app.core.config import settings

SCREENSHOT_DIR = Path("/app/screenshots")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)


# Semaphore to limit concurrent browser instances
_semaphore: Optional[asyncio.Semaphore] = None


def get_semaphore() -> asyncio.Semaphore:
    global _semaphore
    if _semaphore is None:
        _semaphore = asyncio.Semaphore(settings.PLAYWRIGHT_MAX_CONCURRENCY)
    return _semaphore


def _detect_cms(html: str, headers: dict) -> str:
    """Detect CMS from HTML content and HTTP headers."""
    html_lower = html.lower()
    server = headers.get("server", "").lower()
    powered_by = headers.get("x-powered-by", "").lower()

    if "wp-content" in html_lower or "wp-includes" in html_lower:
        return "WordPress"
    if "squarespace" in html_lower:
        return "Squarespace"
    if "wix.com" in html_lower or "wixstatic" in html_lower:
        return "Wix"
    if "shopify" in html_lower or "cdn.shopify" in html_lower:
        return "Shopify"
    if "webflow.io" in html_lower or "webflow" in html_lower:
        return "Webflow"
    if "joomla" in html_lower:
        return "Joomla"
    if "drupal" in html_lower:
        return "Drupal"
    return "Custom / Unknown"


def _detect_frameworks(html: str) -> list[str]:
    """Detect JS frameworks from HTML source."""
    frameworks = []
    patterns = {
        "React": r"react(?:\.min)?\.js|__REACT",
        "Vue.js": r"vue(?:\.min)?\.js",
        "Angular": r"ng-version|angular(?:\.min)?\.js",
        "jQuery 1.x": r"jquery[-/]1\.\d",
        "jQuery 2.x": r"jquery[-/]2\.\d",
        "jQuery 3.x": r"jquery[-/]3\.\d",
        "Bootstrap 3": r"bootstrap[-/]3\.\d",
        "Bootstrap 4": r"bootstrap[-/]4\.\d",
        "Bootstrap 5": r"bootstrap[-/]5\.\d",
    }
    for name, pattern in patterns.items():
        if re.search(pattern, html, re.IGNORECASE):
            frameworks.append(name)
    return frameworks


def _extract_copyright_year(html: str) -> Optional[int]:
    """Extract copyright year from page footer."""
    matches = re.findall(r"©\s*(\d{4})", html)
    if matches:
        try:
            return int(max(matches))
        except ValueError:
            pass
    return None


async def audit_website(lead_id: str, url: str, business_name: str) -> dict:
    """
    Full website audit using Playwright.
    Returns audit result dict matching the website_audits table schema.
    """
    if not url:
        return await _handle_no_website(lead_id, business_name)

    async with get_semaphore():
        return await _run_playwright_audit(lead_id, url, business_name)


async def _run_playwright_audit(lead_id: str, url: str, business_name: str) -> dict:
    """Core Playwright audit logic."""
    result = {
        "lead_id": lead_id,
        "http_status_code": None,
        "final_url": None,
        "redirect_chain": [],
        "dns_resolved": False,
        "ssl_valid": False,
        "is_mobile_responsive": False,
        "has_viewport_meta": False,
        "pagespeed_score": None,
        "load_time_ms": None,
        "detected_cms": None,
        "detected_frameworks": [],
        "copyright_year": None,
        "screenshot_desktop_url": None,
        "screenshot_mobile_url": None,
        "mockup_preview_url": None,
        "audit_summary": "",
        "issues_found": [],
    }

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
            )

            # ─── DESKTOP AUDIT ──────────────────────────────────────────
            context_desktop = await browser.new_context(
                viewport={"width": 1280, "height": 800},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            page = await context_desktop.new_page()

            start_time = time.time()

            try:
                response = await page.goto(
                    url,
                    wait_until="domcontentloaded",
                    timeout=settings.PLAYWRIGHT_TIMEOUT_MS
                )
                load_time_ms = int((time.time() - start_time) * 1000)

                result["http_status_code"] = response.status if response else 0
                result["final_url"] = page.url
                result["dns_resolved"] = True
                result["ssl_valid"] = page.url.startswith("https://")
                result["load_time_ms"] = load_time_ms

                # Get HTML content
                html = await page.content()
                headers = dict(response.headers) if response else {}

                # Detect CMS & frameworks
                result["detected_cms"] = _detect_cms(html, headers)
                result["detected_frameworks"] = _detect_frameworks(html)
                result["copyright_year"] = _extract_copyright_year(html)

                # Check viewport meta tag
                viewport_meta = await page.query_selector('meta[name="viewport"]')
                result["has_viewport_meta"] = viewport_meta is not None

                # Desktop screenshot
                desktop_path = SCREENSHOT_DIR / f"{lead_id}_desktop.png"
                await page.screenshot(path=str(desktop_path), full_page=False)
                result["screenshot_desktop_url"] = f"/screenshots/{lead_id}_desktop.png"

            except PlaywrightTimeout:
                result["issues_found"].append("Page load timeout (>15s)")
                result["http_status_code"] = 0

            await context_desktop.close()

            # ─── MOBILE AUDIT ───────────────────────────────────────────
            context_mobile = await browser.new_context(
                viewport={"width": 390, "height": 844},
                user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
            )
            page_mobile = await context_mobile.new_page()
            try:
                await page_mobile.goto(url, wait_until="domcontentloaded", timeout=settings.PLAYWRIGHT_TIMEOUT_MS)

                # Check if layout overflows on mobile
                overflow = await page_mobile.evaluate(
                    "() => document.documentElement.scrollWidth > document.documentElement.clientWidth"
                )
                result["is_mobile_responsive"] = not overflow and result["has_viewport_meta"]

                mobile_path = SCREENSHOT_DIR / f"{lead_id}_mobile.png"
                await page_mobile.screenshot(path=str(mobile_path), full_page=False)
                result["screenshot_mobile_url"] = f"/screenshots/{lead_id}_mobile.png"

            except PlaywrightTimeout:
                pass
            finally:
                await context_mobile.close()
                await browser.close()

    except Exception as e:
        result["issues_found"].append(f"Audit error: {str(e)[:200]}")
        result["dns_resolved"] = False

    # ─── BUILD ISSUES LIST ──────────────────────────────────────────────────
    if not result["ssl_valid"]:
        result["issues_found"].append("No SSL certificate (HTTP only)")
    if not result["is_mobile_responsive"]:
        result["issues_found"].append("Not mobile responsive")
    if result["load_time_ms"] and result["load_time_ms"] > 3000:
        result["issues_found"].append(f"Slow load time ({result['load_time_ms']}ms)")
    if result["copyright_year"] and result["copyright_year"] < 2020:
        result["issues_found"].append(f"Outdated copyright year ({result['copyright_year']})")
    if "jQuery 1.x" in result["detected_frameworks"] or "jQuery 2.x" in result["detected_frameworks"]:
        result["issues_found"].append("Outdated jQuery version detected")
    if result["http_status_code"] in [404, 500, 0, None]:
        result["issues_found"].append(f"Website returning error ({result['http_status_code']})")

    # ─── SUMMARY TEXT ────────────────────────────────────────────────────────
    result["audit_summary"] = _build_summary(result, business_name)

    return result


async def _handle_no_website(lead_id: str, business_name: str) -> dict:
    """Handle leads with no website — generate mockup."""
    return {
        "lead_id": lead_id,
        "http_status_code": None,
        "dns_resolved": False,
        "ssl_valid": False,
        "is_mobile_responsive": False,
        "has_viewport_meta": False,
        "issues_found": ["No website detected"],
        "audit_summary": f"{business_name} has no website. This is a high-value opportunity to build a professional web presence from scratch.",
        "screenshot_desktop_url": None,
        "screenshot_mobile_url": None,
        "mockup_preview_url": None,
        "detected_cms": None,
        "detected_frameworks": [],
    }


def _build_summary(result: dict, business_name: str) -> str:
    issues = result.get("issues_found", [])
    if not issues:
        return f"{business_name} has a modern, well-optimized website. Low opportunity for full redesign."

    issue_text = "; ".join(issues[:3])
    return f"{business_name}'s website has {len(issues)} critical issue(s): {issue_text}. High opportunity for web development services."


async def calculate_opportunity_score(audit: dict) -> int:
    """
    Calculate Website Opportunity Score (0-100).
    Higher score = BETTER website (lower opportunity for agency).
    We invert this: score stored as OPPORTUNITY (100 = best lead).
    """
    website_quality = 0

    if audit.get("ssl_valid"):
        website_quality += 20
    if audit.get("is_mobile_responsive"):
        website_quality += 30
    load_ms = audit.get("load_time_ms") or 9999
    if load_ms < 3000:
        website_quality += 20
    frameworks = audit.get("detected_frameworks", [])
    modern = any(f in frameworks for f in ["React", "Vue.js", "Angular"])
    if modern:
        website_quality += 30

    # Opportunity score = inverse of website quality
    opportunity = max(0, 100 - website_quality)
    return opportunity
