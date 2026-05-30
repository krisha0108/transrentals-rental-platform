import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  CITY_SUBLOCATIONS,
  getSubLocationStaticParams,
  getSubLocation,
  getCityNameFromSlug,
} from '@/data/city-sublocations';

interface PageProps {
  params: { location: string; sublocation: string };
}

// ─── Equipment-type data ────────────────────────────────────────────────────

const EQUIPMENT_TYPES: Record<string, {
  name: string;
  fullName: string;
  startingPrice: string;
  priceUnit: string;
  icon: string;
  useCases: string[];
  description: string;
  specs: { label: string; value: string }[];
  faqs: { q: string; a: string }[];
}> = {
  jcb: {
    name: 'JCB on Rent',
    fullName: 'JCB Backhoe Loader',
    startingPrice: '₹2,500',
    priceUnit: '/day',
    icon: '🚜',
    useCases: ['Foundation digging', 'Utility trenching', 'Road repair', 'Site leveling', 'Pipeline laying', 'Debris removal'],
    description: 'JCB backhoe loaders are the most-hired construction machines in India. Versatile for digging, trenching, loading, and urban site work. Available with certified operators across all major cities.',
    specs: [
      { label: 'Bucket Capacity', value: '0.2–0.28 m³' },
      { label: 'Digging Depth', value: 'Up to 5.5 m' },
      { label: 'Engine Power', value: '74–93 hp' },
      { label: 'Operating Weight', value: '7,500–9,000 kg' },
    ],
    faqs: [
      { q: 'What is the JCB machine rent per day?', a: 'JCB backhoe loader rental starts from ₹2,500–₹3,500 per day (8 working hours) for standard models. Rates vary by city and fuel arrangement. Get free quotes on TransRentals for your specific site.' },
      { q: 'Is the operator included in JCB rental?', a: 'Yes, all JCB rentals on TransRentals include a certified, experienced operator responsible for safe operation at your site.' },
      { q: 'What can a JCB do on a construction site?', a: 'A JCB backhoe loader can dig trenches for utilities, lay foundations, level sites, load debris into trucks, and perform general earthwork. The combination of front bucket and rear backhoe makes it the most versatile machine on urban sites.' },
      { q: 'Can JCB work in narrow urban lanes?', a: 'Yes, JCB backhoe loaders are designed for urban construction — they can work in lane widths as narrow as 2.5 m. This is why they are preferred for road repair, utility work, and house foundation digging in city areas.' },
      { q: 'What is the minimum rental duration for a JCB?', a: 'Minimum rental is 1 day (8 working hours). Half-day rates may be available on request. Weekly and monthly contracts provide 20–30% savings over daily rates.' },
    ],
  },
  crane: {
    name: 'Crane on Rent',
    fullName: 'Mobile & Tower Crane',
    startingPrice: '₹8,000',
    priceUnit: '/day',
    icon: '🏗️',
    useCases: ['High-rise construction', 'Industrial lifting', 'Bridge construction', 'Steel erection', 'Wind turbine installation', 'Heavy machinery loading'],
    description: 'Mobile cranes and tower cranes for heavy lifting — from 10-ton city cranes to 500-ton hydraulic all-terrain cranes for major infrastructure projects. All cranes come with certified riggers.',
    specs: [
      { label: 'Lifting Capacity', value: '10–500 tonnes' },
      { label: 'Boom Length', value: '20–150 m' },
      { label: 'Types Available', value: 'Mobile, Tower, Pick & Carry' },
      { label: 'Certifications', value: 'Load-tested & insured' },
    ],
    faqs: [
      { q: 'What is the crane rental rate per day in India?', a: 'A 10–15 ton pick-and-carry crane starts from ₹8,000/day. Hydraulic mobile cranes (50–100 ton) range from ₹20,000–₹45,000/day. Tower cranes for long-term projects are quoted on monthly contracts.' },
      { q: 'What permits are needed to operate a crane?', a: 'The crane vendor handles all permits and statutory compliance. TransRentals-listed vendors have valid lift permits, load test certificates, and third-party insurance. For tower cranes on high-rise projects, the vendor arranges required NOCs.' },
      { q: 'What is the difference between a mobile and tower crane?', a: 'A mobile crane is truck or crawler-mounted and can be moved between sites. It is ideal for one-time lifts. A tower crane is fixed for the duration of a project with greater height reach — used for high-rise buildings.' },
      { q: 'How far in advance should I book a crane?', a: 'For small mobile cranes (10–30 ton), 24–48 hours notice is usually sufficient. For large hydraulic cranes and tower cranes, book 5–10 days in advance. Out-of-city mobilization requires 3–7 days additional lead time.' },
      { q: 'Is crane operator included in the rental?', a: 'Yes. All crane rentals on TransRentals include a certified crane operator and rigger. The operator holds valid DGMS or BOCW certification for safe site operation.' },
    ],
  },
  excavator: {
    name: 'Excavator Rental',
    fullName: 'Hydraulic Excavator',
    startingPrice: '₹3,500',
    priceUnit: '/day',
    icon: '⛏️',
    useCases: ['Deep excavation', 'Basement digging', 'Mining & quarrying', 'Demolition', 'Canal dredging', 'Large earthworks'],
    description: 'Hydraulic excavators (Hitachi, Volvo, Komatsu, Tata Hitachi) for heavy earthmoving, deep digging, and large-scale civil construction projects. Available in mini (1 ton) to large (45 ton) configurations.',
    specs: [
      { label: 'Bucket Capacity', value: '0.3–2.0 m³' },
      { label: 'Digging Depth', value: '4–9 m' },
      { label: 'Engine Power', value: '93–270 hp' },
      { label: 'Operating Weight', value: '10,000–45,000 kg' },
    ],
    faqs: [
      { q: 'What is the excavator rental cost per day in India?', a: 'Mini excavators (0.8–1.5 ton) start from ₹3,500/day. Standard excavators (14–20 ton) are priced ₹6,000–₹9,000/day. Large excavators (30–45 ton) start from ₹12,000/day. All rates include operator; fuel is separate.' },
      { q: 'What is the difference between an excavator and a JCB?', a: 'A JCB backhoe loader is versatile but smaller. A dedicated hydraulic excavator has larger bucket sizes, greater digging depth (up to 9 m), and better performance for continuous earthmoving. For projects needing more than 3 m depth or large soil volumes, an excavator is the right choice.' },
      { q: 'What brands of excavators are available?', a: 'Hitachi (ZX series), Volvo (EC series), Komatsu (PC series), JCB (JS series), and Tata Hitachi models are commonly available. Specific brand availability varies by city.' },
      { q: 'Can I rent an excavator for a single day?', a: 'Yes. Minimum billing is 8 working hours. Half-day rates may be available for shorter tasks. For multi-week projects, monthly contracts offer 20–30% savings over daily rates.' },
      { q: 'Is an operator included with the excavator rental?', a: 'Yes, all excavator rentals on TransRentals include a certified, experienced operator. The operator is responsible for safe machine operation, soil classification, and site safety compliance.' },
    ],
  },
  generator: {
    name: 'Generator on Rent',
    fullName: 'DG Set / Generator',
    startingPrice: '₹1,500',
    priceUnit: '/day',
    icon: '⚡',
    useCases: ['Construction site power', 'Events & weddings', 'Industrial backup', 'Hospital power backup', 'Data center UPS', 'Remote site power'],
    description: 'Silent DG sets and diesel generators from 7.5 kVA to 2000 kVA for events, construction sites, industrial operations, and emergency power backup. Kirloskar, Cummins, and KOEL models available.',
    specs: [
      { label: 'Capacity Range', value: '7.5–2000 kVA' },
      { label: 'Fuel Type', value: 'Diesel (HSD)' },
      { label: 'Popular Brands', value: 'Kirloskar, Cummins, KOEL' },
      { label: 'Sound Level', value: 'Silent (65 dB) / Open' },
    ],
    faqs: [
      { q: 'What is the generator rental rate in India?', a: 'Generator rental: 25 kVA from ₹1,500/day, 62.5 kVA from ₹2,500/day, 125 kVA from ₹4,000/day, 250 kVA from ₹7,000/day, 500 kVA from ₹12,000/day. Diesel fuel is charged separately at consumption.' },
      { q: 'What generator size do I need for my event?', a: 'For weddings and events (300–500 guests): 25–62.5 kVA. For construction sites: 62.5–125 kVA for tools and lighting. For industrial use: 250–2000 kVA. Rough rule: connected load (kW) × 1.25 = required kVA.' },
      { q: 'Is fuel included in generator rental?', a: 'No, fuel is not included. The client provides diesel at the site. Some vendors offer an all-inclusive with-fuel package — confirm at booking on TransRentals.' },
      { q: 'Are silent generators available for residential events?', a: 'Yes, acoustic-enclosure (silent) DG sets operate at 65–75 dB, meeting most local noise limit requirements for residential colonies and wedding venues.' },
      { q: 'How quickly can a generator be deployed?', a: 'Standard generators (up to 125 kVA) can be deployed with 24 hours notice. Larger generators (250 kVA+) may require 48–72 hours for transportation and installation. Emergency deployments are available in select cities.' },
    ],
  },
  tipper: {
    name: 'Tipper Truck Rental',
    fullName: 'Tipper / Dumper Truck',
    startingPrice: '₹3,000',
    priceUnit: '/day',
    icon: '🚛',
    useCases: ['Construction debris removal', 'Sand & aggregate supply', 'Road construction material', 'Demolition waste', 'Mining output transport', 'Landfill operations'],
    description: 'Tata, Ashok Leyland, and BEML tipper trucks (dumpers) for construction material transport, demolition waste removal, and earthwork sites. Available in 7 to 20 cubic metre capacity.',
    specs: [
      { label: 'Body Capacity', value: '7–20 cubic metre' },
      { label: 'Payload', value: '8–25 tonnes' },
      { label: 'Popular Models', value: 'Tata 1212, 2516, Ashok Leyland' },
      { label: 'Drive Type', value: '4×2 and 6×4 available' },
    ],
    faqs: [
      { q: 'What is the tipper truck rent per day?', a: 'Small tipper (7 cubic metre) starts from ₹3,000/day. Medium (10 cubic metre) from ₹4,500/day. Large tipper (16–20 cubic metre) from ₹6,000/day. Rates include driver; fuel and loading charges are separate.' },
      { q: 'How many trips can a tipper complete per day?', a: 'For a 1–2 km haul: 10–14 trips/day. For 5 km: 6–8 trips. For 10–15 km: 4–5 trips. This helps calculate how many tippers you need for a continuous material supply chain.' },
      { q: 'What is the difference between a tipper and a dumper?', a: 'Tipper trucks and dumper trucks are the same type of vehicle. Both refer to trucks with a hydraulic-powered tilting bed that discharges material from the rear or side.' },
      { q: 'Is tipper available for demolition debris removal?', a: 'Yes, tipper trucks are used for both material delivery (sand, aggregate) and demolition debris removal (concrete rubble, steel, tiles). Confirm whether the vendor has municipal dumping yard arrangements in your city.' },
      { q: 'Is the driver included in tipper truck rental?', a: 'Yes, all tipper truck rentals on TransRentals include a licensed driver with valid goods vehicle license. Loading and unloading labor is available as an additional add-on.' },
    ],
  },
  'road-roller': {
    name: 'Road Roller Rental',
    fullName: 'Road Roller / Compactor',
    startingPrice: '₹2,800',
    priceUnit: '/day',
    icon: '🛣️',
    useCases: ['Road compaction', 'Highway construction', 'Bitumen laying', 'Sub-base compaction', 'Parking lot construction', 'Airport tarmac work'],
    description: 'Smooth drum and padfoot road rollers for road construction, highway compaction, and sub-base preparation. Dynapac, HAMM, and L&T Komatsu models available with certified operators.',
    specs: [
      { label: 'Static Weight', value: '8–25 tonnes' },
      { label: 'Types', value: 'Smooth Drum, Padfoot, Pneumatic' },
      { label: 'Popular Brands', value: 'Dynapac, HAMM, L&T Komatsu' },
      { label: 'Working Speed', value: '0–10 km/h' },
    ],
    faqs: [
      { q: 'What is the road roller rental rate in India?', a: '8–10 tonne smooth drum from ₹2,800/day. 12–15 tonne from ₹4,000/day. 20–25 tonne from ₹6,000/day. Pneumatic tyre rollers start from ₹3,500/day. Rates include operator.' },
      { q: 'Which type of roller is used for bituminous roads?', a: 'Bituminous road construction uses three rollers in sequence: (1) Breakdown roller (10–12 tonne vibratory) for initial compaction, (2) Pneumatic tyre roller for intermediate compaction, (3) Tandem roller for final finishing.' },
      { q: 'Is a road roller the same as a compactor?', a: 'They overlap in function. Road rollers are larger machines for highway projects. Compactors are smaller for trench backfill, foundation compaction, and smaller urban areas.' },
      { q: 'Can road rollers be used for private projects like parking lots?', a: 'Yes, road rollers are hired for all types of compaction — from NH highway projects to private parking lots, villa compound walls, and factory floor sub-base preparation.' },
      { q: 'Is the operator included with road roller rental?', a: 'Yes, all road roller rentals on TransRentals include a certified operator trained in compaction standards and road construction safety protocols.' },
    ],
  },
};

