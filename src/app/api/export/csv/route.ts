import { NextResponse } from 'next/server';
import { getPersistedLeads, markLeadsAsExported } from '../../leads/data';

function escapeCsv(val: any): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function generateCsvContent(leads: any[]): string {
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
    'Opportunity Score',
    'Cold Email Subject',
    'Social DM Text'
  ];

  const headerLine = headers.map(escapeCsv).join(',');

  const rowLines = leads.map(l => [
    l.business_name,
    l.niche,
    l.city,
    l.country,
    l.address,
    l.phone,
    l.website_url || 'No Website',
    l.website_type || 'none',
    l.google_rating,
    l.review_count,
    l.status,
    l.confidence_score || 98,
    l.ai_analysis?.cold_email_subject || '',
    l.ai_analysis?.social_dm_text || ''
  ].map(escapeCsv).join(','));

  // \ufeff is the UTF-8 Byte Order Mark (BOM) so Excel opens UTF-8 CSVs seamlessly
  return '\ufeff' + [headerLine, ...rowLines].join('\n');
}

export async function GET() {
  const leadsToExport = getPersistedLeads();
  markLeadsAsExported(leadsToExport);

  const csv = generateCsvContent(leadsToExport);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="LeadGen_Verified_Leads.csv"',
      'Cache-Control': 'no-cache',
    },
  });
}

export async function POST(request: Request) {
  let leadsToExport: any[] = [];
  try {
    const body = await request.json();
    if (body.leads && Array.isArray(body.leads) && body.leads.length > 0) {
      leadsToExport = body.leads;
    }
  } catch (e) {}

  if (leadsToExport.length === 0) {
    leadsToExport = getPersistedLeads();
  }

  markLeadsAsExported(leadsToExport);

  const csv = generateCsvContent(leadsToExport);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="LeadGen_Verified_Leads.csv"',
      'Cache-Control': 'no-cache',
    },
  });
}
