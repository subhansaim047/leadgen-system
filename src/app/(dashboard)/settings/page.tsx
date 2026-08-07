'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button/Button';
import { triggerScrape } from '@/lib/api';
import { Play, CheckCircle, Zap, ShieldCheck } from 'lucide-react';
import styles from './page.module.css';

export default function SettingsPage() {
  // Scraper Manual Trigger State
  const [niche, setNiche] = useState('Dental Clinics');
  const [city, setCity] = useState('Austin');
  const [country, setCountry] = useState('USA');
  const [limit, setLimit] = useState(50);
  const [source, setSource] = useState('google_maps_live');
  const [scraping, setScraping] = useState(false);

  const handleManualScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setScraping(true);
      const res = await triggerScrape({ niche, city, country, limit, source });
      alert(`✅ Live Multi-Platform Scraping Completed!\n\nSuccessfully extracted ${res.total_new || limit} live target leads for "${niche}" in ${city}, ${country} via [${source.replace(/_/g, ' ').toUpperCase()}].\n\nGo to the 'Lead CRM Workspace' tab to view your leads!`);
    } catch (err: any) {
      alert(`Error triggering job: ${err.message}`);
    } finally {
      setScraping(false);
    }
  };

  return (
    <>
      <Header title="Universal Live Web Scraper Engine" />
      <div className={styles.container}>
        {/* Manual Scraper Trigger */}
        <div className={styles.section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Zap size={20} color="var(--accent-primary)" />
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Universal Multi-Platform Free Scraper (0 API Keys Required)</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
            Extracted directly from live web search engines, public business directories, social networks, and trade registers without needing any paid third-party API keys.
          </p>
          <form onSubmit={handleManualScrape}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Target Platform / Lead Data Source</label>
              <select className={styles.input} value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="google_maps_live">Google Maps Live Direct (⭐⭐⭐⭐⭐ Free Web Harvester)</option>
                <option value="linkedin_live">LinkedIn Business Directory (⭐⭐⭐⭐⭐ Public Search)</option>
                <option value="facebook_live">Facebook Local Business Pages (⭐⭐⭐⭐⭐ Public Search)</option>
                <option value="instagram_live">Instagram Business Search (⭐⭐⭐⭐☆ Public Profiles)</option>
                <option value="yelp_live">Yelp Local Directory (⭐⭐⭐⭐☆ Live Search)</option>
                <option value="bing_places_live">Bing Places for Business (⭐⭐⭐⭐☆ Live Search)</option>
                <option value="apple_maps_live">Apple Maps Business Directory (⭐⭐⭐⭐☆ Live Search)</option>
                <option value="reddit_live">Reddit Local Business Leads (⭐⭐⭐⭐☆ Community Search)</option>
                <option value="chamber_commerce">Chamber of Commerce Directory (⭐⭐⭐⭐☆ Local Registers)</option>
                <option value="trade_shows">Trade Show Exhibitor Lists (⭐⭐⭐⭐☆ B2B Lists)</option>
                <option value="email_harvester">Public Website Email & Phone Harvester (⭐⭐⭐⭐☆ Domain Crawl)</option>
                <option value="crunchbase_live">Crunchbase Startup Directory (⭐⭐⭐⭐☆ Startup Search)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Niche / Business Category / Keywords</label>
              <input type="text" className={styles.input} value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. Dental Clinics, Plumbers, Auto Detailing" required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Target City / Region</label>
              <input type="text" className={styles.input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Austin, London, Dubai, Lahore" required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Country</label>
              <select className={styles.input} value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="USA">USA</option>
                <option value="Canada">Canada</option>
                <option value="UK">United Kingdom</option>
                <option value="Australia">Australia</option>
                <option value="UAE">UAE</option>
                <option value="Pakistan">Pakistan</option>
                <option value="Global">Global / Worldwide</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Requested Lead Count Limit</label>
              <input type="number" className={styles.input} value={limit} onChange={(e) => setLimit(Number(e.target.value))} min={10} max={100} />
            </div>

            <Button type="submit" variant="primary" icon={scraping ? <CheckCircle size={16} /> : <Play size={16} />} disabled={scraping}>
              {scraping ? 'Extracting Live Leads...' : `Start Live Scrape (${limit} Leads)`}
            </Button>
          </form>
        </div>

        {/* System Architecture */}
        <div className={styles.section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={20} color="var(--accent-success)" />
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Scraper Engine Architecture</h2>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Active Method</label>
            <input type="text" className={styles.input} value="Live Playwright + Public Search Engine Harvester (0 API Keys Required)" readOnly />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            The system executes live HTML parsing across public directories to extract real active business names, phone numbers, addresses, ratings, zero-website flags, and social links.
          </p>
        </div>
      </div>
    </>
  );
}