const EQUIPMENT_TYPE_SLUGS = Object.keys(EQUIPMENT_TYPES);

const TOP_20_CITIES = [
  { name: 'Delhi', slug: 'delhi' },
  { name: 'Mumbai', slug: 'mumbai' },
  { name: 'Bangalore', slug: 'bangalore' },
  { name: 'Hyderabad', slug: 'hyderabad' },
  { name: 'Chennai', slug: 'chennai' },
  { name: 'Pune', slug: 'pune' },
  { name: 'Kolkata', slug: 'kolkata' },
  { name: 'Ahmedabad', slug: 'ahmedabad' },
  { name: 'Jaipur', slug: 'jaipur' },
  { name: 'Surat', slug: 'surat' },
  { name: 'Lucknow', slug: 'lucknow' },
  { name: 'Nagpur', slug: 'nagpur' },
  { name: 'Visakhapatnam', slug: 'visakhapatnam' },
  { name: 'Chandigarh', slug: 'chandigarh' },
  { name: 'Bhopal', slug: 'bhopal' },
  { name: 'Indore', slug: 'indore' },
  { name: 'Coimbatore', slug: 'coimbatore' },
  { name: 'Kochi', slug: 'kochi' },
  { name: 'Vadodara', slug: 'vadodara' },
  { name: 'Patna', slug: 'patna' },
];

