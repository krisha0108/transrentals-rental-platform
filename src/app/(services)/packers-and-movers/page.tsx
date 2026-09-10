import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckCircle, Shield, Star, Clock, MapPin, Package,
  Home, Building2, Route, Car, Warehouse, Factory,
  Wrench, Truck, PackageOpen, ShieldCheck, ClipboardList,
  Award, Search, PhoneCall,
  MessageCircleQuestion, Plus, ArrowRight,
} from 'lucide-react';
import { CarRentalPopularCitiesGrid } from '@/components/car-rental/CarRentalPopularCitiesGrid';
import { PackersMoversServiceHero } from '@/components/services/PackersMoversServiceHero';
import { HowToSchema } from '@/components/seo/schemas';

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover, no custom keyframes. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  wrench: 'group-hover:rotate-45',
  ring: 'group-hover:rotate-12',
  lift: 'group-hover:-translate-y-2',
  grow: 'group-hover:-translate-y-1.5 group-hover:scale-110',
};

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
    icon: Home,
    anim: 'pulse',
    title: 'Home Shifting',
    desc: 'Complete door-to-door household moving — packing, loading, transit, and unloading. Available for 1BHK, 2BHK, 3BHK, and villas.',
  },
  {
    icon: Building2,
    anim: 'lift',
    title: 'Office Relocation',
    desc: 'Professional office shifting with proper labelling, IT equipment packing, and after-hours scheduling to minimise business downtime.',
  },
  {
    icon: Route,
    anim: 'drive',
    title: 'Intercity Moving',
    desc: 'Pan-India household and commercial goods transport. Full-truck-load and shared (part-load) options for all routes.',
  },
  {
    icon: Car,
    anim: 'drive',
    title: 'Vehicle Transport',
    desc: 'Car and two-wheeler transport on enclosed trailers or open carriers. Available alongside household shifting or as a standalone service.',
  },
  {
    icon: Warehouse,
    anim: 'tick',
    title: 'Storage Solutions',
    desc: 'Temporary warehouse storage for goods during gap between move-out and move-in dates. Available in select cities.',
  },
  {
    icon: Factory,
    anim: 'wrench',
    title: 'Industrial & Commercial',
    desc: 'Factory machinery relocation, shop shifting, and bulk commercial goods transport with heavy-duty packing and rigging support.',
  },
];

const WHAT_IS_INCLUDED = [
  { icon: Package, anim: 'pulse', title: 'Packing Materials', desc: 'Boxes, bubble wrap, stretch film, and edge protectors for all goods' },
  { icon: Wrench, anim: 'wrench', title: 'Furniture Dismantling', desc: 'Beds, wardrobes, and modular furniture disassembled and reassembled' },
  { icon: Truck, anim: 'drive', title: 'Loading & Transport', desc: 'Professional loading team and insured transport vehicle' },
  { icon: PackageOpen, anim: 'lift', title: 'Unloading & Unpacking', desc: 'Unloading, placement in rooms, and unpacking on request' },
  { icon: ShieldCheck, anim: 'pulse', title: 'Transit Insurance', desc: 'Optional declared-value insurance for electronics and high-value items' },
  { icon: ClipboardList, anim: 'tick', title: 'Inventory List', desc: 'Detailed inventory of goods packed for accountability during transit' },
];

const HOW_IT_WORKS = [
  { step: 1, title: 'Request a Quote', desc: 'Share your shift details — home size, pickup city, delivery city, and preferred date', icon: MapPin },
  { step: 2, title: 'Compare Vendors', desc: 'Get quotes from multiple TransRentals-verified packers. Compare price, rating, and inclusions', icon: Star },
  { step: 3, title: 'Confirm Booking', desc: 'Confirm your preferred vendor with a small advance. Receive a booking confirmation and vendor contact', icon: CheckCircle },
  { step: 4, title: 'Shift & Settle', desc: 'The team arrives, packs professionally, transports safely, and unloads at your new home', icon: Package },
];

