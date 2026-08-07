import { NextResponse } from 'next/server';
import { LEADS_STORE } from '../../leads/data';

export async function GET() {
  const headers = ['Business Name', 'Niche', 'City', 'Country', 'Phone', 'Website URL', 'Website Type', 'Google Rating', 'Review Count', 'Status'];
  
  const rows = LEADS_STORE.map(l => [
    `"${l.business_name.replace(/"/g, '""')}"`,
    `"${l.niche}"`,
    `"${l.city}"`,
    `"${l.country}"`,
    `"${l.phone || ''}"`,
    `"${l.website_url || ''}"`,
    `"${l.website_type}"`,
    `"${l.google_rating}"`,
    `"${l.review_count}"`,
    `"${l.status}"`
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="leads_export.csv"',
    },
  });
}
