import { Metadata } from 'next';
import Link from 'next/link';
import {
  Zap, PartyPopper, Construction, Factory, Home, HeartPulse, Radio,
  UserCheck, Clock, Truck, Wrench, MessageCircleQuestion, Plus, MapPin, ArrowRight,
} from 'lucide-react';
import { EquipmentBookingHero } from '@/components/equipment-rental/EquipmentBookingHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
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
  { capacity: '5 KVA', usage: 'Home / Small Office', anim: 'pulse', bestFor: 'Powers AC + fans + lights. Suitable for 1–2 rooms.', features: ['Budget pick', 'Home use', 'Small office'] },
  { capacity: '15 KVA', usage: 'Small Events / Shops', anim: 'tick', bestFor: 'Ideal for small weddings, exhibitions, and commercial shops.', features: ['Small events', 'Shops', 'Exhibitions'] },
  { capacity: '25 KVA', usage: 'Medium Events / Offices', anim: 'drive', bestFor: 'Powers entire floor of an office or a mid-size function hall.', features: ['Mid-size events', 'Offices', 'Function halls'] },
  { capacity: '62.5 KVA', usage: 'Large Events / Sites', anim: 'lift', bestFor: 'Suitable for large weddings, construction sites, and factories up to 50 HP load.', features: ['Large events', 'Construction', 'Factories'] },
  { capacity: '125 KVA', usage: 'Industrial / Big Sites', anim: 'wrench', bestFor: 'Powers mid-size factories, hospitals, and large commercial buildings.', features: ['Industrial', 'Hospitals', 'Big sites'] },
  { capacity: '250 KVA', usage: 'Heavy Industrial', anim: 'grow', bestFor: 'For large manufacturing plants, data centres, and heavy construction.', features: ['Manufacturing', 'Data centres', 'Heavy construction'] },
  { capacity: '500 KVA', usage: 'Large Plant / Township', anim: 'pulse', bestFor: 'Full-scale industrial power backup for large campuses and townships.', features: ['Max capacity', 'Campuses', 'Townships'] },
];

/* Wahi wide-brochure card language jo excavator-on-rent ki
   "Excavator Types Available for Hire" section me use hui hai. */
const GEN_CSS = `
.gen-card {
  opacity: 0;
  animation: gen-in .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease;
}
@keyframes gen-in {
  from { opacity: 0; transform: translateY(26px) scale(.96); }
  to   { opacity: 1; transform: none; }
}
.gen-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 22px 46px -18px rgba(16,185,129,.45);
}
@media (prefers-reduced-motion: reduce) {
  .gen-card { opacity: 1; animation: none; }
  .gen-card:hover { transform: none; }
}
`;

/* Har icon apne kaam jaisa hilta hai — plain Tailwind group-hover utilities,
   same proven mechanism as excavator-on-rent (custom CSS keyframe hover
   animations did not render reliably there). */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  dig: 'group-hover:-rotate-[28deg] group-hover:-translate-y-0.5',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  fill: 'group-hover:-translate-y-1.5',
  wrench: 'group-hover:rotate-45',
  ring: 'group-hover:rotate-12',
  lift: 'group-hover:-translate-y-2',
  grow: 'group-hover:-translate-y-1.5 group-hover:scale-110',
};

const APPLICATIONS = [
  { icon: PartyPopper, anim: 'grow', title: 'Weddings & Events', desc: 'Silent DG sets for weddings, receptions, corporate events, concerts, and outdoor exhibitions. Sound-proof enclosures to avoid noise disturbance.' },
  { icon: Construction, anim: 'wrench', title: 'Construction Sites', desc: 'Power for concrete mixers, welding machines, site lighting, and equipment. Suitable for sites without grid connection.' },
  { icon: Factory, anim: 'pulse', title: 'Industrial Backup', desc: 'Uninterrupted power backup for factories, manufacturing plants, and MSME units during grid outages.' },
  { icon: Home, anim: 'lift', title: 'Residential / Society', desc: 'Backup power for housing societies, apartment complexes, and bungalows during load shedding.' },
  { icon: HeartPulse, anim: 'pulse', title: 'Hospitals & Clinics', desc: 'Critical power backup for hospitals, diagnostic centres, and medical facilities where uninterrupted power is non-negotiable.' },
  { icon: Radio, anim: 'tick', title: 'Telecom / IT Sites', desc: 'Generator sets for telecom tower sites, data centres, and IT parks during planned outages or maintenance windows.' },
];

/* Wahi "Why Choose Us" card language jo excavator-on-rent ki
   "Excavator Applications" section me use hui hai. */
