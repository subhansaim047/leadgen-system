'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button/Button';
import { fetchLeads, updateLeadStatus } from '@/lib/api';
import { Lead } from '@/types';
import { Facebook, Instagram, ExternalLink, Check, Copy } from 'lucide-react';
import styles from './page.module.css';

export default function OutreachHubPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadSocialLeads = async () => {
    try {
      setLoading(true);
      const res = await fetchLeads({ per_page: 50 });
      // Filter leads that have FB or IG link
      const socialLeads = res.data.filter((l) => l.fb_url || l.ig_url);
      setLeads(socialLeads);
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
    const text = platform === 'fb'
      ? lead.ai_analysis?.fb_dm_text || `Hi ${lead.business_name}, love your reviews in ${lead.city}! Do you have a website?`
      : lead.ai_analysis?.ig_dm_text || `Hi ${lead.business_name}! Great page. Are you taking on new clients in ${lead.city}?`;

    const profileUrl = platform === 'fb' ? lead.fb_url : lead.ig_url;

    // Copy message to clipboard
    await navigator.clipboard.writeText(text);
    setCopiedId(`${lead.id}-${platform}`);

    // Update status to contacted
    await updateLeadStatus(lead.id, 'contacted', `Manual DM sent via ${platform.toUpperCase()}`);

    // Open profile in new tab
    if (profileUrl) {
      window.open(profileUrl, '_blank');
    }

    setTimeout(() => setCopiedId(null), 3000);
    loadSocialLeads();
  };

  return (
    <>
      <Header title="1-Click Social DM Hub" onRefresh={loadSocialLeads} />
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
        Safely send DMs without risking account bans. Clicking a button copies the AI message to your clipboard and opens the business profile in a new tab for 1-click pasting.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading social prospects...</div>
      ) : leads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No social leads found. Run lead discovery to populate FB/IG profiles.
        </div>
      ) : (
        <div className={styles.grid}>
          {leads.map((lead) => (
            <div key={lead.id} className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.title}>{lead.business_name}</div>
                  <div className={styles.subtitle}>{lead.city}, {lead.country} • {lead.niche}</div>
                </div>
              </div>

              {/* DM Preview */}
              <div className={styles.msgBox}>
                {lead.ai_analysis?.fb_dm_text || lead.ai_analysis?.ig_dm_text || 'Default pitch: Hey, loved your reviews! Are you taking new website clients?'}
              </div>

              <div className={styles.platformButtons}>
                {lead.fb_url && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={copiedId === `${lead.id}-fb` ? <Check size={14} /> : <Facebook size={14} />}
                    onClick={() => handleCopyAndOpen(lead, 'fb')}
                  >
                    {copiedId === `${lead.id}-fb` ? 'Copied & Opened!' : 'Copy & Open FB'}
                  </Button>
                )}

                {lead.ig_url && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={copiedId === `${lead.id}-ig` ? <Check size={14} /> : <Instagram size={14} />}
                    onClick={() => handleCopyAndOpen(lead, 'ig')}
                  >
                    {copiedId === `${lead.id}-ig` ? 'Copied & Opened!' : 'Copy & Open IG'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
