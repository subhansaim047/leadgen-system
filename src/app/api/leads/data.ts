import fs from 'fs';

const TMP_DB_PATH = '/tmp/leads_db.json';

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
  'islamabad': ['F-7 Markaz', 'F-6 Markaz', 'Blue Area', 'E-11', 'G-9 Markaz', 'I-8 Markaz'],
  'berlin': ['Mitte', 'Kurfürstendamm', 'Friedrichstraße', 'Kreuzberg', 'Prenzlauer Berg', 'Charlottenburg'],
  'paris': ['Champs-Élysées', 'Le Marais', 'Rue de Rivoli', 'Saint-Germain', 'Opéra', 'Montmartre'],
  'rome': ['Via del Corso', 'Trastevere', 'Piazza di Spagna', 'Via Veneto', 'Prati'],
  'madrid': ['Gran Vía', 'Salamanca', 'Chamberí', 'Passeig de Gràcia', 'Malasaña'],
  'amsterdam': ['Herengracht', 'Keizersgracht', 'Zuidas', 'Jordaan', 'Centrum'],
  'austin': ['Downtown', 'Barton Springs', 'South Congress', 'The Domain', 'East Austin', 'Zilker'],
  'new york': ['Manhattan', 'Brooklyn', 'Upper East Side', 'SoHo', 'Tribeca', 'Midtown'],
  'london': ['Kensington', 'Mayfair', 'Harley Street', 'Covent Garden', 'Chelsea', 'Westminster']
};

