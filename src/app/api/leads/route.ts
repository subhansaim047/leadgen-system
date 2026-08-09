import { NextResponse } from 'next/server';
import { getPersistedLeads, clearAllLeads } from './data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase();
  const niche = searchParams.get('niche')?.toLowerCase();
  const websiteType = searchParams.get('website_type')?.toLowerCase();

  let filtered = getPersistedLeads();

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

  if (websiteType && websiteType !== 'all' && websiteType !== '') {
    filtered = filtered.filter(l => l.website_type.toLowerCase() === websiteType);
  }

  return NextResponse.json({
    total: filtered.length,
    page: 1,
    per_page: 100,
    pages: 1,
    data: filtered,
  });
}

export async function DELETE() {
  clearAllLeads();
  return NextResponse.json({ status: 'cleared', message: 'All leads deleted successfully' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.leads && Array.isArray(body.leads)) {
      const current = getPersistedLeads();
      const updated = [...body.leads, ...current];
      // Note: savePersistedLeads handles deduplication internally if implemented, or we just prepend
      import('./data').then(m => m.savePersistedLeads(updated));
      return NextResponse.json({ status: 'success', saved: body.leads.length });
    }
    return NextResponse.json({ status: 'error', message: 'Invalid payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
