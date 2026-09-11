import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pickaxe, Construction, Mountain, Waves, Hammer, Route, Home, Droplet, Factory, Sprout, Wrench, MessageCircleQuestion, Plus, Truck, Shovel, ShieldCheck, Clock, Fuel, PhoneCall, MapPin, ArrowRight } from 'lucide-react';
import { EquipmentBookingHero } from '@/components/equipment-rental/EquipmentBookingHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
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
  { name: 'Mini Excavator', icon: Pickaxe, anim: 'dig', range: '1–5 Ton', bestFor: 'Urban trenching, plumbing, narrow lane access', features: ['Compact size', 'Basement access', 'Landscaping'] },
  { name: 'Standard Excavator', icon: Construction, anim: 'pulse', range: '8–20 Ton', bestFor: 'Foundation pits, canal digging, road excavation', features: ['General earthmoving', 'Residential sites', 'Commercial sites'] },
  { name: 'Large Excavator', icon: Mountain, anim: 'lift', range: '20–35 Ton', bestFor: 'Deep industrial foundations, mining, dams', features: ['Heavy duty', 'Dam construction', 'Mining'] },
  { name: 'Long Reach Excavator', icon: Waves, anim: 'drive', range: '12–25 Ton', bestFor: 'River dredging, canal cleaning, deep-slope work', features: ['Extended arm', 'River dredging', 'Slope work'] },
  { name: 'Rock Breaker Excavator', icon: Hammer, anim: 'wrench', range: '8–20 Ton + Breaker', bestFor: 'Rock quarrying, hard demolition, road cutting', features: ['Hydraulic breaker', 'Rock quarrying', 'Demolition'] },
  { name: 'Wheeled Excavator', icon: Route, anim: 'drive', range: '6–14 Ton', bestFor: 'Road work, utility trenching on paved surfaces', features: ['Fast mobility', 'Paved surfaces', 'Utility work'] },
];

/* Wahi wide-brochure card language jo Bus Rental Rates aur
   Truck/Equipment Types sections me use hui hai. */
const EXT_CSS = `
.ext-card {
  opacity: 0;
  animation: ext-in .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease;
}
@keyframes ext-in {
  from { opacity: 0; transform: translateY(26px) scale(.96); }
  to   { opacity: 1; transform: none; }
}
.ext-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 22px 46px -18px rgba(16,185,129,.45);
}
@media (prefers-reduced-motion: reduce) {
  .ext-card { opacity: 1; animation: none; }
  .ext-card:hover { transform: none; }
}
`;

const INCLUDED_ITEMS = [
  { icon: Truck, anim: 'drive', title: 'Machine + Operator', desc: 'Certified, experienced operator included — no separate hiring' },
  { icon: Shovel, anim: 'dig', title: 'Standard Digging Bucket', desc: 'GP bucket included; breaker, auger, thumb available on request' },
  { icon: ShieldCheck, anim: 'pulse', title: 'Machine Insurance', desc: 'Third-party liability insurance during your rental period' },
  { icon: Truck, anim: 'drive', title: 'Site Mobilisation', desc: 'Transportation to your project site via flat-bed trailer' },
  { icon: Clock, anim: 'tick', title: 'Flexible Shifts', desc: '8-hour, 12-hour, and extended shift options available' },
  { icon: Fuel, anim: 'fill', title: 'Fuel Arrangement', desc: 'Client-provided diesel, or fuel-inclusive packages on request' },
  { icon: Wrench, anim: 'wrench', title: 'Minor Maintenance', desc: 'Routine oil, filter, and greasing handled by the vendor' },
  { icon: PhoneCall, anim: 'ring', title: 'Breakdown Support', desc: 'Replacement machine arranged within 4–8 hours' },
];

/* Card fade-in on load — same language as the Excavator Types and
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

/* Har icon apne kaam jaisa hilta hai — truck aage badhta hai, shovel khodta hai,
   clock ki suiyan ghumti hain, wrench kasta hai, fuel bharta hai, phone bajta hai.
   Group-hover Tailwind utilities — same mechanism as the Applications ring. */
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

