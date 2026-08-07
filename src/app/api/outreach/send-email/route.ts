import { NextResponse } from 'next/server';
import { LEADS_STORE } from '../../leads/data';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const lead = LEADS_STORE.find(l => l.id === body.lead_id);
  if (lead) {
    lead.status = 'contacted';
  }
  return NextResponse.json({ status: 'sent', message: 'Email queued successfully!' });
}
