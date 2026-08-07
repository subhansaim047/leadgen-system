'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button/Button';
import { fetchLeads, updateLeadStatus } from '@/lib/api';
import { Lead } from '@/types';
import { Facebook, Instagram, Mail, Check, Search } from 'lucide-react';
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

  const handleCopyAndSearch = async (lead: Lead, platform: 'fb' | 'ig') => {
    const text = lead.ai_analysis?.social_dm_text || 
      lead.ai_analysis?.fb_dm_text || 
      lead.ai_analysis?.ig_dm_text || 
      `Hey ${lead.business_name}! 👋\n\nAwesome work on your ${lead.niche} services.\n\nI noticed you don't have a dedicated website...`;

    // Clean username without spaces + fb or insta (No location)
    const cleanUsername = lead.business_name.replace(/[^a-zA-Z0-9]/g, '');
    const suffix = platform === 'fb' ? 'fb' : 'insta';
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${cleanUsername} ${suffix}`)}`;

    // 1. Copy Saim outreach message to clipboard
    await navigator.clipboard.writeText(text);
    setCopiedId(`${lead.id}-${platform}`);

    // 2. Update status to contacted
    try {
      await updateLeadStatus(lead.id, 'contacted', `DM copied & Google Search launched for ${cleanUsername} ${suffix}`);
    } catch (err) {
      console.error(err);
    }

    // 3. Open Google Search tab
    window.open(googleSearchUrl, '_blank');

    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleOpenMailto = (lead: Lead) => {
    const subject = encodeURIComponent(lead.ai_analysis?.cold_email_subject || `FREE demo website for ${lead.business_name}`);
    const body = encodeURIComponent(lead.ai_analysis?.cold_email_body || `Hey ${lead.business_name}! 👋\n\nAwesome work on your ${lead.niche} services...`);
    window.open(`mailto:info@${lead.business_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <>
      <Header title="1-Click Social DM Hub" onRefresh={loadSocialLeads} />
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
        Clicking FB or IG copies your personalized outreach pitch to your clipboard and launches a Google Search for <strong>[username_without_spaces] fb</strong> or <strong>[username_without_spaces] insta</strong>.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading social prospects...</div>
      ) : leads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No leads found in CRM. Trigger a job from Settings to populate target leads!
        </div>
      ) : (
        <div className={styles.grid}>
          {leads.map((lead) => {
            const cleanUser = lead.business_name.replace(/[^a-zA-Z0-9]/g, '');
            return (
              <div key={lead.id} className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className={styles.cardHeader}>
                    <div>
                      <div className={styles.title}>{lead.business_name}</div>
                      <div className={styles.subtitle}>{lead.city}, {lead.country} • {lead.niche}</div>
                    </div>
                  </div>

                  {/* DM Preview */}
                  <div className={styles.msgBox} style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', fontSize: '13px', margin: '12px 0', borderLeft: '3px solid var(--accent-primary)', whiteSpace: 'pre-line' }}>
                    {lead.ai_analysis?.social_dm_text || `Hey ${lead.business_name}! 👋 Awesome work on your ${lead.niche}...`}
                  </div>
                </div>

                <div className={styles.platformButtons} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={copiedId === `${lead.id}-fb` ? <Check size={14} /> : <Facebook size={14} />}
                    onClick={() => handleCopyAndSearch(lead, 'fb')}
                  >
                    {copiedId === `${lead.id}-fb` ? 'Copied & Searching FB!' : `Copy & Search "${cleanUser} fb"`}
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    icon={copiedId === `${lead.id}-ig` ? <Check size={14} /> : <Instagram size={14} />}
                    onClick={() => handleCopyAndSearch(lead, 'ig')}
                  >
                    {copiedId === `${lead.id}-ig` ? 'Copied & Searching IG!' : `Copy & Search "${cleanUser} insta"`}
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
            );
          })}
        </div>
      )}
    </>
  );
}
