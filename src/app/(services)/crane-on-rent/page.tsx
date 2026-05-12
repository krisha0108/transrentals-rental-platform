import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { HowToSchema } from '@/components/seo/schemas';

const CRANE_FAQS = [
  {
    q: 'What is the cost of crane on rent per day in India?',
    a: 'Crane rental cost depends on crane type and lifting capacity. Hydra crane (5–8 ton pick-and-carry) starts from ₹8,000/day. Mobile crane (30–50 ton) starts from ₹18,000/day. Tower crane (for high-rise construction) starts from ₹25,000/day. Crawler cranes for heavy industrial lifting start from ₹35,000/day. Rates vary by city and project duration.',
  },
  {
    q: 'What is the difference between a hydra crane and a mobile crane?',
    a: 'A hydra crane is a pick-and-carry crane — it can lift and move a load while travelling, ideal for steel erection, beam placement, and pre-cast concrete installation on tight sites. A mobile crane (truck-mounted) has higher lifting capacity (30–500 ton) but cannot travel with load. Use hydra for intra-site material movement; use mobile crane for heavy single lifts.',
  },
  {
    q: 'Is a certified crane operator included in the rental?',
    a: 'Yes. All crane rentals on TransRentals include a certified, experienced crane operator who holds the relevant PESO or factory inspector competency certificate. The operator manages all rigging, load calculations, and safe lift execution. You must provide clear site access and an appropriate lift area.',
  },
  {
    q: 'Does crane rental include rigging equipment?',
    a: 'Basic rigging equipment (wire rope slings, shackles, and hook block) is typically included. For specialized lifts requiring beam spreader bars, chain slings, or load cells, confirm at the time of booking. Always share the lift drawing or load details with the vendor before deployment.',
  },
  {
    q: 'What permits are required for crane operation on public roads?',
    a: 'For cranes operating on public roads or ROW, an over-dimensional cargo (ODC) permit from the state transport authority is required. Escorts and pilot vehicles may be mandated. For cranes operating entirely within private project sites, no road permit is required. TransRentals vendors assist with documentation requirements.',
  },
  {
    q: 'Which crane type is best for high-rise construction?',
    a: 'Tower cranes are the standard for high-rise construction (10+ floors). They are mounted on a fixed base and can climb with the structure. For floors 1–5 and pre-fab element placement, a mobile crane (30–50 ton) is more flexible. For steel structure fabrication yards, a hydra crane is most practical for beam-by-beam placement.',
  },
  {
    q: 'What is the minimum rental period for a crane?',
    a: 'The standard minimum rental is 1 working day (8 hours). Multi-day projects get 5–10% discount on weekly bookings and 15–20% on monthly contracts. Idle standby days (crane on-site but not working) are typically billed at 50–60% of the operating day rate. Confirm standby billing with your vendor at the time of quotation.',
  },
  {
    q: 'How far in advance should I book a crane for a construction project?',
    a: 'For standard hydra and mobile crane bookings, 3–5 days in advance is sufficient. For tower cranes (requiring foundation bolt installation), book 2–3 weeks ahead. During peak construction season (October–February) in Tier-1 cities, large cranes book out fast — plan 1–2 weeks ahead. Emergency crane deployments are available in select cities with 24–48 hours notice.',
  },
];

const CRANE_TYPES = [
  { name: 'Hydra Crane', capacity: '5–12 Ton', bestFor: 'Steel erection, beam placement, intra-site lifts', price: '₹8,000/day' },
  { name: 'Mobile Crane', capacity: '30–200 Ton', bestFor: 'Heavy lifts, bridge girders, pre-cast panels', price: '₹18,000/day' },
  { name: 'Tower Crane', capacity: '4–20 Ton @ height', bestFor: 'High-rise construction, multi-storey buildings', price: '₹25,000/day' },
  { name: 'Crawler Crane', capacity: '50–500 Ton', bestFor: 'Heavy industrial lifts, power plants, refineries', price: '₹35,000/day' },
  { name: 'Pick & Carry Crane', capacity: '10–20 Ton', bestFor: 'Precast, factory yards, shipyard work', price: '₹10,000/day' },
  { name: 'Truck-Mounted Crane', capacity: '10–30 Ton', bestFor: 'Road construction, utility work, quick deployment', price: '₹12,000/day' },
];

