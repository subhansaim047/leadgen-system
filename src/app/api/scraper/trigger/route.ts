import { NextResponse } from 'next/server';
import { generateAndAddLeads } from '../../data';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const count = body.limit || 50;
  
  const created = generateAndAddLeads(
    body.niche || 'Auto Detailing',
    body.city || 'Austin',
    body.country || 'USA',
    count
  );

  const jobId = 'job-' + Math.random().toString(36).substring(2, 9);

  return NextResponse.json({
    job_id: jobId,
    status: 'completed',
    total_found: created.length,
    total_new: created.length,
    message: `Scraped ${created.length} new leads for ${body.niche || 'Businesses'} in ${body.city || 'Austin'}, ${body.country || 'USA'} successfully!`,
  });
}
