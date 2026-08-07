export const INITIAL_LEADS = [
  {
    id: 'lead-101',
    business_name: 'Apex Dental Care',
    niche: 'Dental Clinic',
    country: 'USA',
    city: 'Austin',
    address: '1042 Colorado St, Austin, TX 78701',
    phone: '+1 (512) 555-0192',
    normalized_phone: '5125550192',
    website_url: null,
    website_type: 'none',
    google_rating: 4.8,
    review_count: 142,
    google_maps_url: 'https://maps.google.com/?q=Apex+Dental+Care+Austin',
    confidence_score: 95,
    status: 'new',
    created_at: new Date().toISOString(),
    audit: {
      id: 'audit-101',
      has_ssl: false,
      is_mobile_friendly: false,
      load_time_seconds: 0,
      cms_detected: 'none',
      audit_score: 15,
      issues: ['No Website Found', 'Missing SSL Certificate', 'No Online Booking System'],
      summary: 'High opportunity prospect: Top rated Google Maps dental clinic with 142 reviews but zero website footprint.'
    },
    ai_analysis: {
      opportunity_level: 'High',
      estimated_deal_size: '$2,500 - $4,000',
      recommended_pitch: 'Offer modern Next.js responsive website with 1-click online appointment booking system.',
      cold_email_subject: 'Quick question regarding online bookings for Apex Dental Care',
      cold_email_body: 'Hi Dr. Team,\n\nI noticed Apex Dental Care has 142 amazing 5-star Google reviews in Austin, but patients looking to book online cannot find an official website.\n\nWe build high-converting, mobile-friendly dental clinic websites with automated booking systems.\n\nWould you be open to seeing a 2-minute prototype built specifically for Apex Dental Care?',
      social_dm_text: 'Hey Apex Dental team! 👋 Noticed you have 140+ 5-star reviews in Austin but no website for online bookings. We built a quick prototype for you — mind if I drop a link here?'
    }
  },
  {
    id: 'lead-102',
    business_name: 'Pro Auto Detailing',
    niche: 'Auto Detailing',
    country: 'USA',
    city: 'Austin',
    address: '2801 E 7th St, Austin, TX 78702',
    phone: '+1 (512) 555-0481',
    normalized_phone: '5125550481',
    website_url: 'http://proautodetailingaustin.olddomain.com',
    website_type: 'outdated',
    google_rating: 4.6,
    review_count: 89,
    google_maps_url: 'https://maps.google.com/?q=Pro+Auto+Detailing+Austin',
    confidence_score: 88,
    status: 'new',
    created_at: new Date().toISOString(),
    audit: {
      id: 'audit-102',
      has_ssl: false,
      is_mobile_friendly: false,
      load_time_seconds: 6.8,
      cms_detected: 'wordpress_legacy',
      audit_score: 32,
      issues: ['Insecure HTTP', 'Fails Mobile Viewport Test', 'Slow Load Time (6.8s)'],
      summary: 'Legacy WordPress website running on HTTP with poor mobile formatting.'
    },
    ai_analysis: {
      opportunity_level: 'High',
      estimated_deal_size: '$1,800 - $3,000',
      recommended_pitch: 'Redesign website with modern dark-mode aesthetic, SSL encryption, and high speed.',
      cold_email_subject: 'Upgrading Pro Auto Detailing mobile website',
      cold_email_body: 'Hi Team,\n\nI visited your website on mobile and noticed it takes 6.8 seconds to load and displays security warnings.\n\nWe specialize in high-speed auto detailing websites that convert local Austin traffic into booked appointments.\n\nCan I send over a free 1-page modern preview?',
      social_dm_text: 'Hey Pro Auto Detailing! 🚗 Love your work in Austin. Noticed your site runs a bit slow on phones. Mind if I share a quick modern redesign preview?'
    }
  },
  {
    id: 'lead-103',
    business_name: 'Precision Plumbing Pros',
    niche: 'Plumbers',
    country: 'USA',
    city: 'Dallas',
    address: '4512 Main St, Dallas, TX 75201',
    phone: '+1 (214) 555-0133',
    normalized_phone: '2145550133',
    website_url: null,
    website_type: 'none',
    google_rating: 4.9,
    review_count: 210,
    google_maps_url: 'https://maps.google.com/?q=Precision+Plumbing+Dallas',
    confidence_score: 92,
    status: 'contacted',
    created_at: new Date().toISOString(),
    audit: {
      id: 'audit-103',
      has_ssl: false,
      is_mobile_friendly: false,
      load_time_seconds: 0,
      cms_detected: 'none',
      audit_score: 10,
      issues: ['No Website Found', 'Missing Emergency Call Out Button'],
      summary: 'Top rated Dallas plumber with 210 reviews operating exclusively via Google Maps.'
    },
    ai_analysis: {
      opportunity_level: 'High',
      estimated_deal_size: '$2,000 - $3,500',
      recommended_pitch: '24/7 Emergency Plumbing Website with Tap-to-Call button.',
      cold_email_subject: 'Emergency Plumbing Website prototype for Precision Plumbing',
      cold_email_body: 'Hi Precision Plumbing team,\n\nWith 210 reviews in Dallas, you are losing after-hours emergency calls because potential clients cannot find an official website.\n\nWould you like to see a tap-to-call website design built for your team?',
      social_dm_text: 'Hey Precision Plumbing! 🔧 Saw your 210 reviews in Dallas. We built a fast tap-to-call website template for plumbers. Can I drop a quick demo link?'
    }
  }
];

// Global in-memory store for newly generated leads
export const LEADS_STORE = [...INITIAL_LEADS];

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
        cold_email_subject: `Digital presence for ${bName} in ${c}`,
        cold_email_body: `Hi ${bName} team,\n\nI noticed your business in ${c} has ${reviews} great reviews but lacks a modern mobile site.\n\nWould you like to see a custom prototype built for your business?`,
        social_dm_text: `Hey ${bName} team! 👋 Saw your ${reviews} 5-star reviews in ${c}. We built a quick mobile website prototype for you — mind if I drop a link?`
      }
    };

    LEADS_STORE.unshift(newLead);
    createdLeads.push(newLead);
  }

  return createdLeads;
}