const APP_CSS = `
.app-card {
  opacity: 0;
  animation: app-rise .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
}
@keyframes app-rise {
  from { opacity: 0; transform: translateY(22px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
.app-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px -12px rgba(16,185,129,.28);
  border-color: rgb(167 243 208);
}
.app-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(16,185,129,.10) 50%, transparent 65%);
  transform: translateX(-100%);
  transition: transform .8s ease;
  pointer-events: none;
}
.app-card:hover .app-sheen { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) {
  .app-card { opacity: 1; animation: none; }
  .app-card:hover { transform: none; }
  .app-sheen { display: none; }
}
`;

const INCLUDED = [
  { icon: UserCheck, anim: 'pulse', title: 'Certified Operator', desc: 'Trained DG set operator included for all rentals. Handles startup, load management, and shutdown.' },
  { icon: Clock, anim: 'tick', title: 'Full Day 8-Hr Shift', desc: 'Standard rental is 8 working hours. Extended 12-hr and 24-hr shifts available at additional cost.' },
  { icon: Truck, anim: 'drive', title: 'Delivery & Setup', desc: 'Generator delivered to your site and set up. Transport vehicle fees may apply beyond 25 km from vendor base.' },
  { icon: Wrench, anim: 'wrench', title: 'Basic Maintenance', desc: 'Vendor ensures machine is service-checked before dispatch. Oil and coolant topped up.' },
];

/* Card fade-in on load — same language as the Types/Applications
   sections. Hover motion is plain Tailwind group-hover. */
const INC_CSS = `
.inc-card {
  opacity: 0;
  animation: inc-in .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
}
@keyframes inc-in {
  from { opacity: 0; transform: translateY(22px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
.inc-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 36px -16px rgba(16,185,129,.35);
  border-color: rgb(167 243 208);
}
@media (prefers-reduced-motion: reduce) {
  .inc-card { opacity: 1; animation: none; }
  .inc-card:hover { transform: none; }
}
`;

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

