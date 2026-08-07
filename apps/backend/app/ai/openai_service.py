"""
OpenAI AI Analysis Service
Generates: prospect reasoning, opportunity summary, email copy, FB/IG DMs
"""
import json
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def generate_lead_analysis(lead: dict, audit: dict) -> dict:
    """
    Generate complete AI analysis for a lead.
    Returns dict with all generated copy fields.
    """
    prompt = _build_prompt(lead, audit)

    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert web agency sales consultant specializing in local business outreach. "
                    "You write compelling, personalized cold outreach copy that converts. "
                    "Always be direct, specific, respectful, and avoid generic phrases. "
                    "Always respond ONLY with valid JSON, no markdown, no extra text."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=1200,
        temperature=0.7,
        response_format={"type": "json_object"},
    )

    usage = response.usage
    prompt_tokens = usage.prompt_tokens if usage else 0
    completion_tokens = usage.completion_tokens if usage else 0

    # Estimate cost (gpt-4o-mini pricing)
    cost_usd = (prompt_tokens * 0.00000015) + (completion_tokens * 0.0000006)

    try:
        result = json.loads(response.choices[0].message.content)
    except (json.JSONDecodeError, IndexError):
        result = {}

    return {
        "prospect_reasoning": result.get("prospect_reasoning", ""),
        "website_opportunity_summary": result.get("website_opportunity_summary", ""),
        "email_subject": result.get("email_subject", ""),
        "email_body": result.get("email_body", ""),
        "email_followup_1": result.get("email_followup_1", ""),
        "email_followup_2": result.get("email_followup_2", ""),
        "fb_dm_text": result.get("fb_dm_text", ""),
        "ig_dm_text": result.get("ig_dm_text", ""),
        "model_used": settings.OPENAI_MODEL,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "cost_usd": round(cost_usd, 6),
    }


def _build_prompt(lead: dict, audit: dict) -> str:
    """Build structured prompt for AI analysis."""
    issues = audit.get("issues_found", [])
    issues_text = "\n".join(f"- {i}" for i in issues) if issues else "- No major issues detected"
    has_website = lead.get("website_url") and lead.get("website_type") != "none"
    website_status = (
        f"Has website: {lead.get('website_url')}\nIssues found:\n{issues_text}"
        if has_website
        else "NO WEBSITE — this business has no online presence at all."
    )

    return f"""
Analyze this local business and generate personalized outreach copy.

BUSINESS DATA:
- Name: {lead.get("business_name", "Unknown")}
- Industry: {lead.get("niche", "Unknown")}
- Location: {lead.get("city", "")}, {lead.get("country", "")}
- Google Rating: {lead.get("google_rating", "N/A")} stars ({lead.get("review_count", 0)} reviews)
- Phone: {lead.get("phone", "N/A")}
- Website Status: {website_status}

TASK:
Generate all of the following, respond ONLY with JSON:

{{
  "prospect_reasoning": "2-3 sentence explanation of why this is a strong prospect for web development services. Be specific about their reviews, location, and website issues.",

  "website_opportunity_summary": "1-2 sentence client-facing summary of website opportunity. Avoid technical jargon.",

  "email_subject": "Compelling cold email subject line under 60 characters. No clickbait. No 'Quick Question' openers.",

  "email_body": "Personalized cold email body under 120 words. Must: 1) Open with a specific compliment about their business (use their real rating/niche), 2) Point out 1-2 specific website issues or lack of website, 3) Offer a free website mockup or audit, 4) End with a single clear CTA. Use plain text format. Sign off as 'Alex from [Agency]'.",

  "email_followup_1": "Short 50-word follow-up email for 3 days after no reply. Reference the first email. Keep it casual.",

  "email_followup_2": "Final 40-word breakup email for 7 days after no reply. Low pressure. Leave door open.",

  "fb_dm_text": "Casual 2-3 sentence Facebook DM. Mention their Facebook page. Offer free mockup. Max 60 words.",

  "ig_dm_text": "Casual 2-3 sentence Instagram DM. Mention their niche and location. Offer free mockup. Max 60 words."
}}
"""
