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

  const handleCopyAndOpenDirect = async (lead: Lead, platform: 'fb' | 'ig') => {
    const text = lead.ai_analysis?.social_dm_text || 
      lead.ai_analysis?.fb_dm_text || 
      lead.ai_analysis?.ig_dm_text || 
      `Hey ${lead.business_name}! 👋\n\nAwesome work on your ${lead.niche} services.\n\nI noticed you don't have a dedicated website...`;

    // Direct Facebook Page Search URL (opens directly inside Facebook web/app)
    const fbDirectUrl = lead.fb_url && lead.fb_url.includes('facebook.com/') && !lead.fb_url.includes('search')
      ? lead.fb_url
      : `https://www.facebook.com/search/pages/?q=${encodeURIComponent(`${lead.business_name} ${lead.city}`)}`;

    // Direct Instagram Profile Search URL (opens directly inside Instagram web/app)
    const igDirectUrl = lead.ig_url && lead.ig_url.includes('instagram.com/') && !lead.ig_url.includes('search')
      ? lead.ig_url
      : `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(`${lead.business_name} ${lead.city}`)}`;

    const targetUrl = platform === 'fb' ? fbDirectUrl : igDirectUrl;

    // 1. Copy Saim outreach message to clipboard
    await navigator.clipboard.writeText(text);
    setCopiedId(`${lead.id}-${platform}`);

    // 2. Update status to contacted
    try {
      await updateLeadStatus(lead.id, 'contacted', `Direct ${platform.toUpperCase()} profile launched`);
    } catch (err) {
      console.error(err);
    }

    // 3. Open direct Facebook or Instagram profile search in new tab
    window.open(targetUrl, '_blank');

    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleOpenMailto = (lead: Lead) => {
    const subject = encodeURIComponent(lead.ai_analysis?.cold_email_subject || `FREE demo website for ${lead.business_name}`);
    const body = encodeURIComponent(lead.ai_analysis?.cold_email_body || `Hey ${lead.business_name}! 👋\n\nAwesome work on your ${lead.niche} services...`);
    window.open(`mailto:info@${lead.business_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <>
      <Header title="1-Click Direct Social DM Hub" onRefresh={loadSocialLeads} />
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
        1-Click Direct Social Messaging Engine. Clicking FB or IG copies your personalized outreach pitch to your clipboard and opens the business profile page directly inside Facebook and Instagram.
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
                <div className={styles.msgBox} style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', fontSize: '13px', margin: '12px 0', borderLeft: '3px solid var(--accent-primary)', whiteSpace: 'pre-line' }}>
                  {lead.ai_analysis?.social_dm_text || `Hey ${lead.business_name}! 👋 Awesome work on your ${lead.niche}...`}
                </div>
              </div>

              <div className={styles.platformButtons} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={copiedId === `${lead.id}-fb` ? <Check size={14} /> : <Facebook size={14} />}
                  onClick={() => handleCopyAndOpenDirect(lead, 'fb')}
                >
                  {copiedId === `${lead.id}-fb` ? 'Copied & Opening FB!' : 'Copy & Open FB Profile'}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={copiedId === `${lead.id}-ig` ? <Check size={14} /> : <Instagram size={14} />}
                  onClick={() => handleCopyAndOpenDirect(lead, 'ig')}
                >
                  {copiedId === `${lead.id}-ig` ? 'Copied & Opening IG!' : 'Copy & Open IG Profile'}
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
