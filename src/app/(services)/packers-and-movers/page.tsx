import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Shield, Star, Clock, MapPin, Package } from 'lucide-react';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { HowToSchema } from '@/components/seo/schemas';

const PACKERS_FAQS = [
  {
    q: 'What is the cost of packers and movers in India?',
    a: 'Local 1BHK shifting starts from ₹3,000–₹5,000. 2BHK local move costs ₹5,000–₹9,000. 3BHK local shift costs ₹8,000–₹14,000. Intercity moves are distance-based: short routes (under 300 km) start from ₹8,000 for 1BHK; long-distance (1,000+ km) starts from ₹15,000. Rates vary by city, floor (lift/no lift), packing quality, and whether insurance is included.',
  },
  {
    q: 'How do I choose reliable packers and movers?',
    a: 'On TransRentals, all listed movers are pre-verified with GST registration, moving license, and customer reviews. Check: (1) IBA panel registration for government employees, (2) customer star rating (minimum 4.0), (3) whether transit insurance is offered, (4) whether the quote is itemised (packing materials listed separately), and (5) whether a physical survey was done before quoting.',
  },
  {
    q: 'How long does it take to shift a 2BHK house?',
    a: 'A professional team of 3–4 people takes 6–10 hours for a 2BHK intra-city shift (packing + loading + transit + unloading). Ground floor with lift: faster. 4th floor without lift: slower. For intercity moves, transit is additional — 1–3 days for nearby cities, 4–7 days for pan-India routes.',
  },
  {
    q: 'Is transit insurance mandatory for household shifting?',
    a: 'Transit insurance is optional but strongly recommended. TransRentals vendors offer declared-value insurance at 0.5–1% of goods value. For electronics (TV, AC, refrigerator), antiques, and artwork — always opt for insurance. Without it, mover liability is typically limited to ₹100–₹500 per kg by weight under standard terms, which may not cover actual damage.',
  },
  {
    q: 'What is the best time to book packers and movers?',
    a: 'Month-end (25th–31st) is the busiest period — book at least 5–7 days in advance. Transfer season (May–June, post-monsoon Sep–Oct) requires 2–3 weeks advance booking. Mid-month weekdays (Tuesday–Thursday) are typically least busy. Avoid booking on public holidays — surcharges apply and team availability is limited.',
  },
  {
    q: 'What is the GST rate on packers and movers services?',
    a: 'GST on packers and movers in India: (1) Pure goods transport (GTA — Goods Transport Agency): 5% GST, no input tax credit. (2) Full packing + moving service (not classified as GTA): 18% GST. Most household movers fall under the 18% GST category. Always ask for a GST invoice — it is mandatory for corporate reimbursement and IBA claims.',
  },
  {
    q: 'How do I detect and avoid fraudulent packers and movers?',
    a: 'Warning signs of fraud: (1) No GST registration or GSTIN on the bill. (2) Asking for full payment before the move starts. (3) Extremely low quotes (50–60% below market rate). (4) No written contract or itemised quote. (5) No physical survey before quoting. (6) Not providing a company address or contact person. Always verify GSTIN on the GST portal before booking. Use TransRentals-listed movers for verified, background-checked vendors.',
  },
  {
    q: 'Do packers and movers disassemble and reassemble furniture?',
    a: 'Yes, standard movers include dismantling and reassembly of beds, wardrobes, and modular furniture. Always confirm this is in your written quote. AC installation/removal typically costs ₹500–₹1,500 extra. Modular kitchen cabinets may or may not be included — confirm before the shift. Pianos and antique furniture require specialist handlers — mention these upfront.',
  },
  {
    q: 'What items cannot be moved by packers and movers?',
    a: 'Items movers typically refuse: LPG cylinders (must be surrendered before shifting), flammable/hazardous materials, cash, jewellery (carry personally), important documents (originals — carry personally), perishable food, live plants, and pets. Vehicles must be booked as a separate car/bike transport service. Confirm your vendor\'s restricted items list in writing before the move.',
  },
  {
    q: 'What is the difference between full-truck-load (FTL) and shared/part-load moving?',
    a: 'FTL (Full Truck Load): Entire truck is dedicated to your goods. Faster transit (direct delivery), less handling, lower damage risk. Recommended for 2BHK and above or high-value goods. Part-load (Shared): Your goods are consolidated with others moving on the same route. 30–40% cheaper, but slower transit (2–5 extra days) and more handling points. Best for 1BHK, studio, or single-room moves.',
  },
  {
    q: 'What is IBA-approved movers and why does it matter?',
    a: 'IBA (Indian Banks Association) approval is mandatory for government and PSU employees claiming moving allowance from their employer. IBA-approved movers meet specific standards for packing, insurance, and billing. If you are a central government employee, bank employee, or PSU worker — always confirm IBA status before booking. TransRentals shows IBA approval status on each vendor listing.',
  },
  {
    q: 'How do I file a damage claim after a move?',
    a: 'Step 1: At delivery, do NOT sign the receipt if you notice damaged goods — note damages on the receipt before signing. Step 2: Photograph all damaged items immediately. Step 3: Report to the mover\'s customer service within 24–48 hours (most contracts have a reporting window). Step 4: File claim with the insurance company if goods were insured — submit photos and the original inventory list. Step 5: Contact TransRentals support if the mover does not respond — we mediate on your behalf.',
  },
  {
    q: 'Can I track my goods during an intercity move?',
    a: 'Yes, most TransRentals-listed intercity movers provide GPS tracking or WhatsApp updates during transit. For FTL moves, your dedicated truck can be tracked in real time. For shared/part-load, vendors provide depot-to-depot status updates. Ask for the driver\'s contact number at the time of loading — direct communication reduces transit anxiety.',
  },
  {
    q: 'What questions should I ask a mover before confirming the booking?',
    a: 'Ask: (1) Is the quote itemised (packing materials, labour, transport, insurance separate)? (2) Is the truck dedicated to my goods or shared? (3) What is the transit timeline? (4) What is the damage liability and claims process? (5) Is transit insurance included or extra? (6) Do you have GST registration and IBA approval? (7) What items are excluded from the quote? (8) Is the packing materials cost included or billed separately at actuals? Get all answers in writing before paying any advance.',
  },
  {
    q: 'What is the best day to move in India?',
    a: 'Tuesday, Wednesday, and Thursday are the best days to move — least busy for movers, best team availability, and no weekend surcharges. Avoid Saturday and Sunday (high demand, 10–20% surcharge common). Avoid last 3 days of the month (highest demand). Avoid national holidays. Morning start (7–9 AM) is best — more working hours before evening traffic.',
  },
];