const TOP_CITIES = [
  { name: 'Delhi', slug: 'delhi' },
  { name: 'Mumbai', slug: 'mumbai' },
  { name: 'Bangalore', slug: 'bangalore' },
  { name: 'Hyderabad', slug: 'hyderabad' },
  { name: 'Chennai', slug: 'chennai' },
  { name: 'Pune', slug: 'pune' },
  { name: 'Jaipur', slug: 'jaipur' },
  { name: 'Lucknow', slug: 'lucknow' },
  { name: 'Nagpur', slug: 'nagpur' },
  { name: 'Indore', slug: 'indore' },
  { name: 'Ahmedabad', slug: 'ahmedabad' },
  { name: 'Surat', slug: 'surat' },
];

export const metadata: Metadata = {
  title: 'Crane on Rent | Mobile & Hydra Crane Hire | Starting ₹8,000/Day | TransRentals',
  description:
    'Hire crane on rent across 200+ Indian cities. Hydra crane, mobile crane, tower crane, crawler crane — 5 ton to 500 ton capacity. Certified operators included. Construction, industrial, infrastructure projects.',
  keywords: [
    'crane on rent',
    'crane rental india',
    'mobile crane hire',
    'hydra crane on rent',
    'tower crane rental',
    'crawler crane hire',
    'construction crane rental',
    'crane with operator',
    'crane rental per day rate',
    'heavy lift crane rental',
    'pick and carry crane',
    'crane hire india',
  ],
  openGraph: {
    title: 'Crane on Rent | Mobile & Hydra Crane Hire | TransRentals',
    description: 'Hire mobile crane, hydra crane, tower crane with certified operators across 200+ Indian cities. Starting ₹8,000/day.',
    type: 'website',
    url: 'https://transrentals.in/crane-on-rent',
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crane on Rent | Mobile & Hydra Crane Hire | TransRentals',
    description: 'Hire mobile crane, hydra crane, tower crane with certified operators. 200+ cities.',
  },
  alternates: { canonical: 'https://transrentals.in/crane-on-rent' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export default function CraneOnRentPage() {
  return (
    <div className="flex flex-col">
      <HowToSchema
        name="How to Rent a Crane on TransRentals"
        description="Book a mobile crane, hydra crane, or tower crane with certified operator in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Describe Lifting Requirements', text: 'Specify project location, lifting capacity required (in tons), crane type preferred, working height, and number of working days.' },
          { name: 'Choose Crane Type', text: 'Select hydra crane for intra-site steel erection, mobile crane for heavy single lifts, or tower crane for high-rise construction. Share lift drawing if available.' },
          { name: 'Get Operator Quotes', text: 'Receive quotes from verified vendors with PESO-certified crane operators. Compare daily rates, shift options, and rigging inclusion.' },
          { name: 'Schedule Crane Deployment', text: 'Pay advance to confirm. Crane arrives with certified operator and rigging equipment on scheduled date. Standby billing terms confirmed at booking.' },
        ]}
      />

      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: CRANE_FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: { '@type': 'Answer', text: faq.a },
            })),
          }),
        }}
      />

      {/* Service Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Crane on Rent in India',
            description: 'Mobile crane, hydra crane, tower crane, and crawler crane rental with certified operators across 200+ Indian cities.',
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            areaServed: { '@type': 'Country', name: 'India' },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: 8000,
              highPrice: 75000,
              offerCount: 60,
            },
          }),
        }}
      />

      <ServiceHeroWithChat
        badge="Crane Rental in 200+ Cities"
        title="Crane on Rent"
        titleHighlight="Certified Operators Included"
        description="Hire mobile cranes, hydra cranes, tower cranes, and crawler cranes for construction, industrial, and infrastructure projects. 5 ton to 500 ton capacity. Get quotes from verified vendors."
        gradientFrom="orange-50"
        gradientTo="yellow-50"
      />

      {/* Crane Types */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Crane Types Available for Hire</h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">Choose the right crane for your project — from 5-ton intra-site hydra cranes to 500-ton crawler cranes for heavy industrial lifts</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CRANE_TYPES.map((crane) => (
              <div key={crane.name} className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-xl border-2 border-orange-100 hover:border-orange-300 hover:shadow-md transition">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{crane.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{crane.capacity}</span>
                  <span className="text-orange-600 font-bold text-sm">From {crane.price}</span>
                </div>
                <p className="text-sm text-gray-600">{crane.bestFor}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Applications */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Crane Rental Applications</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🏗️', title: 'High-Rise Construction', desc: 'Tower crane for multi-storey buildings — concrete pour, formwork, and pre-cast panel placement' },
              { icon: '🌉', title: 'Bridges & Flyovers', desc: 'Girder launching and pre-cast bridge deck placement using mobile crane' },
              { icon: '🏭', title: 'Industrial Plant Erection', desc: 'Equipment erection in refineries, power plants, and manufacturing facilities' },
              { icon: '⚙️', title: 'Steel Structure Erection', desc: 'Hydra crane for structural steel beam, column, and truss installation' },
              { icon: '🚢', title: 'Port & Shipyard Work', desc: 'Container and heavy cargo handling at ports and docks' },
              { icon: '⚡', title: 'Power & Transmission', desc: 'Transformer lifting, tower erection, and substation equipment placement' },
              { icon: '🏠', title: 'Pre-Fabricated Structures', desc: 'Pre-cast concrete panels, modular rooms, and RCC structural components' },
              { icon: '💨', title: 'Wind & Solar Projects', desc: 'Wind turbine blade and nacelle lifting; utility-scale solar panel installation' },
              { icon: '🔧', title: 'Plant Maintenance', desc: 'Annual shutdown maintenance lifts in refineries, chemical plants, and steel mills' },
            ].map((app) => (
              <div key={app.title} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-orange-100">
                <div className="text-4xl mb-3">{app.icon}</div>
                <h3 className="text-lg font-bold mb-2">{app.title}</h3>
                <p className="text-sm text-gray-600">{app.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What&apos;s Included in Crane Rental</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🏗️', title: 'Crane + Operator', desc: 'PESO/factory-certified operator with the machine — no separate staffing needed' },
              { icon: '🪝', title: 'Basic Rigging', desc: 'Wire rope slings, shackles, hook block. Advanced rigging gear on request.' },
              { icon: '🛡️', title: 'Machine Insurance', desc: 'Crane is insured for third-party liability during your project duration' },
              { icon: '🚚', title: 'Site Transportation', desc: 'Crane mobilisation to your project site included for nearby locations' },
              { icon: '⏰', title: 'Flexible Shifts', desc: '8-hour, 12-hour, and 24-hour shift options available to match your schedule' },
              { icon: '📋', title: 'PESO Compliance', desc: 'All cranes come with valid PESO inspection certificates and operator credentials' },
              { icon: '👷', title: 'Safety Observer', desc: 'Banksman/rigger included for all critical lifts above 10 tons' },
              { icon: '📞', title: 'On-Call Support', desc: '24/7 breakdown assistance. Replacement machine arranged if required.' },
            ].map((item) => (
              <div key={item.title} className="bg-orange-50 p-6 rounded-xl text-center border border-orange-100">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LocationsGrid service="crane-on-rent" />

      {/* FAQ Section */}
      <section className="py-14 bg-white">
        <div className="container-custom">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Crane Rental FAQs</h2>
            <p className="text-gray-600">Common questions about hiring a crane in India</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {CRANE_FAQS.map((faq, idx) => (
              <details key={idx} className="bg-gray-50 rounded-xl border border-gray-100 group">
                <summary className="px-5 py-4 font-medium text-gray-900 cursor-pointer select-none list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Internal City Links */}
      <section className="py-10 bg-gray-50 border-t border-gray-100">
        <div className="container-custom">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">Crane on Rent by City</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/crane-on-rent/${city.slug}`}
                className="text-center py-2.5 px-2 rounded-lg border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition text-sm font-medium text-gray-700 hover:text-orange-700"
              >
                {city.name}
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center flex flex-wrap justify-center gap-3 text-sm">
            <Link href="/equipment-rental" className="text-orange-700 hover:underline">All Equipment Rental</Link>
            <span className="text-gray-300">|</span>
            <Link href="/jcb-on-rent" className="text-orange-700 hover:underline">JCB on Rent</Link>
            <span className="text-gray-300">|</span>
            <Link href="/excavator-on-rent" className="text-orange-700 hover:underline">Excavator on Rent</Link>
            <span className="text-gray-300">|</span>
            <Link href="/hydra-on-rent" className="text-orange-700 hover:underline">Hydra on Rent</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
