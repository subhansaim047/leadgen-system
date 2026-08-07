export const buildCustomTemplate = (businessName: string, niche: string) => {
  const n = niche || 'services';
  return `Hey ${businessName}! 👋

Awesome work on your ${n.toLowerCase()} services.

I noticed you don't have a dedicated website. You're likely losing potential customers every day because people searching "${n.toLowerCase()} near me" on Google are booking competitors with websites instead.

I built a FREE demo site for you. Want to see it? No cost, no strings.

— Saim | Full-Stack Web Developer
WhatsApp: +1 (249) 898-4111`;
};

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
  const prefixes = ['Apex', 'Prime', 'Elite', 'Pro', 'Star', 'Master', 'Quality', 'Express', 'Golden', 'Precision', 'Royal', 'Ultimate', 'Select', 'Summit', 'Vanguard'];
  const suffixes = ['Services', 'Hub', 'Center', 'Group', 'Solutions', 'Co.', 'Experts', 'Clinic', 'Studio', 'Works', 'Pros', 'Specialists'];

  const n = niche || 'Business';
  const c = city || 'Austin';
  const cnt = country || 'USA';
  const numToGen = Math.min(count || 50, 50);

  const createdLeads = [];

  for (let i = 1; i <= numToGen; i++) {
    const pref = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suff = suffixes[Math.floor(Math.random() * suffixes.length)];
    const bName = `${pref} ${n.charAt(0).toUpperCase() + n.slice(1)} ${suff}`;
    
    // 70% have NO website (highest opportunity)
    const hasWebsite = Math.random() < 0.3;
    const webUrl = hasWebsite ? `http://www.${bName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : null;
    const phone = `+1 (${Math.floor(Math.random() * 800) + 200}) ${Math.floor(Math.random() * 800) + 200}-${Math.floor(Math.random() * 9000) + 1000}`;
    const id = `lead-gen-${Date.now()}-${i}`;
    const rating = Number((Math.random() * 1.2 + 3.8).toFixed(1));
    const reviews = Math.floor(Math.random() * 180) + 15;

    const templateText = buildCustomTemplate(bName, n);

    const newLead = {
      id,
      business_name: bName,
      niche: n,
      country: cnt,
      city: c,
      address: `${Math.floor(Math.random() * 8999) + 100} Main Ave, ${c}, ${cnt}`,
      phone,
      normalized_phone: phone.replace(/\D/g, '').slice(-10),
      website_url: webUrl,
      website_type: hasWebsite ? 'outdated' : 'none',
      google_rating: rating,
      review_count: reviews,
      google_maps_url: `https://maps.google.com/?q=${encodeURIComponent(bName)}+${encodeURIComponent(c)}`,
      confidence_score: hasWebsite ? 65 : 95,
      status: 'new',
      created_at: new Date().toISOString(),
      audit: {
        id: `audit-${id}`,
        has_ssl: hasWebsite ? Math.random() > 0.5 : false,
        is_mobile_friendly: hasWebsite ? Math.random() > 0.5 : false,
        load_time_seconds: hasWebsite ? Number((Math.random() * 4 + 3).toFixed(1)) : 0,
        cms_detected: hasWebsite ? 'wordpress_legacy' : 'none',
        audit_score: hasWebsite ? 35 : 12,
        issues: hasWebsite ? ['Slow Mobile Speed', 'Legacy CMS'] : ['No Website Found', 'Missing Booking System'],
        summary: hasWebsite ? `Legacy website with slow mobile load time.` : `Top rated ${n} in ${c} with ${reviews} reviews but zero website.`
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

  return createdLeads;
}
