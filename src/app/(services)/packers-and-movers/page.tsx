import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Shield, Star, Clock, MapPin, Package } from 'lucide-react';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';

const PACKERS_FAQS = [
  {
    q: 'What is the cost of packers and movers in India?',
    a: 'Packers and movers costs depend on home size, distance, floors, goods volume, packing quality, and transit insurance. Local shifts start from ₹3,000 for smaller homes and intercity moves are priced higher based on route and load. Get free quotes from multiple TransRentals-verified movers to compare for your specific shift.',
  },
  {
    q: 'How do I choose reliable packers and movers?',
    a: 'On TransRentals, all listed packers and movers are pre-verified with GST registration, moving license, and customer reviews. Check: (1) IBA panel registration for government employees, (2) customer star rating and reviews, (3) whether transit insurance is offered, and (4) whether the quote includes packing materials.',
  },
  {
    q: 'How long does it take to shift a 2BHK house?',
    a: 'A professional packing and moving team of 3–4 people takes 6–10 hours for a 2BHK intra-city shift (packing + loading + transit + unloading). For intercity moves, transit time is additional — 1–3 days for nearby cities, 4–7 days for pan-India moves.',
  },
  {
    q: 'Is insurance mandatory for household shifting?',
    a: 'Insurance is optional but strongly recommended. TransRentals vendors offer transit insurance at 0.5–1% of declared goods value. For electronics (TV, refrigerator, AC), antiques, and artwork — always opt for declared-value insurance. Without insurance, most movers\' liability is limited by weight.',
  },
  {
    q: 'What is the best time to book packers and movers in India?',
    a: 'Month-end (last week) is the busiest — book at least 5–7 days in advance. Financial year-end (March–April) and transfer season (May–June) are peak months requiring 2–3 weeks advance booking. Mid-month weekdays are typically less busy and easier to schedule.',
  },
  {
    q: 'Do packers and movers disassemble and reassemble furniture?',
    a: 'Yes, TransRentals movers offer dismantling and reassembly of beds, wardrobes, and modular furniture as part of the standard service. Always confirm this is included in your quote. Some vendors charge extra for AC unit installation/removal.',
  },
  {
    q: 'What items cannot be moved by packers and movers?',
    a: 'Most movers will not transport: LPG cylinders, flammable/hazardous materials, perishable food, plants, and pets. Jewellery, cash, and important documents should always be carried personally. Confirm restricted items with your vendor before the shift date.',
  },
  {
    q: 'Can I track my goods during an intercity move?',
    a: 'Yes, most TransRentals-listed intercity movers provide real-time tracking via GPS or WhatsApp updates during transit. For high-value shipments, ask for a dedicated vehicle (full-truck-load) rather than shared transport to reduce handling and transit time.',
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
    images: [{ url: 'https://transrentals.in/images/og/packers-movers.jpg', width: 1200, height: 630, alt: 'Packers and Movers - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Packers and Movers in India | TransRentals',
    description: 'Verified packers and movers across 50+ Indian cities. IBA-approved, insured moving teams.',
    images: ['https://transrentals.in/images/og/packers-movers.jpg'],
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
          <div className="max-w-3xl mx-auto space-y-4">
            {PACKERS_FAQS.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
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