const SERVICE_TYPES = [
  {
    icon: '🏠',
    title: 'Home Shifting',
    desc: 'Complete door-to-door household moving — packing, loading, transit, and unloading. Available for 1BHK, 2BHK, 3BHK, and villas.',
  },
  {
    icon: '🏢',
    title: 'Office Relocation',
    desc: 'Professional office shifting with proper labelling, IT equipment packing, and after-hours scheduling to minimise business downtime.',
  },
  {
    icon: '🛣️',
    title: 'Intercity Moving',
    desc: 'Pan-India household and commercial goods transport. Full-truck-load and shared (part-load) options for all routes.',
  },
  {
    icon: '🚗',
    title: 'Vehicle Transport',
    desc: 'Car and two-wheeler transport on enclosed trailers or open carriers. Available alongside household shifting or as a standalone service.',
  },
  {
    icon: '📦',
    title: 'Storage Solutions',
    desc: 'Temporary warehouse storage for goods during gap between move-out and move-in dates. Available in select cities.',
  },
  {
    icon: '🏭',
    title: 'Industrial & Commercial',
    desc: 'Factory machinery relocation, shop shifting, and bulk commercial goods transport with heavy-duty packing and rigging support.',
  },
];

const WHAT_IS_INCLUDED = [
  { icon: '📦', title: 'Packing Materials', desc: 'Boxes, bubble wrap, stretch film, and edge protectors for all goods' },
  { icon: '🔧', title: 'Furniture Dismantling', desc: 'Beds, wardrobes, and modular furniture disassembled and reassembled' },
  { icon: '🚛', title: 'Loading & Transport', desc: 'Professional loading team and insured transport vehicle' },
  { icon: '🏠', title: 'Unloading & Unpacking', desc: 'Unloading, placement in rooms, and unpacking on request' },
  { icon: '🛡️', title: 'Transit Insurance', desc: 'Optional declared-value insurance for electronics and high-value items' },
  { icon: '📋', title: 'Inventory List', desc: 'Detailed inventory of goods packed for accountability during transit' },
];

