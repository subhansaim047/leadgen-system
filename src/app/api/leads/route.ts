import { NextResponse } from 'next/server';
import { INITIAL_LEADS } from './data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase();
  const niche = searchParams.get('niche')?.toLowerCase();
  const status = searchParams.get('status')?.toLowerCase();

  let filtered = [...INITIAL_LEADS];

  if (search) {
    filtered = filtered.filter(l => 
      l.business_name.toLowerCase().includes(search) || 
      l.city.toLowerCase().includes(search) ||
      l.niche.toLowerCase().includes(search)
    );
  }

  if (niche && niche !== 'all') {
    filtered = filtered.filter(l => l.niche.toLowerCase().includes(niche));
  }

  if (status && status !== 'all') {
    filtered = filtered.filter(l => l.status.toLowerCase() === status);
  }

  return NextResponse.json({
    total: filtered.length,
    page: 1,
    per_page: 50,
    pages: 1,
    data: filtered,
  });
}
