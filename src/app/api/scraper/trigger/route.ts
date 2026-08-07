import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const jobId = 'job-' + Math.random().toString(36).substring(2, 9);
  
  return NextResponse.json({
    job_id: jobId,
    status: 'completed',
    message: `Scraped leads for ${body.niche || 'Businesses'} in ${body.city || 'City'}, ${body.country || 'USA'} successfully!`,
  });
}
