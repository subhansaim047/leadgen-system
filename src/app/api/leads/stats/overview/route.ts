import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    total_leads: 42,
    new_leads: 18,
    audited_leads: 35,
    contacted_leads: 12,
    converted_leads: 5,
    no_website_count: 24,
    outdated_website_count: 14,
    social_only_count: 4,
    average_audit_score: 72,
    conversion_rate: 11.9,
  });
}
