/**
 * Default section presets for each of the 57 service folders.
 *
 * Mirrors the block-based pattern used by /admin/website/city-pages
 * (see src/lib/city-sections.ts). Each service has its own ordered list of
 * sections so that JCB pages get "machine_specs" + "site_requirements",
 * wedding-car-rental gets "packages" + "gallery", airport-transfer gets
 * "terminal_coverage", etc.
 *
 * Sections are reusable across many services; the "preset" for each service
 * just picks which sections it wants and in what order. Admin can later
 * hide / reorder / add custom sections per (service, city) page in the
 * SEO content editor.
 */

import type { SectionConfig } from '@/lib/city-sections';

/** Section catalog — every reusable section across all services. */
export const SECTION_LIBRARY: Record<string, { label: string; hint: string }> = {
  hero:                 { label: 'Hero / Intro',                hint: 'Lead paragraph (180-350 words). Reference named neighborhoods, real routes, realistic price range.' },
  why_choose:           { label: 'Why Choose Us',               hint: 'City-specific benefits as bullet list. Avoid generic boilerplate; tie each point to local reality.' },
  popular_vehicles:     { label: 'Popular Vehicles',            hint: 'Vehicle categories with models + price range + best use case. Match terrain (hills→SUV, coast→scooter).' },
  services_offered:     { label: 'Services Offered',            hint: 'Sub-services available (local, outstation, airport, corporate, etc.). 1-2 sentences each with real examples.' },
  popular_routes:       { label: 'Popular Routes',              hint: 'Outstation routes from this city with distance + duration + via. Bullet list or table.' },
  tips:                 { label: 'Local Tips',                  hint: 'Single-sentence tips with real local detail (named road, season, regulation). Numbered list.' },
  faqs:                 { label: 'FAQs',                        hint: 'City-specific questions with realistic answers. Use the FAQ editor (q/a format).' },

  // Self-drive specifics
  rental_requirements:  { label: 'Rental Requirements',         hint: 'DL age, security deposit, fuel policy, km limit, return condition.' },
  pricing_table:        { label: 'Pricing Table',               hint: 'Hourly/daily/weekly rates with vehicle class. HTML table works well.' },

  // Tour / experience specifics
  tour_packages:        { label: 'Tour Packages',               hint: 'Day/multi-day package options with itinerary highlights.' },
  itinerary:            { label: 'Sample Itinerary',            hint: 'Day-by-day breakdown with timings and stops.' },
  included_services:    { label: "What's Included",             hint: 'Fuel, guide, accommodation, meals, insurance, etc.' },
  gallery:              { label: 'Photo Gallery',               hint: 'Sample images from past trips (upload via toolbar).' },
  testimonials:         { label: 'Customer Testimonials',       hint: '3-5 short reviews with name + city.' },

  // Airport / cab specifics
  terminal_coverage:    { label: 'Terminal Coverage',           hint: 'Which airport terminals served (T1, T2, T3) + drop zones in the city.' },
  vehicle_types:        { label: 'Vehicle Types',               hint: 'Sedan / SUV / hatchback / luxury — when each is best.' },

  // Tempo / bus specifics
  vehicle_specs:        { label: 'Vehicle Specifications',      hint: 'Seating capacity, luggage space, AC, music, charging points.' },
  group_packages:       { label: 'Group Packages',              hint: 'Multi-day packages for pilgrimages, weddings, corporate outings.' },
  bus_types:            { label: 'Bus Types',                   hint: '20-seater mini bus, 35-seater AC, 45-seater AC, 50-seater Volvo, etc.' },
  occasions:            { label: 'Occasions Covered',           hint: 'Weddings, corporate outings, sports events, school trips, etc.' },

  // Vehicle-model specifics (swift-on-rent, royal-enfield-on-rent, etc.)
  model_specs:          { label: 'Vehicle Specifications',      hint: 'Engine, mileage, seating, transmission, features specific to this model.' },
  rental_options:       { label: 'Rental Options',              hint: 'Hourly / daily / weekly / monthly plans with prices for this model.' },

  // Wedding / luxury specifics
  packages:             { label: 'Packages',                    hint: 'Wedding / event packages with pricing tiers.' },
  fleet_gallery:        { label: 'Fleet Gallery',                hint: 'Images of the cars/buses available for the occasion.' },
  decorations:          { label: 'Decoration Options',          hint: 'Standard, premium, custom decoration packages with prices.' },

  // Packers & movers specifics
  shifting_packages:    { label: 'Shifting Packages',           hint: '1BHK / 2BHK / 3BHK / Office shift packages with included services.' },
  process:              { label: 'Our Process',                 hint: 'Step-by-step booking → packing → loading → transit → unloading → unpacking.' },
  pricing_guide:        { label: 'Pricing Guide',                hint: 'Realistic price bands for local + intercity shifts based on apartment size.' },

  // Equipment specifics
  machine_specs:        { label: 'Machine Specifications',      hint: 'Capacity, reach, attachments, operator-included status, fuel consumption.' },
  site_requirements:    { label: 'Site Requirements',           hint: 'Access width, power, water, supervisor presence, permits needed.' },
  safety_norms:         { label: 'Safety & Operator Info',      hint: 'Operator certifications, PPE provided, insurance coverage, safety SOPs.' },

  // Truck / transport
  truck_types:          { label: 'Truck Types',                  hint: 'Tata Ace, 14ft, 20ft, container, trailer — capacity + best use cases.' },

  // Migrated from CityContentSection (hyper-local content per city × service)
  pickup_zones:         { label: 'Pickup Zones',                 hint: 'Neighborhoods / areas where vehicles are delivered (e.g. Connaught Place, BKC, Whitefield). Mention delivery time + vendor density per zone.' },
  attractions:          { label: 'Top Attractions',              hint: 'Nearby attractions and the best vehicle for each (e.g. Sabarmati Ashram — sedan; Adalaj Stepwell — SUV). Include distance from city.' },
  driving_info:         { label: 'Driving Info',                 hint: 'Local regulations, restrictions, parking, highway notes. Include odd-even rules, peak-hour bans, FASTag requirements where relevant.' },

  // Migrated from hardcoded "Packages" sections (Hourly/Daily/Weekly/Monthly)
  // Same id as the existing pricing_table — same hint applies. (Defined above.)
};

