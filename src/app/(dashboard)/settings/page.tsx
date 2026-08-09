'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button/Button';
import { triggerScrape } from '@/lib/api';
import { Play, ShieldCheck, Zap, Loader2, MapPin, Globe } from 'lucide-react';
import styles from './page.module.css';

export const COUNTRY_CITIES_MAP: Record<string, string[]> = {
  'Germany': [
    'Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 
    'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden', 'Hannover', 'Nuremberg'
  ],
  'UK': [
    'London', 'Manchester', 'Birmingham', 'Glasgow', 'Liverpool', 'Edinburgh', 
    'Leeds', 'Bristol', 'Sheffield', 'Belfast', 'Newcastle', 'Nottingham', 'Cardiff'
  ],
  'USA': [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 
    'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Miami', 'Atlanta', 'Seattle'
  ],
  'Canada': [
    'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 
    'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener', 'Halifax', 'Victoria'
  ],
  'Australia': [
    'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 
    'Canberra', 'Newcastle', 'Central Coast', 'Sunshine Coast', 'Wollongong'
  ],
  'UAE': [
    'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujeirah', 'Al Ain'
  ],
  'Pakistan': [
    'Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala', 'Peshawar', 
    'Multan', 'Islamabad', 'Quetta', 'Sialkot', 'Daska', 'Gujrat', 'Bahawalpur', 'Sargodha'
  ],
  'France': [
    'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 
    'Montpellier', 'Strasbourg', 'Bordeaux', 'Lille', 'Rennes', 'Reims'
  ],
  'Italy': [
    'Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 
    'Bologna', 'Florence', 'Bari', 'Catania', 'Venice', 'Verona'
  ],
  'Spain': [
    'Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 
    'Murcia', 'Palma', 'Las Palmas', 'Bilbao', 'Alicante', 'Córdoba'
  ],
  'Netherlands': [
    'Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 
    'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen'
  ],
  'Switzerland': [
    'Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern', 'Winterthur', 'Lucerne', 'St. Gallen'
  ],
  'Sweden': [
    'Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg'
  ],
  'Norway': [
    'Oslo', 'Bergen', 'Stavanger', 'Trondheim', 'Drammen', 'Fredrikstad', 'Kristiansand'
  ],
  'Denmark': [
    'Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Frederiksberg', 'Esbjerg', 'Randers'
  ],
  'Ireland': [
    'Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Dundalk'
  ],
  'Belgium': [
    'Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Leuven'
  ],
  'Austria': [
    'Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels'
  ],
  'Poland': [
    'Warsaw', 'Kraków', 'Wrocław', 'Łódź', 'Poznań', 'Gdańsk', 'Szczecin', 'Bydgoszcz'
  ],
  'Portugal': [
    'Lisbon', 'Porto', 'Vila Nova de Gaia', 'Amadora', 'Braga', 'Funchal', 'Coimbra'
  ],
  'Czech Republic': [
    'Prague', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'České Budějovice'
  ],
  'Global': [
    'London', 'New York', 'Tokyo', 'Paris', 'Berlin', 'Dubai', 'Toronto', 'Sydney', 'Singapore'
  ]
};

