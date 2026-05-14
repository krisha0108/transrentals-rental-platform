/**
 * Prompt template for generating unique SEO content for a (service, city) page.
 * Output is strict JSON matching service_city_content schema.
 *
 * Anti-duplicate-content strategy:
 *   1. Inject concrete city facts (population, real neighborhoods, real routes,
 *      named attractions, terrain) so AI anchors content in unique local detail.
 *   2. Vary vehicle recommendations by terrain (hills need SUV/4x4, coasts need
 *      scooters/convertibles, metros need traffic-friendly hatchbacks).
 *   3. Force city-specific examples in every section — not just the intro.
 */

import type { CityContext } from '../city-context';
import { formatCityContextForPrompt } from '../city-context';

export type ServiceLabel = {
  slug: string;
  label: string;
  vehicleNoun: string;
  priceContext: string;
};

// Helper to build label entries tersely
const L = (slug: string, label: string, vehicleNoun: string, priceContext: string): ServiceLabel => ({
  slug, label, vehicleNoun, priceContext,
});

export const SERVICE_LABELS: Record<string, ServiceLabel> = {
  // ── Main parent services ────────────────────────────────────────
  'car-rental':              L('car-rental',              'Car Rental',                 'car',                'Chauffeur-driven car rentals from ₹999/day (hatchback) to ₹5,000/day (premium SUV)'),
  'self-drive-car-rentals':  L('self-drive-car-rentals',  'Self-Drive Car Rental',      'self-drive car',     'Self-drive cars from ₹1,200/day (hatchback) to ₹4,500/day (SUV), security deposit ₹3,000-10,000'),
  'bike-on-rent':            L('bike-on-rent',            'Bike Rental',                'bike or scooter',    'Scooters ₹300-500/day, Royal Enfield ₹800-1,500/day, KTM/Himalayan ₹1,200-2,000/day'),
  'bus-rental':              L('bus-rental',              'Bus Rental',                 'bus',                '20-seater mini bus ₹10,000+/day, 35-seater AC ₹15,000+/day, 50-seater luxury ₹25,000+/day'),
  'tempo-traveller':         L('tempo-traveller',         'Tempo Traveller Rental',     'tempo traveller',    '12-seater AC ₹4,500-6,000/day, 17-seater AC ₹6,000-8,000/day, plus driver allowance'),
  'packers-and-movers':      L('packers-and-movers',      'Packers and Movers',         'packers and movers', '1BHK shift ₹6,000-15,000 (local), 2BHK ₹10,000-25,000, 3BHK ₹15,000-40,000; intercity 1.5-3x'),
  'transporter':             L('transporter',             'Truck Rental',               'truck',              'Tata Ace ₹2,800-4,000/day, Eicher 14ft ₹6,000-9,000/day, 32ft container ₹12,000-18,000/day'),
  'equipment-rental':        L('equipment-rental',        'Equipment Rental',           'construction equipment', 'JCB ₹800-1,200/hr, crane ₹1,500-3,000/hr, generator ₹1,500-3,500/day, hydra ₹2,000+/hr'),
  'luxury-car-rental':       L('luxury-car-rental',       'Luxury Car Rental',          'luxury car',         'BMW/Audi ₹8,000-15,000/day, Mercedes ₹10,000-18,000/day, Rolls Royce ₹40,000+/day for weddings'),

  // ── Tempo traveller variants ────────────────────────────────────
  '12-seater-tempo-traveller': L('12-seater-tempo-traveller', '12-Seater Tempo Traveller', '12-seater tempo traveller', '12-seater AC Tempo Traveller ₹4,500-6,500/day with driver, ideal for 8-10 passengers + luggage'),
  '17-seater-tempo-traveller': L('17-seater-tempo-traveller', '17-Seater Tempo Traveller', '17-seater tempo traveller', '17-seater AC Tempo Traveller ₹6,000-8,500/day with driver, comfortable for 13-15 passengers'),
  '20-seater-tempo-traveller': L('20-seater-tempo-traveller', '20-Seater Tempo Traveller', '20-seater tempo traveller', '20-seater AC Tempo Traveller ₹7,500-10,500/day with driver, for medium-group outings'),
  '26-seater-bus':             L('26-seater-bus',             '26-Seater Mini Bus',         '26-seater mini bus',        '26-seater AC mini bus ₹11,000-15,000/day, perfect for weddings and corporate outings'),

  // ── Self-drive variants ─────────────────────────────────────────
  'self-drive-hatchback-rental': L('self-drive-hatchback-rental', 'Self-Drive Hatchback Rental', 'self-drive hatchback', 'Self-drive hatchbacks (Swift, i20, Tiago) ₹1,200-1,800/day, security deposit ₹3,000-5,000'),
  'self-drive-sedan-rental':     L('self-drive-sedan-rental',     'Self-Drive Sedan Rental',     'self-drive sedan',     'Self-drive sedans (Honda City, Verna, Ciaz) ₹1,800-2,800/day, security deposit ₹5,000-8,000'),
  'self-drive-suv-rental':       L('self-drive-suv-rental',       'Self-Drive SUV Rental',       'self-drive SUV',       'Self-drive SUVs (Creta, Seltos, XUV700) ₹2,500-4,500/day, security deposit ₹8,000-15,000'),

  // ── Bike variants ───────────────────────────────────────────────
  'monthly-bike-rental':     L('monthly-bike-rental',     'Monthly Bike Rental',        'monthly bike rental',   'Monthly scooter rental ₹4,000-7,000, Royal Enfield monthly ₹12,000-18,000, includes service'),
  'electric-scooter-rental': L('electric-scooter-rental', 'Electric Scooter Rental',    'electric scooter',      'E-scooters ₹400-700/day, monthly ₹6,000-10,000, ideal for short city commutes (30-80 km range)'),
  'bike-tours':              L('bike-tours',              'Bike Tours',                 'guided bike tour',      'Guided bike tours ₹1,500-3,500/day inclusive of fuel + guide; 3-7 day Himalayan tours ₹15,000-35,000'),
  'bike-trips':              L('bike-trips',              'Bike Trips',                 'planned bike trip',     'Multi-day bike trips ₹2,500-5,000/day per rider; Leh-Ladakh 10-day trip ₹40,000-60,000 all-inclusive'),

  // ── Car rental variants & trip types ────────────────────────────
  'hourly-car-rental':       L('hourly-car-rental',       'Hourly Car Rental',          'hourly cab',         'Hourly packages: 4hr/40km ₹999-1,500, 8hr/80km ₹1,800-2,800, 12hr/120km ₹2,500-3,800'),
  'monthly-car-rental':      L('monthly-car-rental',      'Monthly Car Rental',         'monthly car rental', 'Monthly chauffeur car ₹30,000-50,000 (hatchback) to ₹80,000+ (SUV) including driver salary'),
  'one-way-car-rental':      L('one-way-car-rental',      'One-Way Car Rental',         'one-way cab',        'Pay only one-way distance — Delhi-Jaipur sedan ₹3,000-3,500, Mumbai-Pune ₹2,200-2,800'),
  'outstation-car-rental':   L('outstation-car-rental',   'Outstation Car Rental',      'outstation cab',     'Per-km ₹11-14 (sedan), ₹16-20 (SUV); driver allowance ₹300-500/day extra'),
  'airport-transfer':        L('airport-transfer',        'Airport Transfer',           'airport cab',        'Sedan ₹650-1,200 (one-way), SUV ₹1,200-2,000, fixed pricing — no surge'),
  'chauffeur-service':       L('chauffeur-service',       'Chauffeur Service',          'chauffeur-driven car', 'Trained chauffeur with car: hourly ₹500+, daily ₹2,500-4,500 (8hr/80km), monthly packages available'),
  'local-taxi':              L('local-taxi',              'Local Taxi',                 'local taxi',         'Local taxi pickups: 1hr/10km ₹250-400, 4hr/40km ₹999-1,400, point-to-point fixed pricing'),
  'one-way-cab':             L('one-way-cab',             'One-Way Cab',                'one-way cab',        'One-way intercity cabs — pay only outbound distance, no return charges; routes from ₹1,500'),
  'outstation-cab':          L('outstation-cab',          'Outstation Cab',             'outstation cab',     'Outstation round-trip cabs ₹11-18/km, driver allowance ₹300-500/day, 250km/day min on full-day'),
  'round-trip':              L('round-trip',              'Round Trip Cab',             'round-trip cab',     'Round-trip cabs ₹11-14/km (sedan), ₹16-20/km (SUV); minimum 250km/day billing'),
  'corporate-car-rental':    L('corporate-car-rental',    'Corporate Car Rental',       'corporate car',      'Corporate monthly: sedan ₹35,000-45,000, SUV ₹50,000-70,000, GST invoice + 24/7 support'),
  'wedding-car-rental':      L('wedding-car-rental',      'Wedding Car Rental',         'wedding car',        'Decorated cars: sedan ₹4,000-7,000, luxury ₹10,000-25,000, vintage ₹15,000-40,000 per event'),
  'sports-car-rental':       L('sports-car-rental',       'Sports Car Rental',          'sports car',         'Sports cars (Ferrari, Lamborghini, Porsche) ₹40,000-1,00,000/day for events and photoshoots'),
  'vintage-car-rental':      L('vintage-car-rental',      'Vintage Car Rental',         'vintage car',        'Vintage and classic cars (Beetle, Ambassador, Impala) ₹15,000-40,000/day for weddings and shoots'),

  // ── Bus variants ────────────────────────────────────────────────
  'corporate-bus-rental':    L('corporate-bus-rental',    'Corporate Bus Rental',       'corporate bus',      'Corporate buses: 35-seater AC ₹13,000-18,000/day, 50-seater AC ₹20,000-28,000/day with WiFi options'),
  'wedding-bus-rental':      L('wedding-bus-rental',      'Wedding Bus Rental',         'wedding bus',        'Decorated baraat buses: 35-seater ₹15,000-22,000, 50-seater ₹25,000-35,000 per event'),

  // ── Specific car models ─────────────────────────────────────────
  'swift-on-rent':           L('swift-on-rent',           'Swift on Rent',              'Maruti Swift',       'Maruti Swift ₹1,200-1,500/day with driver, ₹1,400-1,800/day self-drive, ideal city hatchback'),
  'creta-on-rent':           L('creta-on-rent',           'Creta on Rent',              'Hyundai Creta',      'Hyundai Creta ₹2,500-3,500/day with driver, ₹2,800-4,000/day self-drive, popular SUV choice'),
  'seltos-on-rent':          L('seltos-on-rent',          'Seltos on Rent',             'Kia Seltos',         'Kia Seltos ₹2,500-3,800/day with driver, ₹3,000-4,500/day self-drive, premium compact SUV'),
  'scorpio-on-rent':         L('scorpio-on-rent',         'Scorpio on Rent',            'Mahindra Scorpio',   'Mahindra Scorpio ₹2,800-4,000/day with driver, ₹3,500-4,800/day self-drive, rugged SUV'),
  'innova-on-rent':          L('innova-on-rent',          'Innova on Rent',             'Toyota Innova',      'Toyota Innova Crysta ₹3,000-4,500/day with driver, MPV first choice for 6-7 passenger trips'),
  'fortuner-on-rent':        L('fortuner-on-rent',        'Fortuner on Rent',           'Toyota Fortuner',    'Toyota Fortuner ₹4,500-6,500/day with driver, premium SUV with 4x4 for hill stations'),
  'xuv700-on-rent':          L('xuv700-on-rent',          'XUV700 on Rent',             'Mahindra XUV700',    'Mahindra XUV700 ₹4,000-5,500/day with driver, premium 7-seater SUV with ADAS features'),

  // ── Specific bike models ────────────────────────────────────────
  'activa-on-rent':          L('activa-on-rent',          'Activa on Rent',             'Honda Activa',       'Honda Activa ₹300-450/day, weekly ₹1,800-2,500, monthly ₹4,500-6,500, India\'s best-selling scooter'),
  'splendor-on-rent':        L('splendor-on-rent',        'Splendor on Rent',           'Hero Splendor',      'Hero Splendor ₹350-500/day, weekly ₹2,000-2,800, fuel-efficient 100cc commuter bike'),
  'pulsar-on-rent':          L('pulsar-on-rent',          'Pulsar on Rent',             'Bajaj Pulsar',       'Bajaj Pulsar 150/220 ₹500-800/day, weekly ₹3,000-5,000, perfect for city + occasional touring'),
  'apache-on-rent':          L('apache-on-rent',          'Apache on Rent',             'TVS Apache',         'TVS Apache RTR 160/200 ₹500-900/day, sporty street bike with quick acceleration'),
  'royal-enfield-on-rent':   L('royal-enfield-on-rent',   'Royal Enfield on Rent',      'Royal Enfield',      'Royal Enfield Classic 350 ₹800-1,200/day, Bullet 500 ₹1,000-1,500/day, Himalayan ₹1,200-2,000/day'),
  'himalayan-on-rent':       L('himalayan-on-rent',       'Himalayan on Rent',          'Royal Enfield Himalayan', 'Royal Enfield Himalayan ₹1,200-2,000/day, purpose-built ADV bike for Ladakh and hill rides'),
  'ktm-on-rent':             L('ktm-on-rent',             'KTM on Rent',                'KTM Duke / Adventure', 'KTM Duke 200/390 ₹1,000-1,500/day, Adventure 250/390 ₹1,500-2,500/day, sport and touring'),

  // ── Equipment items ─────────────────────────────────────────────
  'jcb-on-rent':             L('jcb-on-rent',             'JCB on Rent',                'JCB backhoe loader', 'JCB 3DX ₹800-1,200/hr or ₹6,000-9,000/day (8hr), mini excavator ₹1,000-1,500/hr'),
  'crane-on-rent':           L('crane-on-rent',           'Crane on Rent',              'crane',              'Hydraulic crane 8T ₹1,500-2,500/hr, 25T ₹3,000-5,000/hr, tower crane monthly ₹2-5 lakh'),
  'excavator-on-rent':       L('excavator-on-rent',       'Excavator on Rent',          'excavator',          'Tata Hitachi/JCB excavator 20T ₹1,500-2,500/hr, ₹10,000-15,000/day (8hr) with operator'),
  'hydra-on-rent':           L('hydra-on-rent',           'Hydra on Rent',              'hydra crane',        'Hydra 14T ₹1,500-2,200/hr, 25T ₹2,500-3,500/hr, ideal for warehouse and site material lifting'),
  'generator-on-rent':       L('generator-on-rent',       'Generator on Rent',          'diesel generator',   'Generator 5-15 KVA ₹1,500-3,000/day, 25-100 KVA ₹3,500-8,000/day, 250+ KVA project rates'),
  'trailer-on-rent':         L('trailer-on-rent',         'Trailer on Rent',            'flatbed trailer',    '20ft trailer ₹15,000-22,000/trip, 32ft ₹22,000-35,000/trip, 40ft container ₹30,000-50,000'),

  // ── Other ───────────────────────────────────────────────────────
  'mini-truck-rental':       L('mini-truck-rental',       'Mini Truck Rental',          'mini truck',         'Tata Ace (1T) ₹2,800-4,000/day, Bolero Pickup ₹4,000-6,000/day, hourly options available'),
};

