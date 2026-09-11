import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MoveVertical, Truck, TowerControl, Factory, Ship, Wrench,
  Building2, Landmark, Cog, Zap, Home, Wind,
  Link2, ShieldCheck, Clock, ClipboardCheck, HardHat, PhoneCall,
  MessageCircleQuestion, Plus, MapPin, ArrowRight, Construction,
} from 'lucide-react';
import { EquipmentBookingHero } from '@/components/equipment-rental/EquipmentBookingHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
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
  { name: 'Hydra Crane', icon: MoveVertical, anim: 'lift', capacity: '5–12 Ton', bestFor: 'Steel erection, beam placement, intra-site lifts', features: ['Pick & carry', 'Intra-site mobility', 'Quick setup'] },
  { name: 'Mobile Crane', icon: Truck, anim: 'drive', capacity: '30–200 Ton', bestFor: 'Heavy lifts, bridge girders, pre-cast panels', features: ['Truck-mounted', 'High capacity', 'Highway travel'] },
  { name: 'Tower Crane', icon: TowerControl, anim: 'tick', capacity: '4–20 Ton @ height', bestFor: 'High-rise construction, multi-storey buildings', features: ['Fixed base', 'Climbs with structure', 'Tall reach'] },
  { name: 'Crawler Crane', icon: Factory, anim: 'pulse', capacity: '50–500 Ton', bestFor: 'Heavy industrial lifts, power plants, refineries', features: ['Track-mounted', 'Very heavy duty', 'Rough terrain'] },
  { name: 'Pick & Carry Crane', icon: Ship, anim: 'drive', capacity: '10–20 Ton', bestFor: 'Precast, factory yards, shipyard work', features: ['Factory yards', 'Shipyard work', 'Fast repositioning'] },
  { name: 'Truck-Mounted Crane', icon: Wrench, anim: 'wrench', capacity: '10–30 Ton', bestFor: 'Road construction, utility work, quick deployment', features: ['Quick deployment', 'Utility work', 'Road mobility'] },
];

/* Wahi wide-brochure card language jo Bus Rental Rates aur
   Truck/Equipment Types sections me use hui hai. */
const CRNT_CSS = `
.crnt-card {
  opacity: 0;
  animation: crnt-in .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease;
}
@keyframes crnt-in {
  from { opacity: 0; transform: translateY(26px) scale(.96); }
  to   { opacity: 1; transform: none; }
}
.crnt-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 22px 46px -18px rgba(16,185,129,.45);
}
@media (prefers-reduced-motion: reduce) {
  .crnt-card { opacity: 1; animation: none; }
  .crnt-card:hover { transform: none; }
}
`;

const CRANE_APPLICATIONS = [
  { icon: Building2, anim: 'lift', title: 'High-Rise Construction', desc: 'Tower crane for multi-storey buildings — concrete pour, formwork, and pre-cast panel placement' },
  { icon: Landmark, anim: 'lift', title: 'Bridges & Flyovers', desc: 'Girder launching and pre-cast bridge deck placement using mobile crane' },
  { icon: Factory, anim: 'pulse', title: 'Industrial Plant Erection', desc: 'Equipment erection in refineries, power plants, and manufacturing facilities' },
  { icon: Cog, anim: 'tick', title: 'Steel Structure Erection', desc: 'Hydra crane for structural steel beam, column, and truss installation' },
  { icon: Ship, anim: 'drive', title: 'Port & Shipyard Work', desc: 'Container and heavy cargo handling at ports and docks' },
  { icon: Zap, anim: 'pulse', title: 'Power & Transmission', desc: 'Transformer lifting, tower erection, and substation equipment placement' },
  { icon: Home, anim: 'grow', title: 'Pre-Fabricated Structures', desc: 'Pre-cast concrete panels, modular rooms, and RCC structural components' },
  { icon: Wind, anim: 'drive', title: 'Wind & Solar Projects', desc: 'Wind turbine blade and nacelle lifting; utility-scale solar panel installation' },
  { icon: Wrench, anim: 'wrench', title: 'Plant Maintenance', desc: 'Annual shutdown maintenance lifts in refineries, chemical plants, and steel mills' },
];

/* Wahi "Why Choose Us" card language jo bus-rental page me hai — top icon-ring, sheen on hover. */
const CRNA_CSS = `
.crna-card {
  opacity: 0;
  animation: crna-rise .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
}
@keyframes crna-rise {
  from { opacity: 0; transform: translateY(22px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
.crna-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px -12px rgba(16,185,129,.28);
  border-color: rgb(167 243 208);
}
.crna-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(16,185,129,.10) 50%, transparent 65%);
  transform: translateX(-100%);
  transition: transform .8s ease;
  pointer-events: none;
}
.crna-card:hover .crna-sheen { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) {
  .crna-card { opacity: 1; animation: none; }
  .crna-card:hover { transform: none; }
  .crna-sheen { display: none; }
}
`;

