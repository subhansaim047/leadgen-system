import { NextResponse } from 'next/server';
import { LEADS_STORE } from '../../../data';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => ({}));
  const lead = LEADS_STORE.find(l => l.id === params.id);
  
  if (lead && body.status) {
    lead.status = body.status;
  }

  return NextResponse.json({ status: 'ok', lead });
}
