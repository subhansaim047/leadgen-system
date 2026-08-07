'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button/Button';
import { triggerScrape } from '@/lib/api';
import { Save, Play, Key, Target } from 'lucide-react';
import styles from './page.module.css';

export default function SettingsPage() {
  // Scraper Manual Trigger State
  const [niche, setNiche] = useState('Auto Detailing');
  const [city, setCity] = useState('Austin');
  const [country, setCountry] = useState('USA');
  const [limit, setLimit] = useState(50);
  const [source, setSource] = useState('outscraper');
  const [scraping, setScraping] = useState(false);

  const handleManualScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setScraping(true);
      const res = await triggerScrape({ niche, city, country, limit, source });
      alert(`Scraping job queued! Job ID: ${res.job_id}`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setScraping(false);
    }
  };

  return (
    <>
      <Header title="Settings & Manual Job Triggers" />
      <div className={styles.container}>
        {/* Manual Scraper Trigger */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Manual Lead Scraper Trigger</h2>
          <form onSubmit={handleManualScrape}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Lead Source Provider</label>
              <select className={styles.input} value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="outscraper">Outscraper (Google Maps)</option>
                <option value="apify">Apify (Pre-filtered No Website)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Niche / Category</label>
              <input type="text" className={styles.input} value={niche} onChange={(e) => setNiche(e.target.value)} required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>City</label>
              <input type="text" className={styles.input} value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Country</label>
              <select className={styles.input} value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="USA">USA</option>
                <option value="Canada">Canada</option>
                <option value="UK">United Kingdom</option>
                <option value="Australia">Australia</option>
                <option value="UAE">UAE</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Lead Count Limit</label>
              <input type="number" className={styles.input} value={limit} onChange={(e) => setLimit(Number(e.target.value))} min={10} max={200} />
            </div>

            <Button type="submit" variant="primary" icon={<Play size={16} />} disabled={scraping}>
              {scraping ? 'Triggering Job...' : 'Start Lead Scraping Job'}
            </Button>
          </form>
        </div>

        {/* API Configurations */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Active API Integration Status</h2>
          <div className={styles.formGroup}>
            <label className={styles.label}>Backend Service Endpoint</label>
            <input type="text" className={styles.input} value={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'} readOnly />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            API keys (OpenAI, Outscraper, ZeroBounce, Smartlead) are securely loaded from your VPS <code>.env</code> file.
          </p>
        </div>
      </div>
    </>
  );
}
