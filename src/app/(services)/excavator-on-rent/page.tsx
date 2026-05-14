import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { HowToSchema } from '@/components/seo/schemas';

const EXCAVATOR_FAQS = [
  {
    q: 'What is the cost of excavator on rent per day in India?',
    a: 'Excavator rental rates depend on machine size and project type. Mini excavator (1–5 ton) starts from ₹3,500/day, ideal for plumbing trenches and small foundation digs in urban sites. Standard hydraulic excavator (8–20 ton) starts from ₹5,000/day for general earthmoving. Large excavator (20–35 ton) for deep foundation and mining work starts from ₹8,000/day. Fuel is typically the client\'s responsibility unless otherwise agreed.',
  },
  {
    q: 'What is the difference between a JCB and an excavator?',
    a: 'A JCB (backhoe loader) has a front loader bucket AND a rear digging arm — it can dig, load, and transport material. A hydraulic excavator (poclain) only digs and scoops with a single boom arm but with greater digging depth and force. JCB is best for mixed work on small sites; dedicated hydraulic excavators are used for deep trenching, foundation pits, and heavy earthmoving where digging force matters more than mobility.',
  },
  {
    q: 'Which excavator size is right for my project?',
    a: 'Mini excavator (1–5 ton): plumbing work, narrow lane trenching, basement access, landscaping. Standard excavator (8–20 ton): residential and commercial foundation pits, road excavation, pond digging, cable laying. Large excavator (20–35 ton): dam construction, mining, deep industrial foundations, river dredging. Share your project scope when requesting a quote — vendors recommend the right machine size.',
  },
  {
    q: 'Is the operator included in excavator rental?',
    a: 'Yes. All excavator rentals on TransRentals include a certified, experienced operator. The operator holds the relevant government-issued competency certificate. You must provide safe site access, a designated working area, and necessary project permits. The operator is not responsible for obtaining site permissions or traffic management.',
  },
  {
    q: 'What attachments are available with an excavator?',
    a: 'Standard excavator rental includes a digging bucket. Additional attachments available on request: hydraulic rock breaker (demolition and hard rock excavation), hydraulic thumb (grip and place large boulders), auger (bored pile foundation holes), compactor plate (trench backfill compaction), and ripper tooth (hard soil and rocky terrain). Confirm attachment availability and cost when booking.',
  },
  {
    q: 'How many hours does an excavator work per day?',
    a: 'Standard rental is for one 8-hour working shift per day. Extended 12-hour and double-shift (16-hour) options are available at additional cost — typically 1.25× and 1.5× the daily rate. Fuel (diesel) is usually the client\'s responsibility. Clarify fuel arrangement, idle time billing, and breakdown replacement terms with the vendor before confirming the booking.',
  },
  {
    q: 'What documents are required to rent an excavator?',
    a: 'For corporate/business clients: GST registration certificate, company PAN, and a site authorization letter on company letterhead. For individual contractors: Aadhaar Card, PAN card, and a signed rental agreement. A security deposit (10–25% of total rental value) is typically required. The excavator operator\'s NSDC/ITI competency certificate is the vendor\'s responsibility.',
  },
  {
    q: 'How far in advance should I book an excavator for a construction project?',
    a: 'For standard 8–20 ton excavators, 48–72 hours advance booking is sufficient in most cities. For large (20–35 ton) machines or multi-machine projects, book 5–7 days ahead. During peak construction season (October–February, post-monsoon) and around major festivals, demand spikes significantly. Emergency same-day excavator deployment is possible in select Tier-1 cities.',
  },
];