const TRUST_POINTS = [
  { icon: CheckCircle, anim: 'pulse', title: 'GST-Verified Vendors', desc: 'All listed movers have valid GST registration and moving licenses' },
  { icon: Star, anim: 'tick', title: '4.7/5 Average Rating', desc: 'Ratings from real customers post-shift — no fake reviews' },
  { icon: ShieldCheck, anim: 'pulse', title: 'Transit Insurance', desc: 'Optional coverage for your goods during transport' },
  { icon: Award, anim: 'lift', title: 'IBA-Approved Movers', desc: 'Government-transfer-eligible movers listed for CPWD and PSU employees' },
  { icon: Search, anim: 'wrench', title: 'Background-Checked Teams', desc: 'Moving teams are verified by vendor before deployment' },
  { icon: PhoneCall, anim: 'ring', title: 'Post-Move Support', desc: 'TransRentals support available if any issue arises after the shift' },
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
      <PackersMoversServiceHero />

      {/* Service Types */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage:
              'radial-gradient(420px 320px at 6% 8%, #000 0%, transparent 70%), radial-gradient(420px 320px at 94% 92%, #000 0%, transparent 70%)',
            maskImage:
              'radial-gradient(420px 320px at 6% 8%, #000 0%, transparent 70%), radial-gradient(420px 320px at 94% 92%, #000 0%, transparent 70%)',
          }}
        />
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900 mb-3">
              Types of <span className="text-emerald-600">Moving Services</span>
            </h2>
            <p className="text-gray-500">
              From single-room shifts to full office relocations — TransRentals has verified vendors for every type of move.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
            {SERVICE_TYPES.map((service, idx) => (
              <div
                key={service.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
                style={{ animation: `pnm-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 90}ms forwards`, opacity: 0 }}
              >
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                    <service.icon
                      className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[service.anim]}`}
                    />
                  </span>
                </div>
                <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-snug">{service.title}</h3>
                <p className="text-[13.5px] leading-relaxed text-gray-500">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes pnm-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="pnm-rise"] { animation: none !important; opacity: 1 !important; } }
        ` }} />
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
              <CheckCircle className="w-4 h-4" />
              Simple Process
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500">Book your move in 4 simple steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }, idx) => (
              <div key={step} className="relative">
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-1/2 w-full border-t-2 border-dashed border-emerald-200" />
                )}
                <div className="group relative z-10 text-center">
                  <div className="relative w-14 h-14 mx-auto mb-4">
                    <span
                      className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping"
                      style={{ animationDelay: `${idx * 0.3}s`, animationDuration: '2.5s' }}
                    />
                    <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-white" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-emerald-500 text-emerald-700 text-[10px] font-extrabold flex items-center justify-center">
                        {step}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900 mb-3">
              What&apos;s <span className="text-emerald-600">Included</span> in Your Move
            </h2>
            <p className="text-gray-500">
              A standard packers and movers booking on TransRentals covers the full shifting experience — from packing to placement.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {WHAT_IS_INCLUDED.map((item, idx) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animation: `pnm-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <span className="inline-flex w-12 h-12 rounded-xl bg-emerald-50 items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-emerald-600">
                  <item.icon
                    className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                  />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations Grid */}
      <CarRentalPopularCitiesGrid serviceSlug="packers-and-movers" title="Packers and Movers in Available Cities" />

      {/* Why TransRentals */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900 mb-3">
              Why Book Movers on <span className="text-emerald-600">TransRentals?</span>
            </h2>
            <p className="text-gray-500">
              We verify every mover before listing. You compare, choose, and book — with full transparency.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {TRUST_POINTS.map((point, idx) => (
              <div
                key={point.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animation: `pnm-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <span className="inline-flex w-12 h-12 rounded-xl bg-emerald-50 items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-emerald-600">
                  <point.icon
                    className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[point.anim]}`}
                  />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5">{point.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{point.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage:
              'radial-gradient(380px 300px at 3% 12%, #000 0%, transparent 70%), radial-gradient(380px 300px at 97% 88%, #000 0%, transparent 70%)',
            maskImage:
              'radial-gradient(380px 300px at 3% 12%, #000 0%, transparent 70%), radial-gradient(380px 300px at 97% 88%, #000 0%, transparent 70%)',
          }}
        />
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              GOOD TO KNOW
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Packers and Movers <span className="text-emerald-600">FAQs</span>
            </h2>
            <p className="mt-3 text-base text-gray-600">Everything you need to know before booking a mover.</p>
          </div>
          <div className="max-w-5xl mx-auto space-y-3">
            {PACKERS_FAQS.map((faq, idx) => (
              <details
                key={idx}
                open={idx === 0}
                className="group rounded-2xl bg-white border border-gray-100 shadow-sm open:border-emerald-200 open:shadow-md transition-all"
              >
                <summary className="flex items-center gap-4 px-4 sm:px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 grid place-items-center">
                    <MessageCircleQuestion className="w-[18px] h-[18px] text-emerald-600" />
                  </span>
                  <h3 className="flex-1 font-bold text-[15px] leading-snug text-gray-900">{faq.q}</h3>
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 text-gray-500 grid place-items-center transition-all duration-200 group-open:rotate-45 group-open:bg-emerald-600 group-open:text-white">
                    <Plus className="w-4 h-4" />
                  </span>
                </summary>
                <p className="px-4 sm:px-5 pb-5 sm:pl-[4.25rem] text-[14px] leading-relaxed text-gray-500">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Internal City Links */}
      <section className="relative py-16 bg-white border-t border-gray-100 overflow-hidden">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'linear-gradient(#ecfdf5 1px, transparent 1px), linear-gradient(90deg, #ecfdf5 1px, transparent 1px)',
            backgroundSize: '34px 34px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 90%)',
          }}
        />
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
              <MapPin className="w-4 h-4" />
              Browse by City
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Packers and Movers by City</h2>
            <p className="text-gray-500">Jump straight to a city&apos;s dedicated page</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-5xl mx-auto mb-8">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/packers-and-movers/${city.slug}`}
                className="flex items-center gap-2 bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                </span>
                {city.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
            {[
              { href: '/mini-truck-rental', label: 'Mini Truck Rental', icon: Truck },
              { href: '/transporter', label: 'Goods Transport', icon: Truck },
              { href: '/car-rental', label: 'Car Rental', icon: Car },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 bg-white border border-gray-100 hover:border-emerald-200 rounded-xl px-4 py-2.5 text-sm font-bold text-emerald-700 transition-colors"
              >
                <link.icon className="w-4 h-4 text-emerald-600" />
                {link.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
