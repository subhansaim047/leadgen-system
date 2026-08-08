import { NextResponse } from 'next/server';
import { LEADS_STORE, markLeadsAsExported } from '../../leads/data';

export async function GET() {
  // Save exported leads to permanent blacklist history so they are NEVER returned again in future scrapes!
  markLeadsAsExported(LEADS_STORE);

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

  const escapeXml = (str: string | number | undefined | null) => {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const rows = LEADS_STORE.map((l) => `
    <tr>
      <td>${escapeXml(l.business_name)}</td>
      <td>${escapeXml(l.niche)}</td>
      <td>${escapeXml(l.city)}</td>
      <td>${escapeXml(l.country)}</td>
      <td>${escapeXml(l.address)}</td>
      <td>${escapeXml(l.phone)}</td>
      <td>${escapeXml(l.website_url || 'No Website')}</td>
      <td>${escapeXml(l.website_type || 'none')}</td>
      <td>${escapeXml(l.google_rating)}</td>
      <td>${escapeXml(l.review_count)}</td>
      <td>${escapeXml(l.status)}</td>
      <td>${escapeXml(l.confidence_score || 98)}</td>
      <td>${escapeXml(l.ai_analysis?.cold_email_subject)}</td>
      <td>${escapeXml(l.ai_analysis?.social_dm_text)}</td>
    </tr>
  `).join('');

  const excelXml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Verified Leads</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        th { background-color: #1e293b; color: #ffffff; font-weight: bold; font-family: Calibri, Arial, sans-serif; font-size: 11pt; padding: 6px; }
        td { font-family: Calibri, Arial, sans-serif; font-size: 10pt; padding: 4px; vertical-align: top; }
        tr:nth-child(even) { background-color: #f8fafc; }
      </style>
    </head>
    <body>
      <table border="1">
        <thead>
          <tr>
            ${headers.map((h) => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
    </html>
  `.trim();

  return new Response(excelXml, {
    headers: {
      'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': 'attachment; filename="LeadGen_Verified_Leads.xls"',
      'Cache-Control': 'no-cache',
    },
  });
}