export function generateStaticParams() {
  const subLocationParams = getSubLocationStaticParams('equipment-rental');
  const typeParams = TOP_20_CITIES.flatMap((city) =>
    EQUIPMENT_TYPE_SLUGS.map((type) => ({ location: city.slug, sublocation: type }))
  );
  return [...subLocationParams, ...typeParams];
}

export const revalidate = 3600;
export const dynamicParams = false;

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cityName = getCityNameFromSlug(params.location);
  const eqType = EQUIPMENT_TYPES[params.sublocation];

  if (eqType) {
    const title = `${eqType.name} in ${cityName} | ${eqType.fullName} Hire | TransRentals`;
    const description = `Rent ${eqType.fullName} in ${cityName}. Certified operators included. Starting ${eqType.startingPrice}${eqType.priceUnit}. Get free quotes from verified vendors on TransRentals.`;
    return {
      title,
      description,
      alternates: { canonical: `https://transrentals.in/equipment-rental/${params.location}/${params.sublocation}` },
      openGraph: {
        title,
        description,
        type: 'website',
        url: `https://transrentals.in/equipment-rental/${params.location}/${params.sublocation}`,
        images: [{ url: `https://transrentals.in/api/og?service=equipment-rental&location=${encodeURIComponent(cityName)}`, width: 1200, height: 630 }],
        locale: 'en_IN',
        siteName: 'TransRentals',
      },
      twitter: { card: 'summary_large_image', title, description, images: [`https://transrentals.in/api/og?service=equipment-rental&location=${encodeURIComponent(cityName)}`] },
      robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' } },
    };
  }

  const sl = getSubLocation('equipment-rental', params.location, params.sublocation);
  if (!sl) return { title: 'Equipment Rental | TransRentals' };

  const title = `Equipment Rental in ${sl.name}, ${cityName} | JCB, Crane, Generator | TransRentals`;
  const description = `Rent construction and event equipment in ${sl.name}, ${cityName}. JCB, excavators, cranes, generators. Certified operators included. Starting ₹2,999/day.`;

  return {
    title,
    description,
    alternates: { canonical: `https://transrentals.in/equipment-rental/${params.location}/${params.sublocation}` },
    openGraph: {
      title: `Equipment Rental in ${sl.name}, ${cityName} | TransRentals`,
      description,
      type: 'website',
      url: `https://transrentals.in/equipment-rental/${params.location}/${params.sublocation}`,
      images: [{ url: `https://transrentals.in/api/og?service=equipment-rental&location=${encodeURIComponent(cityName)}`, width: 1200, height: 630 }],
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    twitter: { card: 'summary_large_image', title: `Equipment Rental in ${sl.name}, ${cityName}`, description, images: [`https://transrentals.in/api/og?service=equipment-rental&location=${encodeURIComponent(cityName)}`] },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' } },
  };
}

