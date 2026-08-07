export type LeadStatus =
  | 'new'
  | 'enriched'
  | 'audit_queued'
  | 'audit_done'
  | 'audit_failed'
  | 'outreach_ready'
  | 'contacted'
  | 'opened'
  | 'replied'
  | 'interested'
  | 'proposal_sent'
  | 'closed'
  | 'converted'
  | 'not_interested';

export type WebsiteType = 'none' | 'broken' | 'outdated' | 'modern' | 'unknown';

export interface Lead {
  id: string;
  business_name: string;
  niche: string;
  country: string;
  city: string;
  state?: string;
  address?: string;
  phone?: string;
  normalized_phone?: string;
  email?: string;
  email_status?: 'unverified' | 'valid' | 'invalid' | 'catch_all' | 'risky' | 'disposable';
  website_url?: string | null;
  website_type: WebsiteType;
  opportunity_score?: number;
  confidence_score?: number;
  fb_url?: string;
  ig_url?: string;
  fb_verified?: boolean;
  ig_verified?: boolean;
  google_rating?: number;
  review_count?: number;
  google_maps_url?: string;
  status: LeadStatus | string;
  source?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;

  audit?: WebsiteAudit;
  ai_analysis?: AIAnalysis;
  outreaches?: Outreach[];
}

export interface WebsiteAudit {
  id: string;
  http_status_code?: number;
  ssl_valid?: boolean;
  has_ssl?: boolean;
  is_mobile_responsive?: boolean;
  is_mobile_friendly?: boolean;
  pagespeed_score?: number;
  load_time_ms?: number;
  load_time_seconds?: number;
  detected_cms?: string;
  cms_detected?: string;
  detected_frameworks?: string[];
  copyright_year?: number;
  screenshot_desktop_url?: string;
  screenshot_mobile_url?: string;
  audit_summary?: string;
  summary?: string;
  audit_score?: number;
  issues_found?: string[];
  issues?: string[];
}

export interface AIAnalysis {
  id?: string;
  opportunity_level?: string;
  estimated_deal_size?: string;
  recommended_pitch?: string;
  prospect_reasoning?: string;
  website_opportunity_summary?: string;
  cold_email_subject?: string;
  cold_email_body?: string;
  email_subject?: string;
  email_body?: string;
  email_followup_1?: string;
  email_followup_2?: string;
  social_dm_text?: string;
  fb_dm_text?: string;
  ig_dm_text?: string;
}

export interface Outreach {
  id: string;
  channel: 'email' | 'facebook' | 'instagram' | 'whatsapp' | 'phone';
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced';
  sent_at?: string;
  opened_at?: string;
  replied_at?: string;
}

export interface OverviewStats {
  total_leads: number;
  by_status?: Record<string, number>;
  no_website?: number;
  no_website_count?: number;
  outdated_website?: number;
  outdated_website_count?: number;
  new_leads?: number;
  audited_leads?: number;
  contacted_leads?: number;
  converted_leads?: number;
}