const HOW_IT_WORKS = [
  { step: 1, title: 'Request a Quote', desc: 'Share your shift details — home size, pickup city, delivery city, and preferred date', icon: MapPin },
  { step: 2, title: 'Compare Vendors', desc: 'Get quotes from multiple TransRentals-verified packers. Compare price, rating, and inclusions', icon: Star },
  { step: 3, title: 'Confirm Booking', desc: 'Confirm your preferred vendor with a small advance. Receive a booking confirmation and vendor contact', icon: CheckCircle },
  { step: 4, title: 'Shift & Settle', desc: 'The team arrives, packs professionally, transports safely, and unloads at your new home', icon: Package },
];

const TRUST_POINTS = [
  { icon: '✅', title: 'GST-Verified Vendors', desc: 'All listed movers have valid GST registration and moving licenses' },
  { icon: '⭐', title: '4.7/5 Average Rating', desc: 'Ratings from real customers post-shift — no fake reviews' },
  { icon: '🛡️', title: 'Transit Insurance', desc: 'Optional coverage for your goods during transport' },
  { icon: '📋', title: 'IBA-Approved Movers', desc: 'Government-transfer-eligible movers listed for CPWD and PSU employees' },
  { icon: '🔍', title: 'Background-Checked Teams', desc: 'Moving teams are verified by vendor before deployment' },
  { icon: '📞', title: 'Post-Move Support', desc: 'TransRentals support available if any issue arises after the shift' },
];

const TOP_CITIES = [
  { name: 'Mumbai', slug: 'mumbai' },
  { name: 'Delhi', slug: 'delhi' },
  { name: 'Bangalore', slug: 'bangalore' },
  { name: 'Hyderabad', slug: 'hyderabad' },
  { name: 'Chennai', slug: 'chennai' },
  { name: 'Pune', slug: 'pune' },
  { name: 'Ahmedabad', slug: 'ahmedabad' },
  { name: 'Kolkata', slug: 'kolkata' },
  { name: 'Jaipur', slug: 'jaipur' },
  { name: 'Lucknow', slug: 'lucknow' },
  { name: 'Nagpur', slug: 'nagpur' },
  { name: 'Indore', slug: 'indore' },
];