const EXCAVATOR_APPLICATIONS = [
  { icon: Home, anim: 'pulse', title: 'Foundation Excavation', desc: 'Digging basements, foundation pits, pile caps, and column footings for residential and commercial buildings' },
  { icon: Droplet, anim: 'fill', title: 'Pipeline & Utilities', desc: 'Trenching for water supply, sewerage, gas lines, and underground cable laying' },
  { icon: Route, anim: 'drive', title: 'Road Construction', desc: 'Subgrade preparation, road cutting, culvert installation, and side drain excavation' },
  { icon: Waves, anim: 'drive', title: 'Pond & Canal Digging', desc: 'Farm pond excavation, irrigation canal digging, and water body deepening' },
  { icon: Hammer, anim: 'wrench', title: 'Demolition', desc: 'Building demolition, concrete breaking, and debris clearance with rock breaker attachment' },
  { icon: Pickaxe, anim: 'dig', title: 'Mining & Quarrying', desc: 'Overburden removal, sand and laterite excavation, and material loading' },
  { icon: Mountain, anim: 'lift', title: 'Dam & Embankment', desc: 'Earthfill dam construction, bund strengthening, and flood protection embankments' },
  { icon: Factory, anim: 'pulse', title: 'Industrial Projects', desc: 'Plant foundations, underground tank excavation, and ETP/STP pit work' },
  { icon: Sprout, anim: 'grow', title: 'Land Development', desc: 'Site leveling, terrain modification, land reclamation, and agricultural land clearing' },
];

/* Wahi "Why Choose Us" card language jo bus-rental page me hai — top icon-ring, sheen on hover. */
const EXA_CSS = `
.exa-card {
  opacity: 0;
  animation: exa-rise .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
}
@keyframes exa-rise {
  from { opacity: 0; transform: translateY(22px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
.exa-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px -12px rgba(16,185,129,.28);
  border-color: rgb(167 243 208);
}
.exa-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(16,185,129,.10) 50%, transparent 65%);
  transform: translateX(-100%);
  transition: transform .8s ease;
  pointer-events: none;
}
.exa-card:hover .exa-sheen { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) {
  .exa-card { opacity: 1; animation: none; }
  .exa-card:hover { transform: none; }
  .exa-sheen { display: none; }
}
`;

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

      <EquipmentBookingHero
        city="India"
        citySlug=""
        serviceType="equipment-excavator"
        badgeLabel="Excavator Rental"
        bookingTitle="Book Your Excavator"
        pageHeading="Excavator on Rent | Certified Operators Included"
        pageDescription="Hire hydraulic excavators for digging, trenching, foundation work, and demolition. Mini to large excavators (1 ton–35 ton) with trained operators. Get quotes from verified vendors."
      />

      {/* Excavator Types */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
        <style dangerouslySetInnerHTML={{ __html: EXT_CSS }} />
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
              Excavator Types Available for Hire
            </h2>
            <p className="text-gray-500">
              From 1-ton mini excavators for narrow urban lanes to 35-ton machines for deep industrial foundations — choose the right size for your project
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {EXCAVATOR_TYPES.map((exc, idx) => (
              <div
                key={exc.name}
                className="ext-card group relative flex w-full max-w-lg mx-auto rounded-[18px] bg-white border border-gray-100 shadow-sm overflow-hidden"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="w-[124px] shrink-0 flex flex-col items-center justify-center gap-3 px-3 py-6 bg-emerald-50">
                  <span className="inline-flex">
                    <exc.icon
                      className={`w-9 h-9 text-emerald-600 transition-transform duration-500 ${ICON_HOVER_ANIM[exc.anim]}`}
                      strokeWidth={1.7}
                    />
                  </span>
                  <span className="text-[11px] font-bold text-center leading-tight text-emerald-700">
                    {exc.range}
                  </span>
                </div>

                <div className="flex-1 min-w-0 p-5">
                  <h3 className="text-[16px] font-bold text-gray-900 leading-snug">{exc.name}</h3>
                  <div className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-400">Best for</div>
                  <p className="mt-0.5 text-[13px] text-gray-600">{exc.bestFor}</p>

                  <ul className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-x-5 gap-y-2">
                    {exc.features.map((f) => (
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
      <section className="exa relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <style dangerouslySetInnerHTML={{ __html: EXA_CSS }} />
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
              Excavator <span className="text-emerald-600">Applications</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
            {EXCAVATOR_APPLICATIONS.map((app, idx) => (
              <div
                key={app.title}
                className="exa-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <span aria-hidden className="exa-sheen" />
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
              Every excavator booking comes with these as standard.
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

      <StaticServicePopularCitiesGrid serviceSlug="excavator-on-rent" title="Excavator Rental in Available Cities" />

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
              Excavator Rental <span className="text-emerald-600">FAQs</span>
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Common questions about hiring a hydraulic excavator in India.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-3">
            {EXCAVATOR_FAQS.map((faq, idx) => (
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
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Excavator on Rent by City</h2>
            <p className="text-gray-500">Jump straight to a city&apos;s dedicated page</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-5xl mx-auto mb-8">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/excavator-on-rent/${city.slug}`}
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
              { href: '/crane-on-rent', label: 'Crane on Rent', icon: Construction },
              { href: '/mini-truck-rental', label: 'Mini Truck Rental', icon: Truck },
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
