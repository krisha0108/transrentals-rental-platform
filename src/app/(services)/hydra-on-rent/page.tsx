import { Metadata } from 'next';
import Link from 'next/link';
import {
  Truck, Boxes, Construction, Mountain, Factory, Warehouse, Route, Zap, Ship,
  Wrench, MessageCircleQuestion, Plus, ArrowRight,
} from 'lucide-react';
import { EquipmentBookingHero } from '@/components/equipment-rental/EquipmentBookingHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { HowToSchema, BreadcrumbSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Hydra on Rent | Pick & Carry Crane Rental Starting ₹6,000/Day | TransRentals',
  description:
    'Hire hydra crane (pick & carry crane) for construction, factory, and warehouse use. 8T to 14T capacity. Certified operator included. Starting ₹6,000/day across 200+ cities.',
  keywords: [
    'hydra on rent',
    'hydra crane rental',
    'pick and carry crane hire',
    'hydra crane per day',
    'hydra crane cost',
    '8 ton hydra rent',
    '14 ton hydra rent',
    'hydra crane for construction',
    'mobile pick carry crane',
    'hydra crane with operator',
    'hydra on rent near me',
  ],
  openGraph: {
    title: 'Hydra on Rent | Pick & Carry Crane Starting ₹6,000/Day | TransRentals',
    description: 'Rent 8T to 14T hydra cranes across 200+ cities. Certified operator included. Ideal for construction sites, factories, and warehouses.',
    type: 'website',
    url: 'https://transrentals.in/hydra-on-rent',
    images: [{ url: 'https://transrentals.in/api/og?service=hydra-on-rent', width: 1200, height: 630, alt: 'Hydra on Rent - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hydra on Rent | Pick & Carry Crane Starting ₹6,000/Day | TransRentals',
    description: 'Rent hydra cranes (8T–14T) across 200+ Indian cities. Operator included. For construction, factories, and loading operations.',
    images: ['https://transrentals.in/api/og?service=hydra-on-rent'],
  },
  alternates: { canonical: 'https://transrentals.in/hydra-on-rent' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

const HYDRA_TYPES = [
  {
    capacity: '8 Ton',
    icon: Truck,
    anim: 'drive',
    bestFor: 'Residential construction, warehouse loading/unloading, light industrial lifting',
    features: ['4m working radius', 'Steel beams, precast slabs', 'Machinery up to 8T'],
  },
  {
    capacity: '10 Ton',
    icon: Boxes,
    anim: 'pulse',
    bestFor: 'Medium construction sites and industrial plants, tighter spaces than a mobile crane',
    features: ['Heavy precast panels', 'Transformer installation', 'Pipe laying'],
  },
  {
    capacity: '12 Ton',
    icon: Construction,
    anim: 'wrench',
    bestFor: 'Heavier lifting at construction sites, road-laying projects, equipment installation',
    features: ['Heavy machinery', 'Fabricated steel', 'Large precast elements'],
  },
  {
    capacity: '14 Ton',
    icon: Mountain,
    anim: 'lift',
    bestFor: 'Maximum hydra capacity — large industrial lifts and heavy structural steel erection',
    features: ['Heavy plant equipment', 'Large steel structures', 'Industrial boilers'],
  },
];

const APPLICATIONS = [
  { icon: Construction, anim: 'wrench', title: 'Construction Sites', desc: 'Lifting precast slabs, steel beams, column formwork, and scaffolding material within the construction site perimeter without needing a fixed crane.' },
  { icon: Factory, anim: 'pulse', title: 'Factory & Industrial', desc: 'Installing heavy machinery, moving production equipment during plant layout changes, and lifting motors or transformers inside industrial sheds.' },
  { icon: Warehouse, anim: 'lift', title: 'Warehouses & Logistics', desc: 'Loading and unloading heavy goods from trucks, stacking oversized pallets, and moving heavy freight containers within warehouse yards.' },
  { icon: Route, anim: 'drive', title: 'Road & Infrastructure', desc: 'Pipe laying for drainage and water supply, placing pre-cast culverts, and lifting road crash barriers and utility poles.' },
  { icon: Zap, anim: 'ring', title: 'Utilities & Power', desc: 'Transformer installation, distribution panel lifting, and substation equipment erection. Used by MSEDCL, TNEB, and BESCOM contractors regularly.' },
  { icon: Ship, anim: 'drive', title: 'Port & Yard Operations', desc: 'Container and cargo handling in small ports and freight yards where large port cranes are not available. Flexible yard movement.' },
];

/* Wahi wide-brochure card language jo Excavator on Rent page me hai. */
const HYD_CSS = `
.hyd-card {
  opacity: 0;
  animation: hyd-in .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease;
}
@keyframes hyd-in {
  from { opacity: 0; transform: translateY(26px) scale(.96); }
  to   { opacity: 1; transform: none; }
}
.hyd-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 22px 46px -18px rgba(16,185,129,.45);
}
@media (prefers-reduced-motion: reduce) {
  .hyd-card { opacity: 1; animation: none; }
  .hyd-card:hover { transform: none; }
}
`;

/* Har icon apne kaam jaisa hilta hai — plain Tailwind group-hover utilities. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  lift: 'group-hover:-translate-y-2',
  wrench: 'group-hover:rotate-45',
  ring: 'group-hover:rotate-12',
};

/* Wahi "Why Choose Us" card language jo Excavator Applications section me hai. */
const HYA_CSS = `
.hya-card {
  opacity: 0;
  animation: hya-rise .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
}
@keyframes hya-rise {
  from { opacity: 0; transform: translateY(22px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
.hya-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px -12px rgba(16,185,129,.28);
  border-color: rgb(167 243 208);
}
.hya-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(16,185,129,.10) 50%, transparent 65%);
  transform: translateX(-100%);
  transition: transform .8s ease;
  pointer-events: none;
}
.hya-card:hover .hya-sheen { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) {
  .hya-card { opacity: 1; animation: none; }
  .hya-card:hover { transform: none; }
  .hya-sheen { display: none; }
}
`;

const HYDRA_VS_CRANE = [
  { feature: 'Mobility', hydra: 'Self-propelled — moves across site on wheels', crane: 'Requires separate transport to reposition' },
  { feature: 'Setup Time', hydra: '5–10 minutes — minimal outrigger setup', crane: '30–60 minutes — full outrigger and counterweight setup' },
  { feature: 'Inside Building', hydra: 'Can enter factory sheds (height permitting)', crane: 'Cannot enter enclosed structures' },
  { feature: 'Lifting Height', hydra: '8–12 metres typical max', crane: '20–100+ metres depending on type' },
  { feature: 'Lifting Capacity', hydra: 'Up to 14 tons', crane: '15 tons to 1000+ tons' },
  { feature: 'Daily Rate', hydra: '₹6,000–₹10,500', crane: '₹15,000–₹75,000' },
];

const HYDRA_FAQS = [
  {
    q: 'What is the daily rental rate for a hydra crane in India?',
    a: 'Hydra crane rental rates depend on tonnage capacity. 8-ton hydra: ₹6,000/day. 10-ton hydra: ₹7,500/day. 12-ton hydra: ₹9,000/day. 14-ton hydra: ₹10,500/day. Rates include the certified operator but typically exclude diesel fuel (charged at actuals). Rates may vary by city and vendor availability.',
  },
  {
    q: 'What is the difference between a hydra crane and a mobile crane?',
    a: 'A hydra crane (pick & carry crane) is self-propelled on rubber tyres and can move across a site while carrying a load — making it ideal for within-site material movement. A mobile crane has a longer boom and higher lifting capacity, but requires full outrigger setup and cannot travel while lifting. For construction sites and factory yards, a hydra is faster to deploy and more versatile for day-to-day lifting tasks.',
  },
  {
    q: 'What is the lifting capacity of a hydra crane?',
    a: 'Hydra cranes are available in 8-ton, 10-ton, 12-ton, and 14-ton capacities in India. The lifting capacity is at minimum radius (close to the machine). At extended boom radius, lifting capacity reduces significantly — always consult the rated capacity chart provided by the operator. For lifts above 14 tons or at greater height, a mobile crane or tower crane is required.',
  },
  {
    q: 'Is a certified operator included in hydra crane rental?',
    a: 'Yes, all hydra crane rentals on TransRentals include a certified and experienced operator. The operator is responsible for safe rigging, load assessment, and machine operation. You must provide clear site access, a level working surface, and details of the load weight and lift path before the machine arrives. The operator has the right to refuse unsafe lifts.',
  },
  {
    q: 'Can a hydra crane work inside a factory or warehouse?',
    a: 'Yes — this is one of the key advantages of a hydra over a fixed or mobile crane. A hydra can enter factory sheds and warehouse buildings provided there is adequate door height clearance (typically 4.5–5 metres for the boom in stowed position) and the floor load-bearing capacity can support the machine weight (18–22 tonnes). Confirm floor specs and doorway dimensions before booking.',
  },
  {
    q: 'What is the minimum booking period for a hydra crane?',
    a: 'The minimum booking period is typically 1 working day (8 hours). Half-day (4-hour) bookings may be available at some vendors, usually charged at 60–70% of the daily rate. Weekly and monthly hydra rentals at construction sites attract discounts of 15–25% over the daily rate. Confirm availability for your duration when requesting a quote.',
  },
  {
    q: 'How much space does a hydra crane need to operate safely?',
    a: 'A standard 8-ton hydra crane requires approximately 3–4 metres of clearance on all sides at the working radius. The machine itself is typically 2.5–3 metres wide. For 12–14 ton models, slightly more space is needed for outrigger deployment. The lift area must be level — operating on slopes greater than 3° is not recommended. The operator will assess site conditions on arrival.',
  },
  {
    q: 'What documents or permits are required for hydra crane deployment?',
    a: 'For construction sites, the crane must have a valid Third Party Inspection (TPI) certificate and the operator must hold a valid competency certificate from the Inspector of Factories or PESO. For road or public area operations, a road permit from the local municipal authority or NHAI may be required. TransRentals vendors provide machines with valid TPI certificates — confirm before booking.',
  },
];

export default function HydraOnRentPage() {
  return (
    <div className="flex flex-col">
      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: HYDRA_FAQS.map((faq) => ({
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
            name: 'Hydra Crane Rental in India',
            description: 'Pick and carry hydra crane rental services across 200+ Indian cities. 8-ton to 14-ton capacity with certified operators for construction, factory, and industrial use.',
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            areaServed: { '@type': 'Country', name: 'India' },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: 6000,
              highPrice: 10500,
              offerCount: 200,
              description: '8T hydra from ₹6,000/day to 14T hydra at ₹10,500/day',
            },
            serviceType: 'Equipment Rental',
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
              { '@type': 'ListItem', position: 2, name: 'Hydra on Rent', item: 'https://transrentals.in/hydra-on-rent' },
            ],
          }),
        }}
      />
      <HowToSchema
        name="How to Rent a Hydra Crane on TransRentals"
        description="Book a pick and carry hydra crane in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Specify Your Lift Requirements', text: 'Provide load weight (in tons), lift height, working radius, and whether the crane needs to travel within the site while loaded.' },
          { name: 'Choose Hydra Capacity', text: 'Select 8T for general construction lifting, 10–12T for medium industrial, or 14T for heavy lifts. Confirm floor bearing capacity if working indoors.' },
          { name: 'Confirm Site Access', text: 'Provide site address and confirm access width for the hydra (min. 3 metres), floor level, and doorway height if indoor operation.' },
          { name: 'Deploy & Lift Safely', text: 'Pay advance to confirm. Hydra with certified operator arrives at site. Operator assesses site conditions and executes lift as per safety protocol.' },
        ]}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://transrentals.in' },
          { name: 'Hydra on Rent', url: 'https://transrentals.in/hydra-on-rent' },
        ]}
      />

      <EquipmentBookingHero
        city="India"
        citySlug=""
        serviceType="equipment-hydra"
        badgeLabel="Hydra Crane Rental"
        bookingTitle="Book Your Hydra"
        pageHeading="Hydra on Rent | 8T to 14T"
        pageDescription="Rent pick and carry hydra cranes for construction sites, factories, and warehouses. Self-propelled — no repositioning delay. Certified operator included. Same-day deployment in most major cities."
      />

      {/* Hydra Types & Pricing */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
        <style dangerouslySetInnerHTML={{ __html: HYD_CSS }} />
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
              Hydra Crane Capacity & Rental Options
            </h2>
            <p className="text-gray-500">
              Rates include a certified operator. Fuel (diesel) is charged separately at actuals — choose the right tonnage for your lift.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {HYDRA_TYPES.map((h, idx) => (
              <div
                key={h.capacity}
                className="hyd-card group relative flex w-full max-w-lg mx-auto rounded-[18px] bg-white border border-gray-100 shadow-sm overflow-hidden"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="w-[124px] shrink-0 flex flex-col items-center justify-center gap-3 px-3 py-6 bg-emerald-50">
                  <span className="inline-flex">
                    <h.icon
                      className={`w-9 h-9 text-emerald-600 transition-transform duration-500 ${ICON_HOVER_ANIM[h.anim]}`}
                      strokeWidth={1.7}
                    />
                  </span>
                  <span className="text-[11px] font-bold text-center leading-tight text-emerald-700">
                    {h.capacity}
                  </span>
                </div>

                <div className="flex-1 min-w-0 p-5">
                  <h3 className="text-[16px] font-bold text-gray-900 leading-snug">{h.capacity} Hydra</h3>
                  <div className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-400">Best for</div>
                  <p className="mt-0.5 text-[13px] text-gray-600">{h.bestFor}</p>

                  <ul className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-x-5 gap-y-2">
                    {h.features.map((f) => (
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
      <section className="hya relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <style dangerouslySetInnerHTML={{ __html: HYA_CSS }} />
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
              Where Is a <span className="text-emerald-600">Hydra Crane</span> Used?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
            {APPLICATIONS.map((app, idx) => (
              <div
                key={app.title}
                className="hya-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <span aria-hidden className="hya-sheen" />
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

      {/* Hydra vs Mobile Crane Comparison */}
      <section className="py-14 bg-white">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Hydra Crane vs Mobile Crane — Which Do You Need?</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-50/60">
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Feature</th>
                  <th className="px-4 py-3 text-left font-bold text-emerald-700">Hydra Crane</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-500">Mobile Crane</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {HYDRA_VS_CRANE.map((row) => (
                  <tr key={row.feature}>
                    <td className="px-4 py-3 font-medium text-gray-800">{row.feature}</td>
                    <td className="px-4 py-3 text-gray-600">{row.hydra}</td>
                    <td className="px-4 py-3 text-gray-600">{row.crane}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">Use a hydra for within-site lifting up to 14T. Use a mobile crane for lifts exceeding 14T or heights above 12 metres.</p>
        </div>
      </section>

      <StaticServicePopularCitiesGrid serviceSlug="hydra-on-rent" title="Hydra Rental in Available Cities" />

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
              Hydra Crane Rental <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>

          <div className="max-w-5xl mx-auto space-y-3">
            {HYDRA_FAQS.map((faq, idx) => (
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
              <Construction className="w-4 h-4" />
              Related Services
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Related Crane & Equipment Services</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
            {[
              { label: 'Crane on Rent', href: '/crane-on-rent', icon: Construction },
              { label: 'Equipment Rental', href: '/equipment-rental', icon: Wrench },
              { label: 'JCB on Rent', href: '/jcb-on-rent', icon: Truck },
              { label: 'Excavator on Rent', href: '/excavator-on-rent', icon: Mountain },
              { label: 'Generator on Rent', href: '/generator-on-rent', icon: Zap },
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