export const metadata: Metadata = {
  title: 'Packers and Movers India | Home Shifting | Starting from ₹3,999 | TransRentals',
  description:
    'Book verified packers and movers across 50+ Indian cities. Local and intercity home shifting, office relocation, vehicle transport. IBA-approved, insured moving teams. Compare quotes and book online.',
  keywords: [
    'packers and movers',
    'packers and movers in India',
    'movers and packers',
    'home shifting service',
    'office relocation',
    'household shifting',
    'intercity movers',
    'packers movers cost',
    'best packers and movers',
    'local shifting',
    'verified movers India',
    'iba approved movers',
    'home shifting near me',
    'cheap packers and movers',
  ],
  openGraph: {
    title: 'Packers and Movers in India | TransRentals',
    description: 'Verified packers and movers across 50+ Indian cities. Home shifting, office relocation, intercity moves. IBA-approved and insured.',
    type: 'website',
    url: 'https://transrentals.in/packers-and-movers',
    images: [{ url: 'https://transrentals.in/api/og?service=packers-and-movers', width: 1200, height: 630, alt: 'Packers and Movers - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Packers and Movers in India | TransRentals',
    description: 'Verified packers and movers across 50+ Indian cities. IBA-approved, insured moving teams.',
    images: ['https://transrentals.in/api/og?service=packers-and-movers'],
  },
  alternates: { canonical: 'https://transrentals.in/packers-and-movers' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export default function PackersAndMoversPage() {
  return (
    <div className="flex flex-col">
      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: PACKERS_FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: { '@type': 'Answer', text: faq.a },
            })),
          }),
        }}
      />
      {/* MovingCompany Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MovingCompany',
            name: 'Packers and Movers India — TransRentals',
            description: 'Professional home shifting, office relocation, and intercity moving services across India. IBA-approved, insured, and GST-verified moving teams.',
            url: 'https://transrentals.in/packers-and-movers',
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            areaServed: { '@type': 'Country', name: 'India' },
            priceRange: '₹₹',
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Moving Services',
              itemListElement: [
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Home Shifting' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Office Relocation' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Intercity Moving' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Vehicle Transport' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Storage Solutions' } },
              ],
            },
          }),
        }}
      />
      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
              { '@type': 'ListItem', position: 2, name: 'Packers and Movers', item: 'https://transrentals.in/packers-and-movers' },
            ],
          }),
        }}
      />

      <HowToSchema
        name="How to Book Packers and Movers on TransRentals"
        description="Book verified, insured packers and movers for home shifting, office relocation, and intercity moves across India."
        totalTime="PT15M"
        steps={[
          { name: 'Request a Quote', text: 'Share your shift details — home size (1BHK/2BHK), pickup city, delivery city, and preferred move date.' },
          { name: 'Compare Vendors', text: 'Get quotes from multiple TransRentals-verified packers. Compare price, star rating, IBA status, and inclusions.' },
          { name: 'Confirm Booking', text: 'Confirm your preferred vendor with a small advance payment. Receive booking confirmation and vendor contact details.' },
          { name: 'Shift & Settle', text: 'The team arrives, packs professionally using quality materials, transports safely with insurance, and unloads at your new home.' },
        ]}
      />
      {/* Hero */}
      <ServiceHeroWithChat
        badge="Packers & Movers"
        title="Verified Packers & Movers"
        titleHighlight="Across 50+ Cities"
        description="Home shifting, office relocation, intercity moves. IBA-approved, insured, and GST-verified moving teams. Compare quotes from multiple vendors and book online."
        features={[
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Insured Moving', color: 'text-blue-600' },
          { icon: 'zap', text: 'Free Quotes', color: 'text-green-600' },
        ]}
        gradientFrom="blue-50"
        gradientTo="indigo-50"
      />

      {/* Service Types */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Types of Moving Services</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            From single-room shifts to full office relocations — TransRentals has verified vendors for every type of move.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICE_TYPES.map((service) => (
              <div key={service.title} className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-md hover:shadow-xl transition border border-blue-100">
                <div className="text-4xl mb-3">{service.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="text-center p-6 bg-white rounded-xl shadow-md">
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Step {step}</div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">What&apos;s Included in Your Move</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            A standard packers and movers booking on TransRentals covers the full shifting experience — from packing to placement.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {WHAT_IS_INCLUDED.map((item) => (
              <div key={item.title} className="flex gap-4 p-5 bg-gray-50 rounded-xl">
                <div className="text-3xl flex-shrink-0">{item.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations Grid */}
      <LocationsGrid service="packers-and-movers" />

      {/* Why TransRentals */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Why Book Movers on TransRentals?</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            We verify every mover before listing. You compare, choose, and book — with full transparency.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TRUST_POINTS.map((point) => (
              <div key={point.title} className="flex gap-4 p-5 bg-blue-50 rounded-xl">
                <div className="text-2xl flex-shrink-0">{point.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{point.title}</h3>
                  <p className="text-sm text-gray-600">{point.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-14 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Packers and Movers FAQs</h2>
            <p className="text-gray-600">Everything you need to know before booking a mover</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {PACKERS_FAQS.map((faq, idx) => (
              <details key={idx} className="bg-white rounded-xl border border-gray-100 shadow-sm group">
                <summary className="px-5 py-4 font-medium text-gray-900 cursor-pointer select-none list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-3">▾</span>
                </summary>
                <p className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Internal City Links */}
      <section className="py-10 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">Packers and Movers by City</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/packers-and-movers/${city.slug}`}
                className="text-center py-2.5 px-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition text-sm font-medium text-gray-700 hover:text-blue-700"
              >
                {city.name}
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <Link href="/mini-truck-rental" className="text-blue-600 hover:underline">Mini Truck Rental</Link>
              <span className="text-gray-300">|</span>
              <Link href="/transporter" className="text-blue-600 hover:underline">Goods Transport</Link>
              <span className="text-gray-300">|</span>
              <Link href="/car-rental" className="text-blue-600 hover:underline">Car Rental</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
