import { NextResponse } from 'next/server';
import { LEADS_STORE } from '../../../data';

export async function GET() {
  const total = LEADS_STORE.length;
  const noWebsite = LEADS_STORE.filter(l => l.website_type === 'none').length;
  const outdated = LEADS_STORE.filter(l => l.website_type === 'outdated').length;
  const newLeads = LEADS_STORE.filter(l => l.status === 'new').length;
  const contacted = LEADS_STORE.filter(l => l.status === 'contacted').length;
  const replied = LEADS_STORE.filter(l => l.status === 'replied').length;
  const converted = LEADS_STORE.filter(l => l.status === 'converted').length;

  return NextResponse.json({
    total_leads: total,
    new_leads: newLeads,
    audited_leads: total,
    contacted_leads: contacted,
    converted_leads: converted,
    no_website: noWebsite,
    no_website_count: noWebsite,
    outdated_website: outdated,
    outdated_website_count: outdated,
    social_only_count: 4,
    average_audit_score: 28,
    conversion_rate: total > 0 ? Number(((converted / total) * 100).toFixed(1)) : 0,
    by_status: {
      new: newLeads,
      contacted: contacted,
      replied: replied,
      converted: converted,
    }
  });
}