type SectionId = keyof typeof SECTION_LIBRARY;

/** Build a SectionConfig[] from a simple list of section IDs. */
function preset(sectionIds: SectionId[]): SectionConfig[] {
  return sectionIds.map((id, idx) => ({
    id,
    label: SECTION_LIBRARY[id].label,
    visible: true,
    order: idx,
    canHide: id !== 'hero',
  }));
}

/** Section preset per service slug. */
export const SERVICE_DEFAULT_SECTIONS: Record<string, SectionConfig[]> = {
  // ── Main car rental & cab services ─────────────────────────────
  'car-rental':            preset(['hero', 'why_choose', 'popular_vehicles', 'services_offered', 'popular_routes', 'pricing_table', 'pickup_zones', 'attractions', 'tips', 'driving_info', 'faqs']),
  'hourly-car-rental':     preset(['hero', 'pricing_table', 'why_choose', 'popular_vehicles', 'services_offered', 'pickup_zones', 'tips', 'faqs']),
  'monthly-car-rental':    preset(['hero', 'pricing_table', 'why_choose', 'popular_vehicles', 'rental_requirements', 'pickup_zones', 'tips', 'faqs']),
  'corporate-car-rental':  preset(['hero', 'why_choose', 'popular_vehicles', 'services_offered', 'pricing_table', 'faqs']),
  'chauffeur-service':     preset(['hero', 'why_choose', 'services_offered', 'pricing_table', 'popular_routes', 'faqs']),
  'local-taxi':            preset(['hero', 'pricing_table', 'vehicle_types', 'services_offered', 'tips', 'faqs']),
  'round-trip':            preset(['hero', 'popular_routes', 'pricing_table', 'vehicle_types', 'why_choose', 'faqs']),

  // ── Outstation / one-way ───────────────────────────────────────
  'one-way-cab':           preset(['hero', 'popular_routes', 'pricing_table', 'vehicle_types', 'why_choose', 'tips', 'faqs']),
  'one-way-car-rental':    preset(['hero', 'popular_routes', 'pricing_table', 'vehicle_types', 'why_choose', 'tips', 'faqs']),
  'outstation-cab':        preset(['hero', 'popular_routes', 'pricing_table', 'vehicle_types', 'why_choose', 'tips', 'faqs']),
  'outstation-car-rental': preset(['hero', 'popular_routes', 'pricing_table', 'vehicle_types', 'why_choose', 'tips', 'faqs']),

  // ── Airport transfer ───────────────────────────────────────────
  'airport-transfer':      preset(['hero', 'terminal_coverage', 'pricing_table', 'vehicle_types', 'why_choose', 'tips', 'faqs']),

  // ── Self-drive ─────────────────────────────────────────────────
  'self-drive-car-rentals':       preset(['hero', 'why_choose', 'popular_vehicles', 'rental_requirements', 'pricing_table', 'popular_routes', 'pickup_zones', 'attractions', 'tips', 'driving_info', 'faqs']),
  'self-drive-hatchback-rental':  preset(['hero', 'why_choose', 'popular_vehicles', 'rental_requirements', 'pricing_table', 'pickup_zones', 'tips', 'faqs']),
  'self-drive-sedan-rental':      preset(['hero', 'why_choose', 'popular_vehicles', 'rental_requirements', 'pricing_table', 'pickup_zones', 'tips', 'faqs']),
  'self-drive-suv-rental':        preset(['hero', 'why_choose', 'popular_vehicles', 'rental_requirements', 'pricing_table', 'popular_routes', 'pickup_zones', 'tips', 'faqs']),

  // ── Bike rental ────────────────────────────────────────────────
  'bike-on-rent':            preset(['hero', 'why_choose', 'popular_vehicles', 'services_offered', 'popular_routes', 'pricing_table', 'pickup_zones', 'attractions', 'tips', 'driving_info', 'faqs']),
  'monthly-bike-rental':     preset(['hero', 'pricing_table', 'why_choose', 'popular_vehicles', 'rental_requirements', 'tips', 'faqs']),
  'electric-scooter-rental': preset(['hero', 'why_choose', 'popular_vehicles', 'pricing_table', 'services_offered', 'tips', 'faqs']),

  // ── Bike tours / trips ─────────────────────────────────────────
  'bike-tours':  preset(['hero', 'tour_packages', 'itinerary', 'included_services', 'gallery', 'testimonials', 'faqs']),
  'bike-trips':  preset(['hero', 'tour_packages', 'itinerary', 'included_services', 'gallery', 'testimonials', 'faqs']),

  // ── Tempo Traveller variants ───────────────────────────────────
  'tempo-traveller':            preset(['hero', 'why_choose', 'vehicle_specs', 'group_packages', 'popular_routes', 'pricing_table', 'faqs']),
  '12-seater-tempo-traveller':  preset(['hero', 'vehicle_specs', 'pricing_table', 'group_packages', 'popular_routes', 'faqs']),
  '17-seater-tempo-traveller':  preset(['hero', 'vehicle_specs', 'pricing_table', 'group_packages', 'popular_routes', 'faqs']),
  '20-seater-tempo-traveller':  preset(['hero', 'vehicle_specs', 'pricing_table', 'group_packages', 'popular_routes', 'faqs']),
  '26-seater-bus':              preset(['hero', 'vehicle_specs', 'pricing_table', 'group_packages', 'popular_routes', 'occasions', 'faqs']),

  // ── Bus rental ─────────────────────────────────────────────────
  'bus-rental':           preset(['hero', 'why_choose', 'bus_types', 'group_packages', 'occasions', 'popular_routes', 'pricing_table', 'pickup_zones', 'faqs']),
  'corporate-bus-rental': preset(['hero', 'why_choose', 'bus_types', 'services_offered', 'pricing_table', 'faqs']),
  'wedding-bus-rental':   preset(['hero', 'why_choose', 'bus_types', 'decorations', 'packages', 'gallery', 'faqs']),

  // ── Specific car models ────────────────────────────────────────
  'swift-on-rent':     preset(['hero', 'model_specs', 'rental_options', 'why_choose', 'popular_routes', 'faqs']),
  'creta-on-rent':     preset(['hero', 'model_specs', 'rental_options', 'why_choose', 'popular_routes', 'faqs']),
  'seltos-on-rent':    preset(['hero', 'model_specs', 'rental_options', 'why_choose', 'popular_routes', 'faqs']),
  'scorpio-on-rent':   preset(['hero', 'model_specs', 'rental_options', 'why_choose', 'popular_routes', 'faqs']),
  'innova-on-rent':    preset(['hero', 'model_specs', 'rental_options', 'why_choose', 'popular_routes', 'group_packages', 'faqs']),
  'fortuner-on-rent':  preset(['hero', 'model_specs', 'rental_options', 'why_choose', 'popular_routes', 'occasions', 'faqs']),
  'xuv700-on-rent':    preset(['hero', 'model_specs', 'rental_options', 'why_choose', 'popular_routes', 'faqs']),

  // ── Specific bike models ───────────────────────────────────────
  'activa-on-rent':         preset(['hero', 'model_specs', 'rental_options', 'why_choose', 'tips', 'faqs']),
  'splendor-on-rent':       preset(['hero', 'model_specs', 'rental_options', 'why_choose', 'tips', 'faqs']),
  'pulsar-on-rent':         preset(['hero', 'model_specs', 'rental_options', 'why_choose', 'popular_routes', 'faqs']),
  'apache-on-rent':         preset(['hero', 'model_specs', 'rental_options', 'why_choose', 'popular_routes', 'faqs']),
  'royal-enfield-on-rent':  preset(['hero', 'model_specs', 'rental_options', 'why_choose', 'popular_routes', 'tips', 'faqs']),
  'himalayan-on-rent':      preset(['hero', 'model_specs', 'rental_options', 'why_choose', 'popular_routes', 'tips', 'faqs']),
  'ktm-on-rent':            preset(['hero', 'model_specs', 'rental_options', 'why_choose', 'popular_routes', 'faqs']),

  // ── Luxury / wedding / specialty ───────────────────────────────
  'luxury-car-rental':   preset(['hero', 'packages', 'fleet_gallery', 'occasions', 'why_choose', 'pricing_table', 'pickup_zones', 'faqs']),
  'wedding-car-rental':  preset(['hero', 'packages', 'decorations', 'fleet_gallery', 'occasions', 'testimonials', 'faqs']),
  'sports-car-rental':   preset(['hero', 'fleet_gallery', 'pricing_table', 'occasions', 'why_choose', 'faqs']),
  'vintage-car-rental':  preset(['hero', 'fleet_gallery', 'packages', 'occasions', 'why_choose', 'faqs']),

  // ── Packers & movers ───────────────────────────────────────────
  'packers-and-movers':  preset(['hero', 'why_choose', 'shifting_packages', 'services_offered', 'process', 'pricing_guide', 'pickup_zones', 'tips', 'faqs']),

  // ── Truck / transport / mini truck / trailer ───────────────────
  'transporter':         preset(['hero', 'why_choose', 'truck_types', 'services_offered', 'popular_routes', 'pricing_table', 'pickup_zones', 'faqs']),
  'mini-truck-rental':   preset(['hero', 'why_choose', 'truck_types', 'services_offered', 'pricing_table', 'tips', 'faqs']),
  'trailer-on-rent':     preset(['hero', 'why_choose', 'vehicle_specs', 'pricing_table', 'popular_routes', 'faqs']),

  // ── Equipment / heavy machinery ────────────────────────────────
  'equipment-rental':    preset(['hero', 'why_choose', 'machine_specs', 'site_requirements', 'pricing_table', 'safety_norms', 'pickup_zones', 'faqs']),
  'jcb-on-rent':         preset(['hero', 'machine_specs', 'site_requirements', 'pricing_table', 'safety_norms', 'why_choose', 'faqs']),
  'crane-on-rent':       preset(['hero', 'machine_specs', 'site_requirements', 'pricing_table', 'safety_norms', 'why_choose', 'faqs']),
  'excavator-on-rent':   preset(['hero', 'machine_specs', 'site_requirements', 'pricing_table', 'safety_norms', 'why_choose', 'faqs']),
  'hydra-on-rent':       preset(['hero', 'machine_specs', 'site_requirements', 'pricing_table', 'safety_norms', 'why_choose', 'faqs']),
  'generator-on-rent':   preset(['hero', 'machine_specs', 'site_requirements', 'pricing_table', 'safety_norms', 'why_choose', 'faqs']),
};