export const SYSTEM_PROMPT = `You are a senior SEO copywriter and local-market expert for TransRentals — India's vehicle rental marketplace operating across 100+ cities.

BRAND VOICE:
- Trustworthy, professional, locally aware
- NOT corporate-stiff. NOT spammy. NOT generic.
- Use Indian English: "on rent" not "for hire", "outstation" not "intercity travel"
- Mention real specifics (route names, vehicle models, ₹ amounts, neighborhoods)
- Empathetic to the user's actual journey (airport pickup at 4 AM, wedding logistics, group pilgrimage)

CORE USPs (use sparingly, never spam):
- 100+ verified vendors per metro, background-checked drivers
- Transparent pricing, no hidden charges
- Free quotes from multiple vendors
- 24/7 support
- Doorstep pickup-drop

CRITICAL ANTI-DUPLICATE-CONTENT RULES:
- Every page MUST reference real city-specific facts: named neighborhoods, real route names with distances, named attractions, real traffic/weather/regulatory specifics for THIS city.
- DO NOT produce content that could be rewritten for any city by just swapping the name.
- Vehicle recommendations MUST vary by city terrain:
  * Hill stations (Manali, Shimla, Ooty): SUV/4x4 mandatory, mention winter chains
  * Coastal (Goa, Pondicherry, Vizag): scooters dominant, convertibles for beach drives
  * Desert (Jaisalmer, Bikaner): SUVs with high ground clearance, mention sand stretches
  * Metros (Delhi, Mumbai, Bangalore): traffic-friendly hatchbacks, premium sedans for corporate
  * Heritage (Agra, Jaipur, Udaipur): comfortable sedans/SUVs for tourist circuits
  * Religious (Tirupati, Varanasi, Haridwar): tempo travellers for groups, sedans for families
- FAQ questions must be city-specific (mention real routes, real local rules, real seasonal concerns).
- Tips must be locally actionable — not "book in advance" boilerplate.

OUTPUT FORMAT — strict JSON only, no preamble, no explanation:
{
  "intro": "2-4 paragraph string (180-350 words). Lead with what makes THIS city unique for this service. Reference at least 2 named neighborhoods/landmarks and 1 real route. Mention realistic price range. NO generic openings like 'Looking for...' or 'Welcome to...'.",
  "whyChooseUs": [
    { "title": "Short benefit title (2-4 words)", "description": "City-specific reason, 1-2 sentences. Reference real local concerns (traffic, season, terrain)." }
    // 5-7 items, NOT generic — anchor each one to this city's reality
  ],
  "popularVehicles": [
    { "category": "Vehicle class name", "models": "Specific model names suited to this city's terrain/use", "priceRange": "Realistic ₹/day range", "bestFor": "When this category is the right pick HERE" }
    // 4-6 categories matched to terrain (hills→SUV-heavy, coasts→scooter-heavy, etc.)
  ],
  "servicesOffered": [
    { "name": "Sub-service name", "description": "1-2 sentences. Reference at least one real local example (route, area, timing)." }
    // 4-6 sub-services relevant to this service + city combination
  ],
  "faqs": [
    { "q": "City-specific question (mentions real route, area, or local rule)", "a": "2-4 sentence answer with real numbers/facts" }
    // 6-10 FAQs, each tied to THIS city
  ],
  "tips": [
    "Single locally-actionable tip (1 sentence). Cite a real road, season, or local detail. NOT generic."
    // 5-8 tips total, all city-specific
  ],
  "metaTitle": "50-60 chars. Primary keyword + city + price/CTA hint. e.g. 'Car Rental in Delhi from ₹999/day | TransRentals'",
  "metaDescription": "140-158 chars. Keyword + 1 unique local fact + CTA.",
  "h1Heading": "60-80 chars. Slightly longer than metaTitle, conversational."
}

Generate ONLY the JSON object. No markdown fences. No commentary.`;

export type PromptInput = {
  service: ServiceLabel;
  city: CityContext;
  customInstructions?: string;
};

export function buildUserPrompt(input: PromptInput): string {
  const { service, city, customInstructions } = input;

  const cityFacts = formatCityContextForPrompt(city);

  return `Generate unique SEO page content for:

SERVICE: ${service.label}
CITY: ${city.name}, ${city.state}
URL: /${service.slug}/${city.slug}
TYPICAL PRICING: ${service.priceContext}

━━ CITY-SPECIFIC FACTS (use these to anchor unique content) ━━
${cityFacts}
━━ END CITY FACTS ━━
${customInstructions ? `\nADMIN INSTRUCTIONS:\n${customInstructions}\n` : ''}
Now produce the JSON output per the schema in the system prompt. Every section must reference at least one fact from the city context above. Vehicle recommendations must match the terrain type "${city.terrain}".`;
}
