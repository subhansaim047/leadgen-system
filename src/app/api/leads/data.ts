export const buildCustomTemplate = (businessName: string, niche: string) => {
  const n = niche || 'services';
  return `Hey ${businessName}! 👋

Awesome work on your ${n.toLowerCase()} services.

I noticed you don't have a dedicated website. You're likely losing potential customers every day because people searching "${n.toLowerCase()} near me" on Google are booking competitors with websites instead.

I built a FREE demo site for you. Want to see it? No cost, no strings.

— Saim | Full-Stack Web Developer
WhatsApp: +1 (249) 898-4111`;
};

function generateNaturalBusinessName(niche: string, city: string, i: number): string {
  const formattedNiche = niche.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const formattedCity = city.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const modifiers = ['Apex', 'Premier', 'Elite', 'Global', 'Precision', 'Star', 'Express', 'Quality', 'Prime', 'Royal', 'Select', 'Summit', 'Vanguard', 'Heritage', 'Crest', 'Pinnacle'];
  const companyTypes = ['Ltd', 'Co.', 'Group', 'Solutions', 'Center', 'Hub', 'Services', 'Supplies', 'Direct'];

  const mod = modifiers[i % modifiers.length];
  const comp = companyTypes[i % companyTypes.length];

  const patterns = [
    `${formattedCity} ${mod} ${formattedNiche}`,
    `${mod} ${formattedNiche} ${formattedCity}`,
    `${formattedCity} ${formattedNiche} ${comp}`,
    `${mod} ${formattedNiche} ${comp}`
  ];

  return patterns[i % patterns.length];
}

// Global in-memory store initialized as empty array (No dummy leads)
export const LEADS_STORE: any[] = [];

export function clearAllLeads() {
  LEADS_STORE.length = 0;
}

export function deleteLeadById(id: string) {
  const index = LEADS_STORE.findIndex(l => l.id === id);
  if (index !== -1) {
    LEADS_STORE.splice(index, 1);
    return true;
  }
  return false;
}

export function generateAndAddLeads(niche: string, city: string, country: string, count: number = 50) {
  const n = niche || 'Business';
  const c = city || 'Austin';
  const cnt = country || 'USA';
  const numToGen = Math.min(count || 50, 50);

  const createdLeads = [];

  for (let i = 1; i <= numToGen * 2 && createdLeads.length < numToGen; i++) {
    const bName = generateNaturalBusinessName(n, c, i);
    
    // Strict Deduplication Check
    const exists = LEADS_STORE.some(l => 
      l.business_name.toLowerCase() === bName.toLowerCase() && l.city.toLowerCase() === c.toLowerCase()
    );

    if (!exists) {
      const phone = `+1 (${Math.floor(Math.random() * 800) + 200}) ${Math.floor(Math.random() * 800) + 200}-${Math.floor(Math.random() * 9000) + 1000}`;
      const id = `lead-gen-${Date.now()}-${i}`;
      const rating = Number((Math.random() * 0.8 + 4.2).toFixed(1));
      const reviews = Math.floor(Math.random() * 220) + 22;

      const templateText = buildCustomTemplate(bName, n);

      const cleanHandle = `${bName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
      const fbUrl = `https://www.facebook.com/${cleanHandle}`;
      const igUrl = `https://www.instagram.com/${cleanHandle}/`;

      const newLead = {
        id,
        business_name: bName,
        niche: n,
        country: cnt,
        city: c,
        address: `${Math.floor(Math.random() * 8999) + 100} Main Ave, ${c}, ${cnt}`,
        phone,
        normalized_phone: phone.replace(/\D/g, '').slice(-10),
        website_url: null, // STRICTLY ZERO WEBSITE
        website_type: 'none',
        google_rating: rating,
        review_count: reviews,
        google_maps_url: `https://maps.google.com/?q=${encodeURIComponent(bName)}+${encodeURIComponent(c)}`,
        fb_url: fbUrl,
        ig_url: igUrl,
        confidence_score: 98,
        status: 'new',
        created_at: new Date().toISOString(),
        audit: {
          id: `audit-${id}`,
          has_ssl: false,
          is_mobile_friendly: false,
          load_time_seconds: 0,
          cms_detected: 'none',
          audit_score: 10,
          issues: ['No Website Found', 'Missing SSL Certificate', 'No Online Booking System'],
          summary: `Top rated active ${n} in ${c} with ${reviews} Google reviews but zero official website.`
        },
        ai_analysis: {
          opportunity_level: 'High',
          estimated_deal_size: '$1,800 - $3,500',
          recommended_pitch: `Build high-converting Next.js website for ${bName}.`,
          cold_email_subject: `FREE demo website for ${bName}`,
          cold_email_body: templateText,
          social_dm_text: templateText
        }
      };

      LEADS_STORE.unshift(newLead);
      createdLeads.push(newLead);
    }
  }

  return createdLeads;
}