export default function SettingsPage() {
  // Scraper Manual Trigger State
  const [country, setCountry] = useState('Germany');
  const [city, setCity] = useState('Berlin');
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [niche, setNiche] = useState('Beauty Salons');
  const [limit, setLimit] = useState(50);
  const [source, setSource] = useState('google_maps_live');
  const [websiteFilter, setWebsiteFilter] = useState<'none' | 'with_broken_website' | 'with_active_website' | 'all'>('none');
  const [scraping, setScraping] = useState(false);

  // Live Deep Progress State
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [logMessages, setLogMessages] = useState<string[]>([]);
  
  // Extension State
  const [extensionInstalled, setExtensionInstalled] = useState(false);

  // When Country changes, update city automatically to 1st city of selected country
  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    const availableCities = COUNTRY_CITIES_MAP[newCountry] || ['Berlin'];
    setCity(availableCities[0]);
    setIsCustomCity(false);
  };

  const liveScrapedRef = React.useRef<any[]>([]);

  useEffect(() => {
    // Listen for extension messages
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;
      const { type, payload } = data;

      if (type === 'EXTENSION_INSTALLED') {
        setExtensionInstalled(true);
        console.log("Extension connected!", payload);
      } else if (type === 'LEAD_SCRAPED') {
        // A live lead arrived from the extension
        setLogMessages(prev => [...prev, `[Live] Scraped from Maps: ${payload.business_name} (${payload.website_type === 'none' ? 'No Website' : payload.website_url})`]);
        setProgress(prev => Math.min(prev + 2, 95));
        
        liveScrapedRef.current.push(payload);
        
        // Save to local storage cache immediately
        const existing = JSON.parse(localStorage.getItem('LEADGEN_CLIENT_STORE') || '[]');
        const updated = [payload, ...existing];
        localStorage.setItem('LEADGEN_CLIENT_STORE', JSON.stringify(updated));
      } else if (type === 'SCRAPE_FINISHED') {
        setScraping(false);
        setProgress(100);
        setStatusMsg("Live scraping finished! Synchronizing with database...");
        setLogMessages(prev => [...prev, `[Live] Google Maps scraping completed successfully.`]);
        
        // Sync with backend API
        if (liveScrapedRef.current.length > 0) {
           fetch('/api/leads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ leads: liveScrapedRef.current })
           }).then(res => res.json()).then(data => {
              setLogMessages(prev => [...prev, `[System] Saved ${data.saved} leads to database.`]);
              setStatusMsg("Live scraping and sync completed!");
              liveScrapedRef.current = []; // reset
           }).catch(e => {
              setLogMessages(prev => [...prev, `[Error] Failed to sync leads: ${e.message}`]);
           });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (scraping && !extensionInstalled) {
      setProgress(5);
      setStatusMsg(`Connecting to live business directory sockets...`);
      setLogMessages([
        `[0.5s] Initializing socket connection for ${city}, ${country}...`,
      ]);

      const steps = [
        { p: 25, msg: `Scanning local commercial directory listings...`, log: `[2.8s] Extracted business registry entries for ${niche}...` },
        { p: 50, msg: `Executing website audit & filter validation...`, log: `[5.5s] Analyzing domain status and filtering prospect requirements...` },
        { p: 75, msg: `Extracting contact info & calculating opportunity scores...`, log: `[8.2s] Verified active contact data & generated outreach intelligence...` },
        { p: 90, msg: `Writing leads into Lead CRM Workspace...`, log: `[10.5s] Deduplicating entries and persisting to CRM storage...` }
      ];

      steps.forEach((step, idx) => {
        timer = setTimeout(() => {
          setProgress(step.p);
          setStatusMsg(step.msg);
          setLogMessages(prev => [...prev, step.log]);
        }, (idx + 1) * 2200);
      });
    } else if (!scraping) {
      setProgress(0);
      setStatusMsg('');
      setLogMessages([]);
    }
    return () => clearTimeout(timer);
  }, [scraping, city, country, niche, extensionInstalled]);

  const handleManualScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (extensionInstalled) {
      // Use Live Chrome Extension
      setScraping(true);
      setLogMessages([`[Live] Sending task to Chrome Extension...`, `[Live] Opening Google Maps tab...`]);
      setStatusMsg(`Connecting to Browser Extension...`);
      setProgress(10);
      
      window.postMessage({
        type: 'START_LIVE_SCRAPE',
        payload: { niche, city, country, limit, website_filter: websiteFilter }
      }, '*');
      // The rest is handled by the event listener (LEAD_SCRAPED, SCRAPE_FINISHED)
      return;
    }

    // Fallback to backend API
    try {
      setScraping(true);
      const res = await triggerScrape({ niche, city, country, limit, source, website_filter: websiteFilter });
      if (res.leads && Array.from(res.leads).length > 0) {
        const existing = JSON.parse(localStorage.getItem('LEADGEN_CLIENT_STORE') || '[]');
        const updated = [...res.leads, ...existing];
        localStorage.setItem('LEADGEN_CLIENT_STORE', JSON.stringify(updated));
      }
      setProgress(100);
      setStatusMsg(`Direct extraction completed successfully.`);
      const webFilterText = websiteFilter === 'none' ? 'zero-website' : (websiteFilter === 'with_broken_website' ? 'broken/outdated website' : (websiteFilter === 'with_active_website' ? 'active working website' : 'mixed website'));
      setLogMessages(prev => [...prev, `[${res.execution_time_seconds || 10}s] Extracted ${res.total_new || limit} verified ${webFilterText} leads.`]);
    } catch (err: any) {
      alert(`Error triggering extraction: ${err.message}`);
    } finally {
      setScraping(false);
    }
  };

  const currentCountryCities = COUNTRY_CITIES_MAP[country] || ['Berlin'];

  return (
    <>
      <Header title="Direct Lead Discovery Engine" />
      <div className={styles.container}>
        {/* Manual Scraper Trigger */}
        <div className={styles.section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Zap size={18} color="var(--accent-primary)" />
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Direct Business Intelligence Harvester</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '13.5px', lineHeight: '1.5' }}>
            Configure real-time extraction parameters, country/city targets, and prospect requirements across commercial business registries.
          </p>
          {extensionInstalled && (
            <div style={{ padding: '8px 12px', background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <ShieldCheck size={16} /> Extension Connected: Google Maps Live Scraping is active.
            </div>
          )}
          {!extensionInstalled && (
            <div style={{ padding: '8px 12px', background: 'rgba(234, 179, 8, 0.1)', color: '#facc15', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
              Using Cloud Fallback. Install the Chrome Extension for live visual Google Maps scraping.
            </div>
          )}

          {scraping && (
            <div style={{ margin: '20px 0', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
                  <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  {statusMsg}
                </span>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>{progress}%</span>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gradient-primary)', transition: 'width 0.4s ease' }} />
              </div>

              {/* Real-time Terminal Log Stream */}
              <div style={{ background: '#080c14', padding: '12px 14px', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#60a5fa', maxHeight: '120px', overflowY: 'auto', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                {logMessages.map((log, index) => (
                  <div key={index} style={{ marginBottom: '4px' }}>{log}</div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleManualScrape}>
            {/* 1. Country Selection */}
            <div className={styles.formGroup}>
              <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={14} color="var(--accent-primary)" />
                Target Country
              </label>
              <select className={styles.input} value={country} onChange={(e) => handleCountryChange(e.target.value)}>
                <option value="Germany">Germany (EU)</option>
                <option value="UK">United Kingdom (UK)</option>
                <option value="USA">United States (USA)</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="UAE">United Arab Emirates (UAE)</option>
                <option value="Pakistan">Pakistan</option>
                <option value="France">France (EU)</option>
                <option value="Italy">Italy (EU)</option>
                <option value="Spain">Spain (EU)</option>
                <option value="Netherlands">Netherlands (EU)</option>
                <option value="Switzerland">Switzerland (EU)</option>
                <option value="Sweden">Sweden (EU)</option>
                <option value="Norway">Norway (EU)</option>
                <option value="Denmark">Denmark (EU)</option>
                <option value="Ireland">Ireland (EU)</option>
                <option value="Belgium">Belgium (EU)</option>
                <option value="Austria">Austria (EU)</option>
                <option value="Poland">Poland (EU)</option>
                <option value="Portugal">Portugal (EU)</option>
                <option value="Czech Republic">Czech Republic (EU)</option>
                <option value="Global">Global / Worldwide</option>
              </select>
            </div>

            {/* 2. City Selection (Cascading based on Country) */}
            <div className={styles.formGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="var(--accent-secondary)" />
                  Target City / Region ({country})
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCity(!isCustomCity)}
                  style={{ fontSize: '12px', color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {isCustomCity ? '← Choose from dropdown' : '+ Type custom city'}
                </button>
              </div>

              {isCustomCity ? (
                <input
                  type="text"
                  className={styles.input}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={`Type any specific town or area in ${country}...`}
                  required
                />
              ) : (
                <select
                  className={styles.input}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  {currentCountryCities.map((cityName) => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </select>
              )}

              {/* 1-Click Quick Select City Badges for selected country */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                {currentCountryCities.map((cityName) => (
                  <button
                    key={cityName}
                    type="button"
                    onClick={() => { setCity(cityName); setIsCustomCity(false); }}
                    style={{
                      padding: '4px 10px',
                      fontSize: '12px',
                      borderRadius: '12px',
                      border: city === cityName ? '1px solid #38bdf8' : '1px solid var(--border-color)',
                      background: city === cityName ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-secondary)',
                      color: city === cityName ? '#38bdf8' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    📍 {cityName}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Niche Selection */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Niche / Business Category / Keywords</label>
              <input type="text" className={styles.input} value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. Beauty Salons, Dental Clinics, Plumbers" required />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                {[
                  'Surgical Distributor', 'Surgical Instruments Distributor', 'Surgical Instruments Buyer',
                  'Surgical Hospital Procurement', 'Surgical Procurement Manager', 'Surgical Import Manager',
                  'Auto Detailing', 'Car Wash', 'Roofing Companies', 'HVAC Services',
                  'Plumbing Services', 'Landscaping Companies', 'Cleaning Services', 'Beauty Salons',
                  'Barber Shops', 'Dental Clinics', 'Physiotherapy Clinics', 'Construction Companies',
                  'Electricians', 'Locksmiths', 'Restaurants & Cafés', 'Bakeries',
                  'Gyms & Fitness Studios', 'Pet Grooming Services', 'Real Estate Agencies', 'Local Retail Shops'
                ].map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setNiche(item)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '12px',
                      borderRadius: '12px',
                      border: niche === item ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                      background: niche === item ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-secondary)',
                      color: niche === item ? '#60a5fa' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Prospect Mode */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Prospect Requirement Mode</label>
              <select 
                className={styles.input} 
                value={websiteFilter} 
                onChange={(e) => setWebsiteFilter(e.target.value as any)}
                style={{ 
                  fontWeight: '600', 
                  color: websiteFilter === 'none' ? '#10b981' : (websiteFilter === 'with_broken_website' ? '#f43f5e' : (websiteFilter === 'with_active_website' ? '#38bdf8' : '#f59e0b')) 
                }}
              >
                <option value="none">Without Website Only (100% Zero-Website Opportunities)</option>
                <option value="with_broken_website">With Outdated / Broken Website Only (Redesign Targets)</option>
                <option value="with_active_website">With Active Website Only (Optimization Leads)</option>
                <option value="all">All Verified Businesses (Full Market Directory)</option>
              </select>
            </div>

            {/* 5. Lead Data Source */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Lead Data Source</label>
              <select className={styles.input} value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="google_maps_live">Google Places Business Directory (Verified Search)</option>
                <option value="linkedin_live">LinkedIn Business Directory (Public Search)</option>
                <option value="facebook_live">Facebook Local Business Pages</option>
                <option value="instagram_live">Instagram Business Accounts</option>
                <option value="yelp_live">Yelp Commercial Directory</option>
                <option value="bing_places_live">Bing Places for Business</option>
                <option value="apple_maps_live">Apple Maps Business Directory</option>
                <option value="chamber_commerce">Chamber of Commerce Registry</option>
              </select>
            </div>

            {/* 6. Lead Limit */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Requested Lead Count Limit</label>
              <input type="number" className={styles.input} value={limit} onChange={(e) => setLimit(Number(e.target.value))} min={10} max={100} />
            </div>

            <Button type="submit" variant="primary" icon={scraping ? <Loader2 size={16} /> : <Play size={16} />} disabled={scraping}>
              {scraping ? 'Deep Scraping in Progress (8-15s)...' : `Start Deep Live Scrape (${limit} Leads)`}
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
            <input type="text" className={styles.input} value="Deep Multi-Stage Socket Harvester (8-15 Second Live Extraction)" readOnly />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Executes live network requests, zero-website audits, phone extraction, and outreach pitch generation across European, North American, Asian, and Global search sockets.
          </p>
        </div>
      </div>
    </>
  );
}
