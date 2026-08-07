'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button/Button';
import { triggerScrape } from '@/lib/api';
import { Play, CheckCircle } from 'lucide-react';
import styles from './page.module.css';

export default function SettingsPage() {
  // Scraper Manual Trigger State
  const [niche, setNiche] = useState('Dental Clinics');
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
      alert(`✅ Lead Scraping Job Completed!\n\nSuccessfully generated ${res.total_new || limit} target leads for "${niche}" in ${city}, ${country}.\n\nGo to the 'Lead CRM Workspace' tab to view your leads!`);
    } catch (err: any) {
      alert(`Error triggering job: ${err.message}`);
    } finally {
      setScraping(false);
    }
  };

  return (
    <>
      <Header title="Settings & Lead Scraper Control" />
      <div className={styles.container}>
        {/* Manual Scraper Trigger */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Lead Scraper Engine</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
            Specify your target business category, city, and lead limit. The system will search Google Maps and extract zero-website & high-opportunity prospects.
          </p>
          <form onSubmit={handleManualScrape}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Lead Source Provider</label>
              <select className={styles.input} value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="outscraper">Outscraper (Google Maps Scraper)</option>
                <option value="apify">Apify (No-Website Business Finder)</option>
                <option value="free_built_in">Free Built-in Smart Lead Scraper</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Niche / Business Category</label>
              <input type="text" className={styles.input} value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. Dental Clinics, Plumbers, Auto Detailing" required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Target City</label>
              <input type="text" className={styles.input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Austin, London, Dubai" required />
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
              <label className={styles.label}>Requested Lead Limit</label>
              <input type="number" className={styles.input} value={limit} onChange={(e) => setLimit(Number(e.target.value))} min={10} max={100} />
            </div>

            <Button type="submit" variant="primary" icon={scraping ? <CheckCircle size={16} /> : <Play size={16} />} disabled={scraping}>
              {scraping ? 'Extracting Leads...' : `Start Scraping (${limit} Leads)`}
            </Button>
          </form>
        </div>

        {/* API Configurations */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>API System Architecture</h2>
          <div className={styles.formGroup}>
            <label className={styles.label}>Active API Mode</label>
            <input type="text" className={styles.input} value="Native Next.js Serverless Edge Cloud" readOnly />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            System runs 100% natively on Vercel Serverless Edge network with zero external server requirements.
          </p>
        </div>
      </div>
    </>
  );
}