const COUNTRY_SPECIFIC_NICHE_RULES: Record<string, Record<string, { prefixes: string[], suffixes: string[] }>> = {
  'pakistan': {
    'restaurant': {
      prefixes: ['Al-Rehman', 'Kababish', 'Desi Dera', 'Crown', 'Silver Spoon', 'Chief', 'Al-Haaj', 'Sultan', 'Golden', 'Prime', 'Royal', 'Khyber'],
      suffixes: ['Family Restaurant', 'Grill & BBQ', 'Tikka House', 'Karahi House', 'Broast & Fast Food', 'Bistro', 'Refreshment Center', 'Biryani House', 'Steakhouse']
    },
    'beauty': {
      prefixes: ['Glamour', 'Nayla', 'Standard', 'Style Inn', 'Faiza', 'Rose', 'Sanam', 'Grace', 'Blush & Glow', 'Zari', 'Elegance'],
      suffixes: ['Beauty Salon & Spa', 'Bridal Studio', 'Beauty Clinic', 'Beauty Parlour', 'Makeup Lounge', 'Skin Care Studio']
    },
    'dental': {
      prefixes: ['Al-Razi', 'Shaheen', 'Kashmir', 'Al-Rehman', 'City', 'Grace', 'Advanced', 'Care', 'Apex', 'Precision'],
      suffixes: ['Dental Care', 'Dental Clinic', 'Smile Studio', 'Dental Center', 'Orthodontic Clinic', 'Dental Surgery']
    }
  },
  'germany': {
    'restaurant': {
      prefixes: ['Gasthaus', 'Bistro', 'Steakhouse', 'Café', 'Brauhaus', 'Ristorante', 'Ratskeller', 'Wirtshaus'],
      suffixes: ['am Markt', 'Bistro & Grill', 'Brauhaus', 'Steakhouse', 'Ristorante', 'Gasthaus', 'Trattoria']
    },
    'beauty': {
      prefixes: ['Kosmetikstudio', 'Beauty Lounge', 'Haaratelier', 'Wellness Studio', 'Elegance'],
      suffixes: ['Kosmetikstudio', 'Beauty Lounge & Spa', 'Haaratelier', 'Beauty Clinic', 'Wellness Center']
    },
    'dental': {
      prefixes: ['Zahnarztpraxis', 'Zahnmedizin', 'Zahnärzte', 'Smile Center', 'Dental Care'],
      suffixes: ['Zahnarztpraxis', 'Zahnmedizinische Klinik', 'Zahnärzte am Markt', 'Dental Care Center']
    }
  },
  'france': {
    'restaurant': {
      prefixes: ['Le Petit', 'Brasserie', 'Bistro', 'Restaurant', 'Chez', 'L\'Atelier', 'Café'],
      suffixes: ['Brasserie', 'Bistro Gastronomique', 'Ristorante', 'Pizzeria', 'Café & Restaurant', 'Grill House']
    },
    'beauty': {
      prefixes: ['Institut de Beauté', 'Salon de Coiffure', 'Atelier Beauté', 'Spa & Bien-Être'],
      suffixes: ['Institut de Beauté', 'Salon de Coiffure', 'Spa & Wellness', 'Atelier Esthétique']
    },
    'dental': {
      prefixes: ['Cabinet Dentaire', 'Clinique Dentaire', 'Centre Dentaire'],
      suffixes: ['Cabinet Dentaire', 'Clinique Dentaire', 'Centre Dentaire Stomatologique']
    }
  },
  'italy': {
    'restaurant': {
      prefixes: ['Trattoria', 'Ristorante', 'Osteria', 'Pizzeria', 'Bistrot', 'Caffè'],
      suffixes: ['Ristorante', 'Trattoria Tipica', 'Osteria con Cucina', 'Pizzeria Gourmet', 'Bistrot']
    },
    'beauty': {
      prefixes: ['Centro Estetico', 'Salone di Bellezza', 'Hair Studio', 'Spazio Wellness'],
      suffixes: ['Centro Estetico', 'Salone di Bellezza', 'Hair & Spa Lounge', 'Studio Estetico']
    },
    'dental': {
      prefixes: ['Studio Dentistico', 'Clinica Dentale', 'Centro Odontoiatrico'],
      suffixes: ['Studio Dentistico', 'Clinica Dentale', 'Centro Odontoiatrico']
    }
  },
  'spain': {
    'restaurant': {
      prefixes: ['Tapas Bar', 'Restaurante', 'Mesón', 'Asador', 'Cervecería', 'Bistro'],
      suffixes: ['Restaurante', 'Tapas & Bar', 'Mesón Tradicional', 'Asador de Grill', 'Cervecería']
    },
    'beauty': {
      prefixes: ['Centro de Belleza', 'Salón de Estética', 'Hair Studio', 'Estudio de Belleza'],
      suffixes: ['Centro de Belleza', 'Salón de Estética', 'Hair & Spa Lounge', 'Estudio Estético']
    },
    'dental': {
      prefixes: ['Clínica Dental', 'Centro Odontológico', 'Estudio Dental'],
      suffixes: ['Clínica Dental', 'Centro Odontológico', 'Estudio Dental']
    }
  },
  'uk': {
    'restaurant': {
      prefixes: ['The Royal', 'The Local', 'Golden', 'Prime', 'The Crown', 'Bella', 'The Village'],
      suffixes: ['Grill & Bar', 'Steakhouse', 'Tandoori & Grill', 'Bistro', 'Brasserie', 'Gourmet Kitchen']
    },
    'beauty': {
      prefixes: ['The Beauty Lounge', 'Elegance', 'Velvet Touch', 'Aesthetic', 'Glow & Grace'],
      suffixes: ['Beauty Salon & Spa', 'Hair & Beauty Studio', 'Aesthetic Clinic', 'Skin Care Lounge']
    },
    'dental': {
      prefixes: ['Harley Street', 'Advanced', 'Smile Studio', 'Crown', 'Gentle'],
      suffixes: ['Dental Practice', 'Dental Clinic', 'Smile Studio', 'Dental Care Centre']
    }
  },
  'usa': {
    'restaurant': {
      prefixes: ['Prime', 'The Local', 'Golden', 'Blue Harbor', 'Apex', 'Crown', 'Heritage'],
      suffixes: ['Steakhouse & Grill', 'Family Diner', 'Bistro & Bar', 'Taco Fiesta', 'Seafood & Grill House', 'Grill & Taproom']
    },
    'beauty': {
      prefixes: ['Glow & Grace', 'Velvet Touch', 'Apex', 'Elegance', 'Urban'],
      suffixes: ['Beauty Lounge & Spa', 'Hair & Aesthetic Studio', 'Skin Care Clinic', 'Glamour Lounge']
    },
    'dental': {
      prefixes: ['Apex', 'Precision', 'Gentle', 'Family', 'Advanced', 'Smile'],
      suffixes: ['Family Dentistry', 'Advanced Dental Care', 'Smile Studio', 'Dental Spa', 'Orthodontic Center']
    }
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

  const countryRules = COUNTRY_SPECIFIC_NICHE_RULES['usa'];
  
  let rule = countryRules['restaurant'];
  Object.keys(countryRules).forEach(key => {
    if (nLower.includes(key)) {
      rule = countryRules[key];
    }
  });

  const prefix = rule.prefixes[i % rule.prefixes.length];
  const suffix = rule.suffixes[i % rule.suffixes.length];

  const patterns = [
    `${prefix} ${suffix}`,
    `${lmark} ${suffix}`,
    `${lmark} ${prefix} ${suffix}`
  ];

  let raw = patterns[i % patterns.length];
  const words = raw.split(' ');
  const uniqueWords: string[] = [];
  words.forEach(w => {
    if (!uniqueWords.some(existing => existing.toLowerCase() === w.toLowerCase())) {
      uniqueWords.push(w);
    }
  });
  return uniqueWords.join(' ');
}

// Global in-memory store for active CRM leads
export const LEADS_STORE: any[] = [];

// Historical Memory Blacklist: Remembers every single lead ever exported/downloaded
export const DOWNLOADED_LEADS_HISTORY = new Set<string>();

export function getPersistedLeads(): any[] {
  try {
    if (fs.existsSync(TMP_DB_PATH)) {
      const raw = fs.readFileSync(TMP_DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return LEADS_STORE;
}

export function savePersistedLeads(leads: any[]) {
  try {
    fs.writeFileSync(TMP_DB_PATH, JSON.stringify(leads), 'utf-8');
  } catch (e) {}
}

const TMP_EXPORT_HISTORY_PATH = '/tmp/downloaded_history.json';

export function getExportedHistoryKeys(): Set<string> {
  try {
    if (fs.existsSync(TMP_EXPORT_HISTORY_PATH)) {
      const raw = fs.readFileSync(TMP_EXPORT_HISTORY_PATH, 'utf-8');
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch (e) {}
  return DOWNLOADED_LEADS_HISTORY;
}

export function markLeadsAsExported(leads: any[]) {
  const currentKeys = getExportedHistoryKeys();
  leads.forEach((l) => {
    const key = `${(l.business_name || '').toLowerCase().trim()}_${(l.city || '').toLowerCase().trim()}`;
    currentKeys.add(key);
    DOWNLOADED_LEADS_HISTORY.add(key);
  });
  try {
    fs.writeFileSync(TMP_EXPORT_HISTORY_PATH, JSON.stringify(Array.from(currentKeys)), 'utf-8');
  } catch (e) {}
}

export function isLeadAlreadyExportedOrInCrm(businessName: string, city: string): boolean {
  const key = `${businessName.toLowerCase().trim()}_${city.toLowerCase().trim()}`;
  
  const exportedKeys = getExportedHistoryKeys();
  if (exportedKeys.has(key)) return true;

  const currentStore = getPersistedLeads();
  return currentStore.some(
    (l) => `${l.business_name.toLowerCase().trim()}_${l.city.toLowerCase().trim()}` === key
  );
}

export function clearAllLeads() {
  LEADS_STORE.length = 0;
  savePersistedLeads([]);
  DOWNLOADED_LEADS_HISTORY.clear();
  try {
    if (fs.existsSync(TMP_EXPORT_HISTORY_PATH)) {
      fs.unlinkSync(TMP_EXPORT_HISTORY_PATH);
    }
  } catch (e) {}
}

export function deleteLeadById(id: string) {
  const currentStore = getPersistedLeads();
  const index = currentStore.findIndex(l => l.id === id);
  if (index !== -1) {
    currentStore.splice(index, 1);
    savePersistedLeads(currentStore);
    LEADS_STORE.length = 0;
    LEADS_STORE.push(...currentStore);
    return true;
  }
  return false;
}