const EXCAVATOR_TYPES = [
  { name: 'Mini Excavator', range: '1–5 Ton', bestFor: 'Urban trenching, plumbing, narrow lane access', price: '₹3,500/day' },
  { name: 'Standard Excavator', range: '8–20 Ton', bestFor: 'Foundation pits, canal digging, road excavation', price: '₹5,000/day' },
  { name: 'Large Excavator', range: '20–35 Ton', bestFor: 'Deep industrial foundations, mining, dams', price: '₹8,000/day' },
  { name: 'Long Reach Excavator', range: '12–25 Ton', bestFor: 'River dredging, canal cleaning, deep-slope work', price: '₹9,000/day' },
  { name: 'Rock Breaker Excavator', range: '8–20 Ton + Breaker', bestFor: 'Rock quarrying, hard demolition, road cutting', price: '₹7,500/day' },
  { name: 'Wheeled Excavator', range: '6–14 Ton', bestFor: 'Road work, utility trenching on paved surfaces', price: '₹5,500/day' },
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
  { name: 'Kolkata', slug: 'kolkata' },
];

export const metadata: Metadata = {
  title: 'Excavator on Rent | Hydraulic Excavator Hire | Starting ₹3,500/Day | TransRentals',
  description:
    'Hire excavator on rent across 200+ Indian cities. Mini excavator, hydraulic excavator, rock breaker — 1 ton to 35 ton. Certified operators included. Foundation digging, trenching, canal work, demolition.',
  keywords: [
    'excavator on rent',
    'excavator rental india',
    'hydraulic excavator hire',
    'poclain on rent',
    'mini excavator rental',
    'excavator with operator',
    'jcb excavator rental',
    'hitachi excavator rental',
    'rock breaker on rent',
    'earthmoving equipment rental',
    'excavator per day rate',
    'backhoe excavator hire',
  ],
  openGraph: {
    title: 'Excavator on Rent | Hydraulic Excavator Hire | TransRentals',
    description: 'Hire mini to large hydraulic excavators with certified operators across 200+ Indian cities. Starting ₹3,500/day.',
    type: 'website',
    url: 'https://transrentals.in/excavator-on-rent',
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Excavator on Rent | Hydraulic Excavator Hire | TransRentals',
    description: 'Hire mini to large hydraulic excavators with certified operators. 200+ cities.',
  },
  alternates: { canonical: 'https://transrentals.in/excavator-on-rent' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export default function ExcavatorOnRentPage() {
  return (
    <div className="flex flex-col">
      <HowToSchema
        name="How to Rent an Excavator on TransRentals"
        description="Book a hydraulic excavator or mini excavator with certified operator in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Specify Project Details', text: 'Enter site location, type of earthwork (foundation digging, trenching, demolition), excavator tonnage needed, and number of working days.' },
          { name: 'Choose Excavator Size', text: 'Select mini excavator (1–5 ton) for tight urban spaces, standard excavator (8–20 ton) for general earthmoving, or large excavator (20–35 ton) for deep industrial foundations.' },
          { name: 'Get Vendor Quotes', text: 'Receive daily rate quotes from verified equipment vendors with certified operators. Compare rates, shift options, and attachment availability.' },
          { name: 'Confirm & Deploy', text: 'Pay advance deposit to confirm. Machine and certified operator arrive at your site on the agreed date with shift plan and safety equipment.' },
        ]}
      />

      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: EXCAVATOR_FAQS.map((faq) => ({
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
            name: 'Excavator on Rent in India',
            description: 'Mini excavator, hydraulic excavator, and rock breaker rental with certified operators across 200+ Indian cities.',
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            areaServed: { '@type': 'Country', name: 'India' },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: 3500,
              highPrice: 12000,
              offerCount: 60,
            },
          }),
        }}
      />

      <ServiceHeroWithChat
        badge="Excavator Rental in 200+ Cities"
        title="Excavator on Rent"
        titleHighlight="Certified Operators Included"
        description="Hire hydraulic excavators for digging, trenching, foundation work, and demolition. Mini to large excavators (1 ton–35 ton) with trained operators. Get quotes from verified vendors."
        gradientFrom="amber-50"
        gradientTo="yellow-50"
      />

      {/* Excavator Types */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Excavator Types Available for Hire</h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">From 1-ton mini excavators for narrow urban lanes to 35-ton machines for deep industrial foundations — choose the right size for your project</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXCAVATOR_TYPES.map((exc) => (
              <div key={exc.name} className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-xl border-2 border-amber-100 hover:border-amber-300 hover:shadow-md transition">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{exc.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{exc.range}</span>
                  <span className="text-amber-600 font-bold text-sm">From {exc.price}</span>
                </div>
                <p className="text-sm text-gray-600">{exc.bestFor}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Applications */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Excavator Applications</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🏠', title: 'Foundation Excavation', desc: 'Digging basements, foundation pits, pile caps, and column footings for residential and commercial buildings' },
              { icon: '💧', title: 'Pipeline & Utilities', desc: 'Trenching for water supply, sewerage, gas lines, and underground cable laying' },
              { icon: '🛣️', title: 'Road Construction', desc: 'Subgrade preparation, road cutting, culvert installation, and side drain excavation' },
              { icon: '🏊', title: 'Pond & Canal Digging', desc: 'Farm pond excavation, irrigation canal digging, and water body deepening' },
              { icon: '🔨', title: 'Demolition', desc: 'Building demolition, concrete breaking, and debris clearance with rock breaker attachment' },
              { icon: '⛏️', title: 'Mining & Quarrying', desc: 'Overburden removal, sand and laterite excavation, and material loading' },
              { icon: '🌊', title: 'Dam & Embankment', desc: 'Earthfill dam construction, bund strengthening, and flood protection embankments' },
              { icon: '🏗️', title: 'Industrial Projects', desc: 'Plant foundations, underground tank excavation, and ETP/STP pit work' },
              { icon: '🌿', title: 'Land Development', desc: 'Site leveling, terrain modification, land reclamation, and agricultural land clearing' },
            ].map((app) => (
              <div key={app.title} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-amber-100">
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
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What&apos;s Included in Excavator Rental</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🚜', title: 'Machine + Operator', desc: 'Certified, experienced hydraulic excavator operator included — no separate hiring' },
              { icon: '🪣', title: 'Standard Digging Bucket', desc: 'GP (general purpose) bucket included. Rock breaker, auger, thumb available on request.' },
              { icon: '🛡️', title: 'Machine Insurance', desc: 'Third-party liability insurance covering the machine during your rental period' },
              { icon: '🚚', title: 'Site Mobilisation', desc: 'Machine transportation to your project site via flat-bed trailer (local rates apply)' },
              { icon: '⏰', title: 'Flexible Shifts', desc: '8-hour, 12-hour, and extended shift options available' },
              { icon: '⛽', title: 'Fuel Arrangement', desc: 'Client-provided diesel at site or fuel-inclusive packages available on request' },
              { icon: '🔧', title: 'Minor Maintenance', desc: 'Routine maintenance (oil, filters, greasing) handled by vendor during rental' },
              { icon: '📞', title: 'Breakdown Support', desc: 'Replacement machine arranged within 4–8 hours in case of breakdown' },
            ].map((item) => (
              <div key={item.title} className="bg-amber-50 p-6 rounded-xl text-center border border-amber-100">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LocationsGrid service="excavator-on-rent" />

      {/* FAQ Section */}
      <section className="py-14 bg-white">
        <div className="container-custom">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Excavator Rental FAQs</h2>
            <p className="text-gray-600">Common questions about hiring a hydraulic excavator in India</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {EXCAVATOR_FAQS.map((faq, idx) => (
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
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">Excavator on Rent by City</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/excavator-on-rent/${city.slug}`}
                className="text-center py-2.5 px-2 rounded-lg border border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition text-sm font-medium text-gray-700 hover:text-amber-700"
              >
                {city.name}
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center flex flex-wrap justify-center gap-3 text-sm">
            <Link href="/equipment-rental" className="text-amber-700 hover:underline">All Equipment Rental</Link>
            <span className="text-gray-300">|</span>
            <Link href="/jcb-on-rent" className="text-amber-700 hover:underline">JCB on Rent</Link>
            <span className="text-gray-300">|</span>
            <Link href="/crane-on-rent" className="text-amber-700 hover:underline">Crane on Rent</Link>
            <span className="text-gray-300">|</span>
            <Link href="/mini-truck-rental" className="text-amber-700 hover:underline">Mini Truck Rental</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
