import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { HowToSchema, BreadcrumbSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Generator on Rent | DG Set Rental Starting ₹1,500/Day | TransRentals',
  description:
    'Rent diesel generators for events, construction, industrial backup & residential use. 5KVA to 500KVA silent DG sets. Fuel option available. Operator included. Book across 200+ cities.',
  keywords: [
    'generator on rent',
    'dg set on rent',
    'generator rental',
    'diesel generator hire',
    'silent generator rental',
    'power backup rental',
    'generator for events',
    'generator for construction',
    '5kva generator rent',
    '62.5 kva generator rent',
    '125 kva generator rent',
    'dg set rental per day',
  ],
  openGraph: {
    title: 'Generator on Rent | DG Set Rental Starting ₹1,500/Day | TransRentals',
    description: 'Rent 5KVA to 500KVA diesel generators across 200+ Indian cities. Silent DG sets for events, construction, and industrial backup. Operator included.',
    type: 'website',
    url: 'https://transrentals.in/generator-on-rent',
    images: [{ url: 'https://transrentals.in/api/og?service=generator-on-rent', width: 1200, height: 630, alt: 'Generator on Rent - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Generator on Rent | DG Set Rental Starting ₹1,500/Day | TransRentals',
    description: 'Rent diesel generators for events, construction, and power backup. 5KVA to 500KVA. Operator included.',
    images: ['https://transrentals.in/api/og?service=generator-on-rent'],
  },
  alternates: { canonical: 'https://transrentals.in/generator-on-rent' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

const GENERATOR_TYPES = [
  { capacity: '5 KVA', usage: 'Home / Small Office', price: '₹1,500', tag: 'Budget Pick', specs: 'Powers AC + fans + lights. Suitable for 1–2 rooms.' },
  { capacity: '15 KVA', usage: 'Small Events / Shops', price: '₹2,500', tag: '', specs: 'Ideal for small weddings, exhibitions, and commercial shops.' },
  { capacity: '25 KVA', usage: 'Medium Events / Offices', price: '₹3,500', tag: 'Most Popular', specs: 'Powers entire floor of an office or a mid-size function hall.' },
  { capacity: '62.5 KVA', usage: 'Large Events / Sites', price: '₹6,000', tag: '', specs: 'Suitable for large weddings, construction sites, and factories up to 50 HP load.' },
  { capacity: '125 KVA', usage: 'Industrial / Big Sites', price: '₹10,000', tag: '', specs: 'Powers mid-size factories, hospitals, and large commercial buildings.' },
  { capacity: '250 KVA', usage: 'Heavy Industrial', price: '₹18,000', tag: '', specs: 'For large manufacturing plants, data centres, and heavy construction.' },
  { capacity: '500 KVA', usage: 'Large Plant / Township', price: '₹35,000', tag: 'Max Capacity', specs: 'Full-scale industrial power backup for large campuses and townships.' },
];

const APPLICATIONS = [
  { icon: '🎪', title: 'Weddings & Events', desc: 'Silent DG sets for weddings, receptions, corporate events, concerts, and outdoor exhibitions. Sound-proof enclosures to avoid noise disturbance.' },
  { icon: '🏗️', title: 'Construction Sites', desc: 'Power for concrete mixers, welding machines, site lighting, and equipment. Suitable for sites without grid connection.' },
  { icon: '🏭', title: 'Industrial Backup', desc: 'Uninterrupted power backup for factories, manufacturing plants, and MSME units during grid outages.' },
  { icon: '🏠', title: 'Residential / Society', desc: 'Backup power for housing societies, apartment complexes, and bungalows during load shedding.' },
  { icon: '🏥', title: 'Hospitals & Clinics', desc: 'Critical power backup for hospitals, diagnostic centres, and medical facilities where uninterrupted power is non-negotiable.' },
  { icon: '📡', title: 'Telecom / IT Sites', desc: 'Generator sets for telecom tower sites, data centres, and IT parks during planned outages or maintenance windows.' },
];

const INCLUDED = [
  { title: 'Certified Operator', desc: 'Trained DG set operator included for all rentals. Handles startup, load management, and shutdown.' },
  { title: 'Full Day 8-Hr Shift', desc: 'Standard rental is 8 working hours. Extended 12-hr and 24-hr shifts available at additional cost.' },
  { title: 'Delivery & Setup', desc: 'Generator delivered to your site and set up. Transport vehicle fees may apply beyond 25 km from vendor base.' },
  { title: 'Basic Maintenance', desc: 'Vendor ensures machine is service-checked before dispatch. Oil and coolant topped up.' },
];

const GENERATOR_FAQS = [
  {
    q: 'What is the cost of generator rental per day in India?',
    a: 'Generator rental rates depend on capacity. 5 KVA (home/small office): ₹1,500/day. 15 KVA (small events): ₹2,500/day. 25 KVA (medium events/offices): ₹3,500/day. 62.5 KVA (large events/sites): ₹6,000/day. 125 KVA (industrial): ₹10,000/day. 250 KVA: ₹18,000/day. 500 KVA: ₹35,000/day. Fuel is typically charged separately at actuals.',
  },
  {
    q: 'What size generator do I need for my event or wedding?',
    a: 'For a small wedding (up to 200 guests, basic lighting and sound): 25 KVA is sufficient. For a medium wedding (200–500 guests, catering, AC, DJ): 62.5 KVA. For a large wedding (500+ guests, full lighting, multiple AC units, DJ, catering): 125 KVA. When in doubt, add 20% buffer to your estimated load — under-sized generators trip under peak load.',
  },
  {
    q: 'What is the difference between a silent generator and a regular DG set?',
    a: 'A silent (sound-proof) generator is enclosed in an acoustic cabinet that reduces noise from ~102 dB to 65–75 dB — equivalent to a quiet conversation. Silent DG sets are mandatory for residential areas, hotels, and events in noise-sensitive zones. Regular open-frame generators are louder but less expensive, and are used on construction sites and industrial locations where noise is not a concern.',
  },
  {
    q: 'Is fuel included in generator rental?',
    a: 'Fuel is typically NOT included in generator rental rates — client provides diesel at site. The operator monitors fuel levels and advises when refuelling is needed. Some vendors offer a fuel-included package at a fixed per-hour rate (typically ₹80–₹150/litre + operator overhead). Confirm fuel arrangement at the time of booking to avoid mid-event surprises.',
  },
  {
    q: 'What is the minimum rental period for a generator?',
    a: 'Minimum rental period is typically 1 day (8 working hours). For events spanning a weekend, 2-day packages offer 10–15% savings. Weekly rentals (7 days) offer 25–30% discount over the daily rate. Monthly rental packages are available for construction sites and industrial users — significantly cheaper than daily rates for long-duration needs.',
  },
  {
    q: 'How long does it take to deliver a generator to my site?',
    a: 'Standard delivery time is 4–24 hours after booking confirmation, depending on your city and generator capacity. Small units (5–25 KVA) can usually be dispatched same-day. Larger units (125 KVA+) may require 24–48 hours as they are often on active deployments. Always book at least 48 hours in advance for events to allow setup and load testing time.',
  },
  {
    q: 'What KVA generator is needed to power a 3BHK house during power cuts?',
    a: 'A typical 3BHK house with 2 ACs (1.5-ton each), refrigerator, washing machine, lights, fans, and TV requires approximately 8–12 KVA of capacity under full load. A 15 KVA generator provides comfortable backup for a 3BHK with all appliances running. A 5 KVA covers only essential loads (1 AC + lights + fans). Always calculate actual connected load before booking.',
  },
  {
    q: 'Can I rent a generator for a construction site without permanent power connection?',
    a: 'Yes, generator rental is the standard power solution for construction sites before permanent grid connection is established. For typical residential construction, a 25–62.5 KVA generator powers concrete mixers, grinders, welding equipment, and site lighting simultaneously. 24-hour (round-the-clock) deployment is available for sites with night-shift operations.',
  },
];

export default function GeneratorOnRentPage() {
  return (
    <div className="flex flex-col">
      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: GENERATOR_FAQS.map((faq) => ({
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
            name: 'Generator on Rent in India',
            description: 'Diesel generator rental services across 200+ Indian cities. 5KVA to 500KVA silent DG sets for events, construction, industrial, and residential use.',
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            areaServed: { '@type': 'Country', name: 'India' },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: 1500,
              highPrice: 35000,
              offerCount: 200,
              description: '5KVA generator from ₹1,500/day to 500KVA at ₹35,000/day',
            },
            serviceType: 'Generator Rental',
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
              { '@type': 'ListItem', position: 2, name: 'Generator on Rent', item: 'https://transrentals.in/generator-on-rent' },
            ],
          }),
        }}
      />
      <HowToSchema
        name="How to Rent a Generator on TransRentals"
        description="Book a diesel generator or DG set in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Calculate Your Power Requirement', text: 'Add up the wattage of all appliances you need to run simultaneously. Divide by 1000 to get kW, then multiply by 1.25 to get required KVA (power factor buffer).' },
          { name: 'Choose Generator Capacity', text: 'Select a generator from 5KVA (home) to 500KVA (industrial). Choose silent DG set for events and residential areas.' },
          { name: 'Confirm Fuel & Operator', text: 'Decide whether you want fuel included or will supply diesel at site. All rentals include a certified DG operator.' },
          { name: 'Schedule Delivery & Setup', text: 'Pay advance to confirm. Generator delivered to your site and set up by the operator at least 2 hours before your event or need time.' },
        ]}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://transrentals.in' },
          { name: 'Generator on Rent', url: 'https://transrentals.in/generator-on-rent' },
        ]}
      />

      <ServiceHeroWithChat
        badge="Generator Rental in 200+ Cities"
        title="Generator on Rent"
        titleHighlight="5KVA to 500KVA | Operator Included"
        description="Rent diesel generators and silent DG sets for events, construction sites, industrial backup, and residential use. Operator included. Fuel option available. Same-day dispatch for most cities."
        features={[
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Certified Operators', color: 'text-blue-600' },
          { icon: 'zap', text: 'Silent DG Available', color: 'text-green-600' },
        ]}
        gradientFrom="blue-50"
        gradientTo="indigo-50"
      />

      {/* Generator Types & Pricing */}
      <section className="py-14 bg-white">
        <div className="container-custom max-w-5xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Generator Capacity & Daily Rental Rates</h2>
          <p className="text-gray-500 text-center mb-8 text-sm">Rates are indicative. Fuel charged separately. Silent DG set adds 15–20% to base rate.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {GENERATOR_TYPES.map((gen) => (
              <div key={gen.capacity} className="bg-gray-50 rounded-xl border border-gray-100 p-5 relative">
                {gen.tag && (
                  <span className="absolute top-3 right-3 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    {gen.tag}
                  </span>
                )}
                <p className="text-xl font-bold text-gray-900">{gen.capacity}</p>
                <p className="text-sm text-gray-500 mb-1">{gen.usage}</p>
                <p className="text-blue-600 font-bold text-lg mb-2">{gen.price}<span className="text-sm font-normal text-gray-500">/day</span></p>
                <p className="text-gray-600 text-sm">{gen.specs}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Applications */}
      <section className="py-14 bg-gray-50">
        <div className="container-custom max-w-5xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Where Is Generator Rental Used?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {APPLICATIONS.map((app) => (
              <div key={app.title} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <div className="text-3xl mb-3">{app.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{app.title}</h3>
                <p className="text-gray-600 text-sm">{app.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-14 bg-white">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What Is Included in Generator Rental</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {INCLUDED.map((item) => (
              <div key={item.title} className="flex gap-4 bg-blue-50 rounded-xl p-5">
                <span className="text-blue-600 font-bold text-lg mt-0.5">✓</span>
                <div>
                  <p className="font-bold text-gray-900">{item.title}</p>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <strong>Note:</strong> Diesel/fuel is charged separately at actuals unless you opt for the fuel-included package. Confirm fuel arrangement at booking.
          </div>
        </div>
      </section>

      {/* How to Calculate KVA */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Calculate the Generator Size You Need</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { step: '1', title: 'List All Equipment', desc: 'Note down every appliance, machine, or light you need to run simultaneously. Include starting surge current for motors and ACs (typically 2–3× running wattage).' },
              { step: '2', title: 'Add Up Total Watts', desc: 'Sum the running wattage of all equipment. For ACs and motors, multiply by 2.5 for starting load. This gives you total watts needed.' },
              { step: '3', title: 'Convert to KVA', desc: 'Divide total watts by 1000 to get kW. Divide kW by 0.8 (power factor) to get KVA. Add 20% safety buffer. That is your generator size.' },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm mb-3">{s.step}</div>
                <p className="font-bold text-gray-900 mb-1">{s.title}</p>
                <p className="text-gray-600 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LocationsGrid service="generator-on-rent" />

      {/* FAQs */}
      <section className="py-14 bg-white">
        <div className="container-custom max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Generator Rental FAQs</h2>
          <div className="space-y-3">
            {GENERATOR_FAQS.map((faq, i) => (
              <details key={i} className="bg-gray-50 rounded-xl border border-gray-100 group">
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

      {/* Related Services */}
      <section className="py-10 bg-gray-50 border-t border-gray-100">
        <div className="container-custom max-w-4xl">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Related Equipment Rental Services</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Equipment Rental', href: '/equipment-rental' },
              { label: 'Crane on Rent', href: '/crane-on-rent' },
              { label: 'JCB on Rent', href: '/jcb-on-rent' },
              { label: 'Hydra on Rent', href: '/hydra-on-rent' },
              { label: 'Excavator on Rent', href: '/excavator-on-rent' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-blue-500 hover:text-blue-700 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
