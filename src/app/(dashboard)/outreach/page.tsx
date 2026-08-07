'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button/Button';
import { fetchLeads, updateLeadStatus } from '@/lib/api';
import { Lead } from '@/types';
import { Facebook, Instagram, Mail, Check, ExternalLink } from 'lucide-react';
import styles from './page.module.css';

export default function OutreachHubPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadSocialLeads = async () => {
    try {
      setLoading(true);
      const res = await fetchLeads({ per_page: 100 });
      setLeads(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSocialLeads();
  }, []);

  const handleCopyAndOpen = async (lead: Lead, platform: 'fb' | 'ig') => {
    const text = lead.ai_analysis?.social_dm_text || 
      lead.ai_analysis?.fb_dm_text || 
      lead.ai_analysis?.ig_dm_text || 
      `Hi ${lead.business_name} team! 👋 Saw your reviews in ${lead.city}. We built a quick modern mobile website prototype for you — mind if I drop a link?`;

    const searchQuery = encodeURIComponent(`${lead.business_name} ${lead.city}`);
    const profileUrl = platform === 'fb'
      ? (lead.fb_url || `https://www.facebook.com/search/top?q=${searchQuery}`)
      : (lead.ig_url || `https://www.instagram.com/explore/search/keyword/?q=${searchQuery}`);

    // Copy message to clipboard
    await navigator.clipboard.writeText(text);
    setCopiedId(`${lead.id}-${platform}`);

    // Update status to contacted
    try {
      await updateLeadStatus(lead.id, 'contacted', `Manual DM sent via ${platform.toUpperCase()}`);
    } catch (err) {
      console.error(err);
    }

    // Open profile in new tab
    window.open(profileUrl, '_blank');

    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleOpenMailto = (lead: Lead) => {
    const subject = encodeURIComponent(lead.ai_analysis?.cold_email_subject || `Quick question regarding ${lead.business_name}`);
    const body = encodeURIComponent(lead.ai_analysis?.cold_email_body || `Hi ${lead.business_name} team,\n\nI noticed your business in ${lead.city}...`);
    window.open(`mailto:contact@${lead.business_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <>
      <Header title="1-Click Social DM Hub" onRefresh={loadSocialLeads} />
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
        Safely send DMs without risking account bans. Clicking a button copies the personalized AI message to your clipboard and opens the business profile in a new tab for 1-click pasting.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading social prospects...</div>
      ) : leads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No leads found in CRM. Trigger a job from Settings to populate target leads!
        </div>
      ) : (
        <div className={styles.grid}>
          {leads.map((lead) => (
            <div key={lead.id} className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.title}>{lead.business_name}</div>
                    <div className={styles.subtitle}>{lead.city}, {lead.country} • {lead.niche}</div>
                  </div>
                </div>

                {/* DM Preview */}
                <div className={styles.msgBox} style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', fontSize: '13px', margin: '12px 0', borderLeft: '3px solid var(--accent-primary)' }}>
                  {lead.ai_analysis?.social_dm_text || lead.ai_analysis?.fb_dm_text || `Hey ${lead.business_name}! Saw your top reviews in ${lead.city}...`}
                </div>
              </div>

              <div className={styles.platformButtons} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={copiedId === `${lead.id}-fb` ? <Check size={14} /> : <Facebook size={14} />}
                  onClick={() => handleCopyAndOpen(lead, 'fb')}
                >
                  {copiedId === `${lead.id}-fb` ? 'Copied & Opened!' : 'Copy & Open FB'}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={copiedId === `${lead.id}-ig` ? <Check size={14} /> : <Instagram size={14} />}
                  onClick={() => handleCopyAndOpen(lead, 'ig')}
                >
                  {copiedId === `${lead.id}-ig` ? 'Copied & Opened!' : 'Copy & Open IG'}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Mail size={14} />}
                  onClick={() => handleOpenMailto(lead)}
                >
                  Mailto
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