const INCLUDED_ITEMS = [
  { icon: Construction, anim: 'drive', title: 'Crane + Operator', desc: 'PESO/factory-certified operator with the machine — no separate staffing needed' },
  { icon: Link2, anim: 'wrench', title: 'Basic Rigging', desc: 'Wire rope slings, shackles, hook block. Advanced rigging gear on request.' },
  { icon: ShieldCheck, anim: 'pulse', title: 'Machine Insurance', desc: 'Crane is insured for third-party liability during your project duration' },
  { icon: Truck, anim: 'drive', title: 'Site Transportation', desc: 'Crane mobilisation to your project site included for nearby locations' },
  { icon: Clock, anim: 'tick', title: 'Flexible Shifts', desc: '8-hour, 12-hour, and 24-hour shift options available to match your schedule' },
  { icon: ClipboardCheck, anim: 'pulse', title: 'PESO Compliance', desc: 'All cranes come with valid PESO inspection certificates and operator credentials' },
  { icon: HardHat, anim: 'pulse', title: 'Safety Observer', desc: 'Banksman/rigger included for all critical lifts above 10 tons' },
  { icon: PhoneCall, anim: 'ring', title: 'On-Call Support', desc: '24/7 breakdown assistance. Replacement machine arranged if required.' },
];

/* Card fade-in on load — same language as the Crane Types and
   Equipment/Truck Types sections. Hover motion below is plain Tailwind
   group-hover (same proven mechanism as the Applications section's ring). */
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

/* Har icon apne kaam jaisa hilta hai — truck aage badhta hai, tower crane ghoomta hai,
   wrench kasta hai, phone bajta hai. Group-hover Tailwind utilities — same mechanism
   as the Applications section's ring (plain Tailwind, no custom keyframes — custom
   CSS keyframe hover animations did not render reliably in the browser). */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  wrench: 'group-hover:rotate-45',
  ring: 'group-hover:rotate-12',
  lift: 'group-hover:-translate-y-2',
  grow: 'group-hover:-translate-y-1.5 group-hover:scale-110',
};

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

      <EquipmentBookingHero
        city="India"
        citySlug=""
        serviceType="equipment-crane"
        badgeLabel="Crane Rental"
        bookingTitle="Book Your Crane"
        pageHeading="Crane on Rent | Certified Operators Included"
        pageDescription="Hire mobile cranes, hydra cranes, tower cranes, and crawler cranes for construction, industrial, and infrastructure projects. 5 ton to 500 ton capacity. Get quotes from verified vendors."
      />

      {/* Crane Types */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
        <style dangerouslySetInnerHTML={{ __html: CRNT_CSS }} />
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
              Crane Types Available for Hire
            </h2>
            <p className="text-gray-500">
              Choose the right crane for your project — from 5-ton intra-site hydra cranes to 500-ton crawler cranes for heavy industrial lifts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {CRANE_TYPES.map((crane, idx) => (
              <div
                key={crane.name}
                className="crnt-card group relative flex w-full max-w-lg mx-auto rounded-[18px] bg-white border border-gray-100 shadow-sm overflow-hidden"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="w-[124px] shrink-0 flex flex-col items-center justify-center gap-3 px-3 py-6 bg-emerald-50">
                  <span className="inline-flex">
                    <crane.icon
                      className={`w-9 h-9 text-emerald-600 transition-transform duration-500 ${ICON_HOVER_ANIM[crane.anim]}`}
                      strokeWidth={1.7}
                    />
                  </span>
                  <span className="text-[11px] font-bold text-center leading-tight text-emerald-700">
                    {crane.capacity}
                  </span>
                </div>

                <div className="flex-1 min-w-0 p-5">
                  <h3 className="text-[16px] font-bold text-gray-900 leading-snug">{crane.name}</h3>
                  <div className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-400">Best for</div>
                  <p className="mt-0.5 text-[13px] text-gray-600">{crane.bestFor}</p>

                  <ul className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-x-5 gap-y-2">
                    {crane.features.map((f) => (
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
        </div>
      </section>

      {/* Applications */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <style dangerouslySetInnerHTML={{ __html: CRNA_CSS }} />
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
              Crane Rental <span className="text-emerald-600">Applications</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
            {CRANE_APPLICATIONS.map((app, idx) => (
              <div
                key={app.title}
                className="crna-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <span aria-hidden className="crna-sheen" />
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
              Every crane booking comes with these as standard.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {INCLUDED_ITEMS.map((item, idx) => (
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
        </div>
      </section>

      <StaticServicePopularCitiesGrid serviceSlug="crane-on-rent" title="Crane Rental in Available Cities" />

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

        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              GOOD TO KNOW
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Crane Rental <span className="text-emerald-600">FAQs</span>
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Common questions about hiring a crane in India.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-3">
            {CRANE_FAQS.map((faq, idx) => (
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

      {/* Internal City Links */}
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
              Browse by City
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Crane on Rent by City</h2>
            <p className="text-gray-500">Jump straight to a city&apos;s dedicated page</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-5xl mx-auto mb-8">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/crane-on-rent/${city.slug}`}
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
              { href: '/equipment-rental', label: 'All Equipment Rental', icon: Construction },
              { href: '/jcb-on-rent', label: 'JCB on Rent', icon: Truck },
              { href: '/excavator-on-rent', label: 'Excavator on Rent', icon: Construction },
              { href: '/hydra-on-rent', label: 'Hydra on Rent', icon: MoveVertical },
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
