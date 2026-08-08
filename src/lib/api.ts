import { Lead, OverviewStats } from '@/types';

// Force relative API paths for 100% native Next.js Vercel API routing
const API_BASE = '';

export async function fetchLeads(params?: {
  page?: number;
  per_page?: number;
  status?: string;
  niche?: string;
  country?: string;
  city?: string;
  website_type?: string;
  search?: string;
}): Promise<{ total: number; page: number; per_page: number; pages: number; data: Lead[] }> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') query.append(key, String(val));
    });
  }

  const res = await fetch(`${API_BASE}/api/leads?${query.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch leads');
  return res.json();
}

export async function fetchLeadDetail(id: string): Promise<Lead> {
  const res = await fetch(`${API_BASE}/api/leads/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch lead detail');
  return res.json();
}

export async function updateLeadStatus(id: string, status: string, notes?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/leads/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes }),
  });
  if (!res.ok) throw new Error('Failed to update lead status');
}

export async function deleteLead(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/leads/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete lead');
}

export async function deleteAllLeads(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/leads`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to clear all leads');
}

export async function triggerScrape(data: {
  niche: string;
  city: string;
  country: string;
  limit?: number;
  source?: string;
  website_filter?: 'none' | 'with_broken_website' | 'with_active_website' | 'all';
}): Promise<{ job_id: string; total_new?: number; leads?: any[]; execution_time_seconds?: number }> {
  const res = await fetch(`${API_BASE}/api/scraper/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to trigger scraper');
  return res.json();
}

export async function triggerAudit(leadId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/audit/trigger/${leadId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to trigger audit');
}

export async function sendEmail(leadId: string, subject?: string, body?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/outreach/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lead_id: leadId, subject, body }),
  });
  if (!res.ok) throw new Error('Failed to send email');
}

export async function fetchStats(): Promise<OverviewStats> {
  const res = await fetch(`${API_BASE}/api/leads/stats/overview`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}