const RELATED_LINKS = [
  { label: 'Equipment Rental', href: '/equipment-rental', icon: Construction },
  { label: 'Crane on Rent', href: '/crane-on-rent', icon: Construction },
  { label: 'JCB on Rent', href: '/jcb-on-rent', icon: Truck },
  { label: 'Hydra on Rent', href: '/hydra-on-rent', icon: Truck },
  { label: 'Excavator on Rent', href: '/excavator-on-rent', icon: Truck },
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

      <EquipmentBookingHero
        city="India"
        citySlug=""
        serviceType="equipment-generator"
        badgeLabel="Generator Rental"
        bookingTitle="Book Your Generator"
        pageHeading="Generator on Rent | 5KVA to 500KVA"
        pageDescription="Rent diesel generators and silent DG sets for events, construction sites, industrial backup, and residential use. Operator included. Fuel option available. Same-day dispatch for most cities."
      />

      {/* Generator Types */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
        <style dangerouslySetInnerHTML={{ __html: GEN_CSS }} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(620px 380px at 50% 0%, rgba(16,185,129,.10), transparent 70%)',
          }}
        />
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900 mb-3">
              Generator Capacity &amp; Rental Options
            </h2>
            <p className="text-gray-500">
              From 5 KVA for a home or small office to 500 KVA for a full industrial plant — choose the right DG set for your load
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {GENERATOR_TYPES.map((gen, idx) => (
              <div
                key={gen.capacity}
                className="gen-card group relative flex w-full max-w-lg mx-auto rounded-[18px] bg-white border border-gray-100 shadow-sm overflow-hidden"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="w-[124px] shrink-0 flex flex-col items-center justify-center gap-3 px-3 py-6 bg-emerald-50">
                  <span className="inline-flex">
                    <Zap
                      className={`w-9 h-9 text-emerald-600 transition-transform duration-500 ${ICON_HOVER_ANIM[gen.anim]}`}
                      strokeWidth={1.7}
                    />
                  </span>
                  <span className="text-[11px] font-bold text-center leading-tight text-emerald-700">
                    {gen.capacity}
                  </span>
                </div>

                <div className="flex-1 min-w-0 p-5">
                  <h3 className="text-[16px] font-bold text-gray-900 leading-snug">{gen.usage}</h3>
                  <div className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-400">Best for</div>
                  <p className="mt-0.5 text-[13px] text-gray-600">{gen.bestFor}</p>

                  <ul className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-x-5 gap-y-2">
                    {gen.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-[12.5px] text-gray-600">
                        <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-50 grid place-items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-[12.5px] mt-8">
            Rates are indicative and vary by city and duration. Fuel is charged separately; silent DG sets add 15–20% to the base rate.
          </p>
        </div>
      </section>

      {/* Applications */}
      <section className="app relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <style dangerouslySetInnerHTML={{ __html: APP_CSS }} />
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
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900">
              Where Is Generator Rental <span className="text-emerald-600">Used?</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
            {APPLICATIONS.map((app, idx) => (
              <div
                key={app.title}
                className="app-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <span aria-hidden className="app-sheen" />
                <div className="relative">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                    <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                      <app.icon
                        className={`w-6 h-6 text-emerald-600 transition-all duration-500 group-hover:text-white ${ICON_HOVER_ANIM[app.anim]}`}
                      />
                    </span>
                  </div>
                  <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-snug">{app.title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-gray-500">{app.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <style dangerouslySetInnerHTML={{ __html: INC_CSS }} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: 'radial-gradient(#BBF7D0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage:
              'radial-gradient(360px 300px at 5% 15%, #000 0%, transparent 70%), radial-gradient(360px 300px at 95% 85%, #000 0%, transparent 70%)',
            maskImage:
              'radial-gradient(360px 300px at 5% 15%, #000 0%, transparent 70%), radial-gradient(360px 300px at 95% 85%, #000 0%, transparent 70%)',
          }}
        />

        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              NO HIDDEN EXTRAS
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              What&apos;s <span className="text-emerald-600">Included</span>
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Every generator booking comes with these as standard.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {INCLUDED.map((item, idx) => (
              <div
                key={item.title}
                className="inc-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm p-5"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <span className="inline-flex w-12 h-12 rounded-xl bg-emerald-50 items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-emerald-600">
                  <item.icon
                    className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                    strokeWidth={1.8}
                  />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 max-w-6xl mx-auto rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <p className="px-5 py-4 border-l-4 border-emerald-500 text-[13.5px] text-gray-600 leading-relaxed">
              <strong className="font-bold text-gray-800">Note:</strong> Diesel/fuel is charged separately at actuals unless you opt for the fuel-included package. Confirm fuel arrangement at booking.
            </p>
          </div>
        </div>
      </section>

      {/* How to Calculate KVA */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container-custom max-w-4xl">
          <div className="mb-10 md:mb-12">
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              How to Calculate the <span className="text-emerald-600">Generator Size</span> You Need
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { step: '1', title: 'List All Equipment', desc: 'Note down every appliance, machine, or light you need to run simultaneously. Include starting surge current for motors and ACs (typically 2–3× running wattage).' },
              { step: '2', title: 'Add Up Total Watts', desc: 'Sum the running wattage of all equipment. For ACs and motors, multiply by 2.5 for starting load. This gives you total watts needed.' },
              { step: '3', title: 'Convert to KVA', desc: 'Divide total watts by 1000 to get kW. Divide kW by 0.8 (power factor) to get KVA. Add 20% safety buffer. That is your generator size.' },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="w-9 h-9 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm mb-3">{s.step}</div>
                <p className="font-bold text-gray-900 mb-1.5">{s.title}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StaticServicePopularCitiesGrid serviceSlug="generator-on-rent" title="Generator Rental in Available Cities" />

      {/* FAQs */}
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

        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              GOOD TO KNOW
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Generator Rental <span className="text-emerald-600">FAQs</span>
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Common questions about hiring a diesel generator in India.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-3">
            {GENERATOR_FAQS.map((faq, idx) => (
              /* <details> — bina kisi client JS ke khulta-band hota hai */
              <details
                key={idx}
                open={idx === 0}
                className="group rounded-2xl bg-white border border-gray-100 shadow-sm open:border-emerald-200 open:shadow-md transition-all"
              >
                <summary className="flex items-center gap-4 px-4 sm:px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 grid place-items-center">
                    <MessageCircleQuestion className="w-[18px] h-[18px] text-emerald-600" />
                  </span>
                  <h3 className="flex-1 font-bold text-[15px] leading-snug text-gray-900">
                    {faq.q}
                  </h3>
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 text-gray-500 grid place-items-center transition-all duration-200 group-open:rotate-45 group-open:bg-emerald-600 group-open:text-white">
                    <Plus className="w-4 h-4" />
                  </span>
                </summary>
                <p className="px-4 sm:px-5 pb-5 sm:pl-[4.25rem] text-[14px] leading-relaxed text-gray-500">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related Services */}
      <section className="relative py-16 bg-white border-t border-gray-100 overflow-hidden">
        {/* Subtle grid-line pattern background */}
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
              Related Services
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Related Equipment Rental Services</h2>
            <p className="text-gray-500">Explore other equipment on TransRentals</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
            {RELATED_LINKS.map((link) => (
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
