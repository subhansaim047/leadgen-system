import { NextResponse } from 'next/server';
import { INITIAL_LEADS } from '../route';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const lead = INITIAL_LEADS.find(l => l.id === params.id) || INITIAL_LEADS[0];
  return NextResponse.json(lead);
}