// ─── Area FAQ helper (for non-type sub-locations) ────────────────────────────

const AREA_FAQS = (slName: string, cityName: string) => [
  { q: `What equipment is available for rent in ${slName}, ${cityName}?`, a: `Available equipment in ${slName}: JCB backhoe loaders, hydraulic excavators, cranes (pick-and-carry, tower), road rollers, tipper trucks, generators (15–500 kVA), and concrete mixers. Certified operators included.` },
  { q: `Is operator included with equipment rental in ${slName}?`, a: `Yes, all heavy equipment rentals in ${slName} include a certified, experienced operator. Client must provide site access and necessary permissions.` },
  { q: `What is the JCB rental rate in ${slName}?`, a: `JCB backhoe loader starts from ₹2,999/day with operator in ${slName}. Standard rental is 8 working hours. Fuel is typically arranged by the client at site.` },
  { q: `How far in advance should I book equipment in ${slName}?`, a: `For standard equipment (JCB, excavator, generator), book 48–72 hours in advance. For rare or heavy equipment (large cranes, piling rigs), book 5–7 days ahead.` },
  { q: `Is generator rental available in ${slName}?`, a: `Yes, generators from 15 kVA to 500 kVA are available in ${slName} for events, construction sites, and industrial backup.` },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EquipmentSubLocationPage({ params }: PageProps) {
  const cityName = getCityNameFromSlug(params.location);
  const eqType = EQUIPMENT_TYPES[params.sublocation];

  // ── Equipment-type page ───────────────────────────────────────────────────
  if (eqType) {
    const otherTypes = EQUIPMENT_TYPE_SLUGS.filter((t) => t !== params.sublocation);
    return (
      <div className="flex flex-col">
        {/* Breadcrumbs */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/equipment-rental" className="hover:text-primary">Equipment Rental</a>
              <span className="mx-2">/</span>
              <a href={`/equipment-rental/${params.location}`} className="hover:text-primary">{cityName}</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{eqType.name}</span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <section className="py-14 bg-gradient-to-br from-yellow-50 to-amber-50 border-b border-gray-200">
          <div className="container-custom max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full mb-4">
              {eqType.icon} {eqType.fullName} · {cityName}
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {eqType.name} in {cityName}
            </h1>
            <p className="text-lg text-gray-600 mb-2">{eqType.description}</p>
            <p className="text-2xl font-bold text-yellow-600 mb-6">Starting {eqType.startingPrice}<span className="text-base font-normal text-gray-500">{eqType.priceUnit} (operator included)</span></p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/equipment-rental/${params.location}`}
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-yellow-600 hover:text-yellow-700 transition-colors"
              >
                All Equipment in {cityName}
              </Link>
            </div>
          </div>
        </section>

        {/* Specs + Use Cases */}
        <section className="py-12 bg-white">
          <div className="container-custom max-w-4xl">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Specs */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Technical Specifications</h2>
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  {eqType.specs.map((spec, i) => (
                    <div key={i} className={`flex justify-between items-center px-5 py-3 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <span className="text-sm text-gray-600 font-medium">{spec.label}</span>
                      <span className="text-sm font-bold text-gray-900">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Use Cases */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h2>
                <div className="grid grid-cols-2 gap-3">
                  {eqType.useCases.map((use) => (
                    <div key={use} className="flex items-center gap-2 bg-yellow-50 rounded-lg px-4 py-3">
                      <span className="text-yellow-600 font-bold flex-shrink-0">✓</span>
                      <span className="text-sm font-medium text-gray-800">{use}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-14 bg-gray-50">
          <div className="container-custom max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {eqType.name} in {cityName} — FAQs
            </h2>
            <div className="space-y-3">
              {eqType.faqs.map((faq, i) => (
                <details key={i} className="bg-white rounded-xl border border-gray-100 group">
                  <summary className="px-5 py-4 font-medium text-gray-900 cursor-pointer select-none list-none flex justify-between items-center">
                    {faq.q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform ml-4 flex-shrink-0">▾</span>
                  </summary>
                  <p className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Other equipment types in this city */}
        <section className="py-10 bg-white border-t border-gray-100">
          <div className="container-custom max-w-4xl">
            <h2 className="text-base font-bold text-gray-800 mb-4">Other Equipment on Rent in {cityName}</h2>
            <div className="flex flex-wrap gap-3">
              <Link href={`/equipment-rental/${params.location}`} className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-full text-sm font-medium hover:bg-yellow-700 transition-colors">
                ← All Equipment in {cityName}
              </Link>
              {otherTypes.map((t) => (
                <Link key={t} href={`/equipment-rental/${params.location}/${t}`} className="inline-flex items-center px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-yellow-500 hover:text-yellow-700 transition-colors">
                  {EQUIPMENT_TYPES[t].name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* This type in other cities */}
        <section className="py-10 bg-gray-50 border-t border-gray-100">
          <div className="container-custom max-w-4xl">
            <h2 className="text-base font-bold text-gray-800 mb-4">{eqType.name} in Other Cities</h2>
            <div className="flex flex-wrap gap-3">
              {TOP_20_CITIES.filter((c) => c.slug !== params.location).slice(0, 12).map((city) => (
                <Link key={city.slug} href={`/equipment-rental/${city.slug}/${params.sublocation}`} className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-yellow-500 hover:text-yellow-700 transition-colors">
                  {eqType.name.split(' ')[0]} in {city.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Schemas */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Service',
          name: `${eqType.name} in ${cityName}`,
          description: eqType.description,
          serviceType: eqType.fullName,
          url: `https://transrentals.in/equipment-rental/${params.location}/${params.sublocation}`,
          provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
          areaServed: { '@type': 'City', name: cityName, addressCountry: 'IN' },
          offers: { '@type': 'Offer', priceCurrency: 'INR', price: parseFloat(eqType.startingPrice.replace('₹', '').replace(',', '')) },
        })}} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
            { '@type': 'ListItem', position: 2, name: 'Equipment Rental', item: 'https://transrentals.in/equipment-rental' },
            { '@type': 'ListItem', position: 3, name: `Equipment Rental in ${cityName}`, item: `https://transrentals.in/equipment-rental/${params.location}` },
            { '@type': 'ListItem', position: 4, name: `${eqType.name} in ${cityName}`, item: `https://transrentals.in/equipment-rental/${params.location}/${params.sublocation}` },
          ],
        })}} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'FAQPage',
          mainEntity: eqType.faqs.map((faq) => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })),
        })}} />
      </div>
    );
  }

  // ── Area sub-location page ────────────────────────────────────────────────
  const sl = getSubLocation('equipment-rental', params.location, params.sublocation);
  if (!sl) notFound();

  const citySubLocations = CITY_SUBLOCATIONS['equipment-rental']?.[params.location] ?? [];
  const siblings = citySubLocations
    .filter((s) => s.slug !== params.sublocation && !EQUIPMENT_TYPE_SLUGS.includes(s.slug))
    .slice(0, 4);
  const faqs = AREA_FAQS(sl.name, cityName);

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/equipment-rental" className="hover:text-primary">Equipment Rental</a>
            <span className="mx-2">/</span>
            <a href={`/equipment-rental/${params.location}`} className="hover:text-primary">{cityName}</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{sl.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="py-14 bg-gradient-to-br from-yellow-50 to-amber-50 border-b border-gray-200">
        <div className="container-custom max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
            Equipment Rental in {sl.name}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Equipment Rental in {sl.name}, {cityName}
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl">{sl.description}</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/equipment-rental/${params.location}`}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-yellow-600 hover:text-yellow-700 transition-colors"
            >
              All Equipment in {cityName}
            </Link>
          </div>
        </div>
      </section>

      {/* Equipment Grid */}
      <section className="py-12 bg-white">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Equipment Available in {sl.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'JCB Backhoe Loader', category: 'Earthmoving', price: 'From ₹2,999/day', tag: 'Most Popular' },
              { name: 'Hydraulic Excavator', category: 'Earthmoving', price: 'From ₹3,500/day', tag: '' },
              { name: 'Pick-and-Carry Crane', category: 'Lifting', price: 'From ₹4,500/day', tag: '' },
              { name: 'Road Roller', category: 'Compaction', price: 'From ₹3,000/day', tag: '' },
              { name: 'Generator (15–500 kVA)', category: 'Power', price: 'From ₹1,499/day', tag: 'Events & Sites' },
              { name: 'Tipper Truck', category: 'Transport', price: 'From ₹3,000/day', tag: '' },
            ].map((eq) => (
              <div key={eq.name} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                {eq.tag && <div className="text-xs font-semibold text-yellow-700 bg-yellow-50 rounded-full px-2 py-0.5 mb-2 inline-block">{eq.tag}</div>}
                <p className="font-bold text-gray-900 text-sm">{eq.name}</p>
                <p className="text-xs text-gray-500">{eq.category}</p>
                <p className="text-yellow-600 font-bold mt-2 text-sm">{eq.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment types in this city */}
      <section className="py-10 bg-gray-50 border-t border-gray-100">
        <div className="container-custom max-w-4xl">
          <h2 className="text-base font-bold text-gray-800 mb-4">Equipment by Type in {cityName}</h2>
          <div className="flex flex-wrap gap-3">
            {EQUIPMENT_TYPE_SLUGS.map((t) => (
              <Link key={t} href={`/equipment-rental/${params.location}/${t}`} className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-yellow-500 hover:text-yellow-700 transition-colors">
                {EQUIPMENT_TYPES[t].icon} {EQUIPMENT_TYPES[t].name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-14 bg-white">
        <div className="container-custom max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">FAQs — Equipment Rental in {sl.name}</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-gray-50 rounded-xl border border-gray-100 group">
                <summary className="px-5 py-4 font-medium text-gray-900 cursor-pointer select-none list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform ml-4 flex-shrink-0">▾</span>
                </summary>
                <p className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Siblings */}
      {siblings.length > 0 && (
        <section className="py-10 bg-gray-50 border-t border-gray-200">
          <div className="container-custom max-w-4xl">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Equipment Rental in Other Areas of {cityName}</h2>
            <div className="flex flex-wrap gap-3">
              <Link href={`/equipment-rental/${params.location}`} className="inline-flex items-center gap-1 px-4 py-2 bg-yellow-600 text-white rounded-full text-sm font-medium hover:bg-yellow-700 transition-colors">
                ← All Equipment in {cityName}
              </Link>
              {siblings.map((s) => (
                <Link key={s.slug} href={`/equipment-rental/${params.location}/${s.slug}`} className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:border-yellow-600 hover:text-yellow-700 transition-colors">
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Schemas */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'LocalBusiness',
        name: `Equipment Rental in ${sl.name}, ${cityName} — TransRentals`,
        description: sl.description,
        url: `https://transrentals.in/equipment-rental/${params.location}/${params.sublocation}`,
        areaServed: { '@type': 'Place', name: `${sl.name}, ${cityName}`, addressCountry: 'IN' },
        provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
        priceRange: '₹₹',
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
          { '@type': 'ListItem', position: 2, name: 'Equipment Rental', item: 'https://transrentals.in/equipment-rental' },
          { '@type': 'ListItem', position: 3, name: `Equipment Rental in ${cityName}`, item: `https://transrentals.in/equipment-rental/${params.location}` },
          { '@type': 'ListItem', position: 4, name: `Equipment Rental in ${sl.name}`, item: `https://transrentals.in/equipment-rental/${params.location}/${params.sublocation}` },
        ],
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })),
      })}} />
    </div>
  );
}