/** Get default sections for a service slug; falls back to a sensible generic set. */
export function getDefaultSectionsForService(serviceSlug: string): SectionConfig[] {
  const preset = SERVICE_DEFAULT_SECTIONS[serviceSlug];
  if (preset) return preset.map((s) => ({ ...s }));

  // Generic fallback for any unknown service
  return [
    { id: 'hero',             label: 'Hero / Intro',     visible: true, order: 0, canHide: false },
    { id: 'why_choose',       label: 'Why Choose Us',    visible: true, order: 1, canHide: true },
    { id: 'services_offered', label: 'Services Offered', visible: true, order: 2, canHide: true },
    { id: 'tips',             label: 'Local Tips',       visible: true, order: 3, canHide: true },
    { id: 'faqs',             label: 'FAQs',             visible: true, order: 4, canHide: true },
  ];
}

/** Merge stored sectionsConfig with defaults — keeps user edits, fills missing built-ins. */
export function mergeWithDefaults(
  serviceSlug: string,
  stored: SectionConfig[] | null | undefined,
): SectionConfig[] {
  const defaults = getDefaultSectionsForService(serviceSlug);
  if (!stored || stored.length === 0) return defaults;

  const ids = new Set(stored.map((s) => s.id));
  const missing = defaults
    .filter((d) => !ids.has(d.id))
    .map((d, i) => ({ ...d, order: stored.length + i }));
  return [...stored, ...missing].sort((a, b) => a.order - b.order);
}

/** Parse JSON safely. */
export function parseSectionsConfig(raw: string | null | undefined): SectionConfig[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}
