import { Metadata } from 'next';
import { BikeHeroWithLocation } from '@/components/bike/BikeHeroWithLocation';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { BikeServiceSchema, HowToSchema } from '@/components/seo/schemas';
import { Home, Zap, Plug, GraduationCap, Briefcase, Leaf, Search, MessageCircleQuestion, Plus } from 'lucide-react';

const CHARGING_INFO = [
  { icon: Home, anim: 'lift', title: 'Home Charging', desc: 'Plug into any regular socket. Full charge in 4-6 hours overnight.' },
  { icon: Zap, anim: 'pulse', title: 'Fast Charging', desc: 'Use public fast chargers. 0-80% in just 45-60 minutes.' },
  { icon: Plug, anim: 'tick', title: 'Partner Stations', desc: 'Access to Ather Grid, Ola Hypercharger network. Some plans include free charging!' },
];

const PERFECT_FOR = [
  { icon: GraduationCap, anim: 'lift', title: 'Students', desc: 'Low running cost, perfect for campus' },
  { icon: Briefcase, anim: 'drive', title: 'Professionals', desc: 'Silent commute, smart features' },
  { icon: Leaf, anim: 'pulse', title: 'Eco-Conscious', desc: 'Reduce your carbon footprint' },
  { icon: Search, anim: 'wrench', title: 'Try Before Buy', desc: 'Test EVs before purchasing' },
];

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover, no custom keyframes. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  lift: 'group-hover:-translate-y-2',
  wrench: 'group-hover:rotate-45',
};

export const metadata: Metadata = {
  title: 'Electric Scooter Rental | EV Bike on Rent @₹399/Day | Ola, Ather, TVS iQube | TransRentals',
  description: 'Rent electric scooters - Ola S1, Ather 450X, TVS iQube, Bajaj Chetak. Zero fuel cost, eco-friendly. Daily & monthly EV rental from ₹399/day. Book now!',
  keywords: [
    'electric scooter rental',
    'ev scooter on rent',
    'ola scooter on rent',
    'ather on rent',
    'electric bike rental',
    'tvs iqube on rent',
    'bajaj chetak rental',
    'ev rental india',
    'electric two wheeler rental',
    'green commute rental',
    'zero emission scooter',
    'electric vehicle rental',
  ],
  openGraph: {
    title: 'Electric Scooter Rental India | EV Bike @₹399/Day | TransRentals',
    description: 'Rent Ola S1, Ather 450X, TVS iQube. Zero fuel cost, eco-friendly. Daily & monthly options.',
    type: 'website',
    url: 'https://transrentals.in/electric-scooter-rental',
    images: [
      {
        url: 'https://transrentals.in/images/og/electric-scooter-rental.jpg',
        width: 1200,
        height: 630,
        alt: 'Electric Scooter Rental - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Electric Scooter Rental | Starting @₹399/Day | TransRentals',
    description: 'Rent Ola, Ather, TVS iQube electric scooters. Zero fuel cost!',
    images: ['https://transrentals.in/images/og/electric-scooter-rental.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/electric-scooter-rental',
  },
};

// Schema data
const schemaFaqs = [
  { question: 'How much does electric scooter rental cost?', answer: 'Electric scooter rental starts from ₹399/day. Monthly rentals start from ₹4,999/month. Premium EVs like Ather 450X cost ₹599/day or ₹7,999/month.' },
  { question: 'Do I need to pay for charging?', answer: 'Charging cost depends on plan. Some include free charging at partner stations. Home charging uses your electricity (₹15-20 per full charge). Much cheaper than petrol!' },
  { question: 'What is the range of electric scooters?', answer: 'Most EVs offer 80-120 km per charge. Ather 450X: 105 km, Ola S1 Pro: 135 km, TVS iQube: 100 km. Sufficient for daily city commute.' },
  { question: 'Where can I charge the electric scooter?', answer: 'You can charge at home (regular socket), public charging stations, or partner charging points. We provide charging cable with the scooter.' },
  { question: 'What documents are needed for EV rental?', answer: 'Same as regular bike: valid driving license, Aadhar card, and refundable security deposit (₹3,000-8,000 depending on model).' },
];

const schemaVehicles = [
  { name: 'Ola S1 Pro', brand: 'Ola Electric', price: 499, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
  { name: 'Ather 450X', brand: 'Ather Energy', price: 599, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
  { name: 'TVS iQube', brand: 'TVS', price: 449, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
  { name: 'Bajaj Chetak', brand: 'Bajaj', price: 549, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
  { name: 'Hero Vida V1', brand: 'Hero', price: 399, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
];

export default function ElectricScooterRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent an Electric Scooter on TransRentals"
        description="Book an EV scooter rental in 4 simple steps across India."
        totalTime="PT8M"
        steps={[
          { name: 'Select City & Dates', text: 'Choose your city and rental period. Electric scooters available for daily and monthly rental plans.' },
          { name: 'Choose EV Model', text: 'Pick from Ola S1, Ather 450X, TVS iQube, or Bajaj Chetak based on range requirements and availability.' },
          { name: 'Review Charging Policy', text: 'Check charging infrastructure details, range per charge, and whether charging cost is included.' },
          { name: 'Book & Ride Emission-Free', text: 'Submit licence and ID, pay deposit. Pick up your electric scooter and enjoy zero fuel cost riding.' },
        ]}
      />
      {/* Schema Markup */}
      <BikeServiceSchema
        serviceName="Electric Scooter Rental"
        serviceSlug="electric-scooter-rental"
        description="Rent electric scooters across India. Ola S1, Ather 450X, TVS iQube, Bajaj Chetak available. Zero fuel cost, eco-friendly. Starting @₹399/day."
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 399, max: 599 }}
        rating={4.6}
        reviewCount={1234}
      />

      <BikeHeroWithLocation />

      <StaticServicePopularCitiesGrid serviceSlug="electric-scooter-rental" title="Electric Scooter Rental in Available Cities" />

      {/* Charging Info */}
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
        <div className="container-custom relative max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Charging Made Easy
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {CHARGING_INFO.map((item) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-6 py-8 text-center overflow-hidden"
              >
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                    <item.icon
                      className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                    />
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perfect For */}
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
          <h2 className="text-3xl font-bold text-center mb-12">
            Perfect For
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {PERFECT_FOR.map((item) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-6 text-center overflow-hidden"
              >
                <div className="relative w-14 h-14 mx-auto mb-3">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[5px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                    <item.icon
                      className={`w-5 h-5 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                    />
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              Electric Scooter <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>

          <div className="max-w-5xl mx-auto space-y-3">
            {schemaFaqs.map((faq, idx) => (
              <details
                key={idx}
                open={idx === 0}
                className="group rounded-2xl bg-white border border-gray-100 shadow-sm open:border-emerald-200 open:shadow-md transition-all"
              >
                <summary className="flex items-center gap-4 px-4 sm:px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 grid place-items-center">
                    <MessageCircleQuestion className="w-[18px] h-[18px] text-emerald-600" />
                  </span>
                  <h3 className="flex-1 font-bold text-[15px] leading-snug text-gray-900">{faq.question}</h3>
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 text-gray-500 grid place-items-center transition-all duration-200 group-open:rotate-45 group-open:bg-emerald-600 group-open:text-white">
                    <Plus className="w-4 h-4" />
                  </span>
                </summary>
                <p className="px-4 sm:px-5 pb-5 sm:pl-[4.25rem] text-[14px] leading-relaxed text-gray-500">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
