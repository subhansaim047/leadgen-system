import { NextResponse } from 'next/server';
import { LEADS_STORE, deleteLeadById } from '../data';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const lead = LEADS_STORE.find(l => l.id === params.id) || LEADS_STORE[0];
  return NextResponse.json(lead || {});
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const success = deleteLeadById(params.id);
  return NextResponse.json({ status: success ? 'deleted' : 'not_found' });
}
