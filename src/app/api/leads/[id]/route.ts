import { NextResponse } from 'next/server';
import { LEADS_STORE } from '../data';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const lead = LEADS_STORE.find(l => l.id === params.id) || LEADS_STORE[0];
  return NextResponse.json(lead);
}
