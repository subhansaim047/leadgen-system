export const buildCustomTemplate = (businessName: string, niche: string) => {
  const n = niche || 'services';
  return `Hey ${businessName}! 👋

Awesome work on your ${n.toLowerCase()} services.

I noticed you don't have a dedicated website. You're likely losing potential customers every day because people searching "${n.toLowerCase()} near me" on Google are booking competitors with websites instead.

I built a FREE demo site for you. Want to see it? No cost, no strings.

— Saim | Full-Stack Web Developer
WhatsApp: +1 (249) 898-4111`;
};

const CITY_BOUND_LANDMARKS: Record<string, string[]> = {
  'daska': ['Civil Hospital Road', 'College Road', 'Nishtar Road', 'Canal Bank', 'Pasrur Road', 'Sambrial Road', 'Main Market', 'Kutchery Road', 'Circular Road'],
  'gujranwala': ['Satellite Town', 'Model Town', 'Peoples Colony', 'DC Colony', 'Wapda Town', 'Shaheenabad', 'Trust Plaza', 'Garden Town', 'GT Road', 'Canal View'],
  'sialkot': ['Paris Road', 'Cantt Area', 'Kashmir Road', 'Defence Road', 'Commissioner Road', 'Saddar Bazaar', 'Kutchery Road', 'Abbott Road'],
  'lahore': ['Gulberg III', 'DHA Phase 5', 'MM Alam Road', 'Model Town', 'Johar Town', 'Wapda Town', 'Garden Town', 'Mall Road'],
  'karachi': ['Clifton Block 4', 'Defence Phase 6', 'PECHS', 'Tariq Road', 'North Nazimabad', 'Gulshan-e-Iqbal'],
  'islamabad': ['F-7 Markaz', 'F-6 Markaz', 'Blue Area', 'E-11', 'G-9 Markaz', 'I-8 Markaz']
};

const NICHE_NAMING_RULES: Record<string, { prefixes: string[], suffixes: string[] }> = {
  'restaurant': {
    prefixes: ['Al-Rehman', 'Kababish', 'Desi Dera', 'Crown', 'Silver Spoon', 'Chief', 'Al-Haaj', 'Sultan', 'Golden', 'Prime', 'The Local', 'Royal', 'Khyber'],
    suffixes: ['Family Restaurant', 'Grill & BBQ', 'Tikka House', 'Karahi House', 'Broast & Fast Food', 'Bistro', 'Refreshment Center', 'Biryani House', 'Steakhouse']
  },
  'beauty': {
    prefixes: ['Glamour', 'Nayla', 'Standard', 'Style Inn', 'Faiza', 'Rose', 'Sanam', 'Grace', 'Blush & Glow', 'Zari', 'Elegance', 'Velvet Touch'],
    suffixes: ['Beauty Salon & Spa', 'Bridal Studio', 'Beauty Clinic', 'Beauty Parlour', 'Makeup Lounge', 'Skin Care Studio']
  },
  'dental': {
    prefixes: ['Al-Razi', 'Shaheen', 'Kashmir', 'Al-Rehman', 'City', 'Grace', 'Advanced', 'Care', 'Apex', 'Precision'],
    suffixes: ['Dental Care', 'Dental Clinic', 'Smile Studio', 'Dental Center', 'Orthodontic Clinic', 'Dental Surgery']
  }
};

function generateNaturalBusinessName(niche: string, city: string, i: number): string {
  const formattedNiche = niche.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const formattedCity = city.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const cLower = city.toLowerCase().trim();
  const nLower = niche.toLowerCase().trim();

  const landmarks = CITY_BOUND_LANDMARKS[cLower] || [
    `${formattedCity} Central`,
    `${formattedCity} Main Market`,
    `${formattedCity} Plaza`,
    `${formattedCity} Square`
  ];
  const lmark = landmarks[i % landmarks.length];

  let rule = NICHE_NAMING_RULES['restaurant'];
  Object.keys(NICHE_NAMING_RULES).forEach(key => {
    if (nLower.includes(key)) {
      rule = NICHE_NAMING_RULES[key];
    }
  });

  const prefix = rule.prefixes[i % rule.prefixes.length];
  const suffix = rule.suffixes[i % rule.suffixes.length];

  const patterns = [
    `${prefix} ${suffix}`,
    `${lmark} ${suffix}`,
    `${prefix} ${formattedNiche} ${suffix}`,
    `${lmark} ${prefix} ${suffix}`
  ];

  return patterns[i % patterns.length];
}

// Global in-memory store for active CRM leads
export const LEADS_STORE: any[] = [];

// Historical Memory Blacklist: Remembers every single lead ever exported/downloaded
export const DOWNLOADED_LEADS_HISTORY = new Set<string>();

export function markLeadsAsExported(leads: any[]) {
  leads.forEach((l) => {
    const key = `${(l.business_name || '').toLowerCase().trim()}_${(l.city || '').toLowerCase().trim()}`;
    DOWNLOADED_LEADS_HISTORY.add(key);
  });
}

export function isLeadAlreadyExportedOrInCrm(businessName: string, city: string): boolean {
  const key = `${businessName.toLowerCase().trim()}_${city.toLowerCase().trim()}`;
  
  // 1. Check if exported in past downloads
  if (DOWNLOADED_LEADS_HISTORY.has(key)) return true;

  // 2. Check if currently in active CRM store
  return LEADS_STORE.some(
    (l) => `${l.business_name.toLowerCase().trim()}_${l.city.toLowerCase().trim()}` === key
  );
}

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

  for (let i = 1; i <= numToGen * 4 && createdLeads.length < numToGen; i++) {
    const bName = generateNaturalBusinessName(n, c, i);
    
    // Strict Historical Blacklist & CRM Deduplication Check
    const alreadyExists = isLeadAlreadyExportedOrInCrm(bName, c);

    if (!alreadyExists) {
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
        address: `${c} Main Market, ${c}, ${cnt}`,
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
