import { NextResponse } from 'next/server';
import { LEADS_STORE } from '../../leads/data';

export async function GET() {
  const headers = [
    'Business Name',
    'Niche',
    'City',
    'Country',
    'Address',
    'Phone Number',
    'Website URL',
    'Website Status',
    'Google Rating',
    'Review Count',
    'Lead Status',
    'Audit Score',
    'Cold Email Subject',
    'Social DM Text'
  ];
  
  const rows = LEADS_STORE.map(l => [
    `"${(l.business_name || '').replace(/"/g, '""')}"`,
    `"${(l.niche || '').replace(/"/g, '""')}"`,
    `"${(l.city || '').replace(/"/g, '""')}"`,
    `"${(l.country || '').replace(/"/g, '""')}"`,
    `"${(l.address || '').replace(/"/g, '""')}"`,
    `"${(l.phone || '').replace(/"/g, '""')}"`,
    `"${(l.website_url || '').replace(/"/g, '""')}"`,
    `"${(l.website_type || 'none').replace(/"/g, '""')}"`,
    `"${l.google_rating || ''}"`,
    `"${l.review_count || 0}"`,
    `"${(l.status || 'new').replace(/"/g, '""')}"`,
    `"${l.audit?.audit_score || 15}"`,
    `"${(l.ai_analysis?.cold_email_subject || '').replace(/"/g, '""')}"`,
    `"${(l.ai_analysis?.social_dm_text || '').replace(/"/g, '""')}"`
  ].join(','));

  // UTF-8 BOM (\uFEFF) forces Excel on Windows to open the file as a structured spreadsheet with columns
  const BOM = '\uFEFF';
  const csvContent = BOM + [headers.join(','), ...rows].join('\r\n');

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="LeadGen_Verified_Leads.csv"',
      'Cache-Control': 'no-cache',
    },
  });
}
