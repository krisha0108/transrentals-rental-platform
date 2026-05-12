import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { LocationsGrid } from '@/components/services/LocationsGrid';
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
    price: '₹6,000',
    tag: 'Most Popular',
    desc: 'Ideal for residential construction, loading/unloading at warehouses, and light industrial lifting within 4-metre radius.',
    uses: 'Steel beams, precast slabs, machinery up to 8T',
  },
  {
    capacity: '10 Ton',
    price: '₹7,500',
    tag: '',
    desc: 'Suited for medium construction sites and industrial plants. Can operate in slightly tighter spaces than a mobile crane.',
    uses: 'Heavy precast panels, transformer installation, pipe laying',
  },
  {
    capacity: '12 Ton',
    price: '₹9,000',
    tag: '',
    desc: 'For heavier lifting at construction sites, road-laying projects, and industrial equipment installation.',
    uses: 'Heavy machinery, fabricated steel, large precast elements',
  },
  {
    capacity: '14 Ton',
    price: '₹10,500',
    tag: 'Max Capacity',
    desc: 'Maximum hydra capacity — used for large industrial lifts and heavy structural steel erection within site.',
    uses: 'Heavy plant equipment, large steel structures, industrial boilers',
  },
];

const APPLICATIONS = [
  { icon: '🏗️', title: 'Construction Sites', desc: 'Lifting precast slabs, steel beams, column formwork, and scaffolding material within the construction site perimeter without needing a fixed crane.' },
  { icon: '🏭', title: 'Factory & Industrial', desc: 'Installing heavy machinery, moving production equipment during plant layout changes, and lifting motors or transformers inside industrial sheds.' },
  { icon: '🏢', title: 'Warehouses & Logistics', desc: 'Loading and unloading heavy goods from trucks, stacking oversized pallets, and moving heavy freight containers within warehouse yards.' },
  { icon: '🛣️', title: 'Road & Infrastructure', desc: 'Pipe laying for drainage and water supply, placing pre-cast culverts, and lifting road crash barriers and utility poles.' },
  { icon: '🔌', title: 'Utilities & Power', desc: 'Transformer installation, distribution panel lifting, and substation equipment erection. Used by MSEDCL, TNEB, and BESCOM contractors regularly.' },
  { icon: '🚢', title: 'Port & Yard Operations', desc: 'Container and cargo handling in small ports and freight yards where large port cranes are not available. Flexible yard movement.' },
];

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

      <ServiceHeroWithChat
        badge="Hydra Crane Rental in 200+ Cities"
        title="Hydra on Rent"
        titleHighlight="8T to 14T | Operator Included"
        description="Rent pick and carry hydra cranes for construction sites, factories, and warehouses. Self-propelled — no repositioning delay. Certified operator included. Same-day deployment in most major cities."
        features={[
          { icon: 'star', text: '8T–14T Capacity', color: 'text-amber-500' },
          { icon: 'shield', text: 'TPI Certified', color: 'text-blue-600' },
          { icon: 'zap', text: 'Quick Deployment', color: 'text-yellow-600' },
        ]}
        gradientFrom="yellow-50"
        gradientTo="amber-50"
      />

      {/* Hydra Types & Pricing */}
      <section className="py-14 bg-white">
        <div className="container-custom max-w-5xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Hydra Crane Capacity & Daily Rental Rates</h2>
          <p className="text-gray-500 text-center mb-8 text-sm">Rates include certified operator. Fuel (diesel) charged separately at actuals.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {HYDRA_TYPES.map((h) => (
              <div key={h.capacity} className="bg-gray-50 rounded-xl border border-gray-100 p-5 relative">
                {h.tag && (
                  <span className="absolute top-3 right-3 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    {h.tag}
                  </span>
                )}
                <p className="text-xl font-bold text-gray-900">{h.capacity}</p>
                <p className="text-amber-600 font-bold text-lg mb-2">{h.price}<span className="text-sm font-normal text-gray-500">/day</span></p>
                <p className="text-gray-600 text-sm mb-2">{h.desc}</p>
                <p className="text-xs text-gray-400"><strong>Typical use:</strong> {h.uses}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Applications */}
      <section className="py-14 bg-gray-50">
        <div className="container-custom max-w-5xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Where Is a Hydra Crane Used?</h2>
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

      {/* Hydra vs Mobile Crane Comparison */}
      <section className="py-14 bg-white">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Hydra Crane vs Mobile Crane — Which Do You Need?</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Feature</th>
                  <th className="px-4 py-3 text-left font-bold text-amber-700">Hydra Crane</th>
                  <th className="px-4 py-3 text-left font-bold text-blue-700">Mobile Crane</th>
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

      <LocationsGrid service="hydra-on-rent" />

      {/* FAQs */}
      <section className="py-14 bg-white">
        <div className="container-custom max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Hydra Crane Rental FAQs</h2>
          <div className="space-y-3">
            {HYDRA_FAQS.map((faq, i) => (
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
          <h2 className="text-lg font-bold text-gray-800 mb-4">Related Crane & Equipment Services</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Crane on Rent', href: '/crane-on-rent' },
              { label: 'Equipment Rental', href: '/equipment-rental' },
              { label: 'JCB on Rent', href: '/jcb-on-rent' },
              { label: 'Excavator on Rent', href: '/excavator-on-rent' },
              { label: 'Generator on Rent', href: '/generator-on-rent' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-amber-500 hover:text-amber-700 transition-colors"
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
