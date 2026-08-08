import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getPersistedLeads, markLeadsAsExported } from '../../leads/data';

function buildXlsxBuffer(leads: any[]): Buffer {
  const formattedRows = leads.map(l => ({
    'Business Name': l.business_name || '',
    'Niche': l.niche || '',
    'City': l.city || '',
    'Country': l.country || '',
    'Address': l.address || '',
    'Phone Number': l.phone || '',
    'Website URL': l.website_url || 'No Website',
    'Website Status': l.website_type || 'none',
    'Google Rating': l.google_rating || 5.0,
    'Review Count': l.review_count || 0,
    'Lead Status': l.status || 'new',
    'Opportunity Score': l.confidence_score || 98,
    'Cold Email Subject': l.ai_analysis?.cold_email_subject || '',
    'Social DM Text': l.ai_analysis?.social_dm_text || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);

  worksheet['!cols'] = [
    { wch: 30 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 35 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 18 },
    { wch: 35 },
    { wch: 50 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Verified Leads');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
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

  const buf = buildXlsxBuffer(leadsToExport);

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="LeadGen_Verified_Leads.xlsx"',
      'Cache-Control': 'no-cache',
    },
  });
}

export async function GET() {
  const leadsToExport = getPersistedLeads();
  markLeadsAsExported(leadsToExport);

  const buf = buildXlsxBuffer(leadsToExport);

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="LeadGen_Verified_Leads.xlsx"',
      'Cache-Control': 'no-cache',
    },
  });
}
