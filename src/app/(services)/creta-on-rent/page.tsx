import { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, Armchair, ShieldCheck, Sparkles, Users, Route, Briefcase, Mountain, MessageCircleQuestion, Plus, Car } from 'lucide-react';
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { HowToSchema } from '@/components/seo/schemas';

const WHY_CRETA = [
  { icon: Trophy, anim: 'pulse', title: 'Best-Selling SUV', desc: '#1 SUV in India' },
  { icon: Armchair, anim: 'lift', title: 'Premium Comfort', desc: 'Spacious & comfortable' },
  { icon: ShieldCheck, anim: 'tick', title: 'ADAS Safety', desc: 'Advanced safety features' },
  { icon: Sparkles, anim: 'grow', title: 'Connected Car', desc: 'BlueLink technology' },
];

const CRETA_PERFECT_FOR = [
  { icon: Users, anim: 'pulse', title: 'Family Trips', desc: 'Spacious for 5 people + luggage' },
  { icon: Route, anim: 'drive', title: 'Road Trips', desc: 'Comfortable highway cruiser' },
  { icon: Briefcase, anim: 'wrench', title: 'Business Travel', desc: 'Premium appearance' },
  { icon: Mountain, anim: 'lift', title: 'Hill Stations', desc: 'Good ground clearance' },
];

/* Wahi "Why Choose Us" card language jo excavator-on-rent page me hai — dashed
   icon-ring, sheen on hover. Plain Tailwind group-hover, no custom keyframes. */
const WCS_CSS = `
.wcs-card {
  opacity: 0;
  animation: wcs-rise .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
}
@keyframes wcs-rise {
  from { opacity: 0; transform: translateY(22px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
.wcs-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px -12px rgba(16,185,129,.28);
  border-color: rgb(167 243 208);
}
.wcs-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(16,185,129,.10) 50%, transparent 65%);
  transform: translateX(-100%);
  transition: transform .8s ease;
  pointer-events: none;
}
.wcs-card:hover .wcs-sheen { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) {
  .wcs-card { opacity: 1; animation: none; }
  .wcs-card:hover { transform: none; }
  .wcs-sheen { display: none; }
}
`;

const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  lift: 'group-hover:-translate-y-2',
  wrench: 'group-hover:rotate-45',
  grow: 'group-hover:-translate-y-1.5 group-hover:scale-110',
};

function WhyChooseGrid({ items }: { items: typeof WHY_CRETA }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
      {items.map((item, idx) => (
        <div
          key={item.title}
          className="wcs-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden"
          style={{ animationDelay: `${idx * 90}ms` }}
        >
          <span aria-hidden className="wcs-sheen" />
          <div className="relative">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
              <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                <item.icon
                  className={`w-6 h-6 text-emerald-600 transition-all duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                />
              </span>
            </div>
            <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-snug">{item.title}</h3>
            <p className="text-[13.5px] leading-relaxed text-gray-500">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Creta on Rent Without Driver | Self Drive Creta @₹1999/Day | TransRentals',
  description: 'Rent Hyundai Creta without driver across India. Self-drive Creta rental for family trips, outstation & weekend getaways. Most popular SUV. Book now!',
  keywords: [
    'creta on rent',
    'hyundai creta on rent',
    'creta self drive',
    'rent creta without driver',
    'creta rental near me',
    'creta car rental',
  ],
  openGraph: {
    title: 'Creta on Rent Without Driver @₹1999/Day | TransRentals',
    description: 'Self-drive Hyundai Creta rental. Most popular SUV for family trips.',
    type: 'website',
    url: 'https://transrentals.in/creta-on-rent',
  },
  alternates: {
    canonical: 'https://transrentals.in/creta-on-rent',
  },
};

const FAQS = [
  { question: 'What is the rental price of a self-drive Hyundai Creta?', answer: 'Self-drive Hyundai Creta rental starts from ₹1999/day across Creta E, EX, S, SX and SX(O) AT variants. Petrol, diesel, and turbo variants are priced slightly differently depending on city and demand.' },
  { question: 'What is the minimum age and driving experience needed to rent a Creta?', answer: 'You must be at least 21 years old and hold a valid driving licence for a minimum of 1 year to rent a self-drive Creta. Age and licence requirements are verified during online KYC before booking confirmation.' },
  { question: 'What documents do I need to submit to rent a Creta without a driver?', answer: 'A valid driving licence along with a government ID such as Aadhaar or Voter ID is required. Upload both online — your booking is confirmed after document verification and security deposit payment.' },
  { question: 'Does the Creta come with ADAS and connected car features on rental?', answer: 'Yes, depending on the variant booked, the self-drive Creta includes ADAS (Advanced Driver Assistance Systems) safety features and Hyundai BlueLink connected car technology, especially in the SX and SX(O) variants.' },
  { question: 'Is home delivery available for the Creta self-drive booking?', answer: 'Yes, doorstep delivery of the Hyundai Creta is available in select cities for an added fee. Otherwise, you can pick up the car from the nearest vendor location after document verification.' },
];

export default function CretaOnRentPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Hyundai Creta on TransRentals"
        description="Book Creta self-drive rental in 4 simple steps."
        totalTime="PT8M"
        steps={[
          { name: 'Enter City & Dates', text: 'Choose pickup city, rental dates, and whether you need self-drive or a chauffeur-driven Creta.' },
          { name: 'Select Creta Variant', text: 'Choose between Creta petrol, diesel, or turbo. Check sunroof availability for a better travel experience.' },
          { name: 'Upload Documents', text: 'Submit DL and Aadhaar/Voter ID. Pay security deposit online. Booking confirmed after verification.' },
          { name: 'Drive Your Creta', text: 'Pick up Creta at vendor or get doorstep delivery. Inspect the car and enjoy your drive.' },
        ]}
      />
      <SpecialtyCarBookingHero service="creta" />

      {/* Hero */}
      <section className="bg-white py-10 border-b border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                Hyundai Creta on Rent <span className="text-emerald-600">Across India</span>
              </h2>
              <div className="flex flex-wrap gap-2 mt-3">
                {['Creta E', 'Creta EX', 'Creta S', 'Creta SX', 'Creta SX(O) AT'].map((variant) => (
                  <span
                    key={variant}
                    className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full"
                  >
                    <Car className="w-3 h-3" />
                    {variant}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href="#available-cities"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shrink-0"
            >
              Browse Available Cities
            </Link>
          </div>
        </div>
      </section>

      {/* Why Creta */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <style dangerouslySetInnerHTML={{ __html: WCS_CSS }} />
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Why Rent a Hyundai Creta?
          </h2>
          <WhyChooseGrid items={WHY_CRETA} />
        </div>
      </section>

      {/* Perfect For */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Creta is Perfect For
          </h2>
          <WhyChooseGrid items={CRETA_PERFECT_FOR} />
        </div>
      </section>

      <div id="available-cities">
        <StaticServicePopularCitiesGrid serviceSlug="creta-on-rent" title="Creta on Rent in Available Cities" />
      </div>

      {/* FAQ */}
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
              Creta Rental <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>
          <div className="max-w-5xl mx-auto space-y-3">
            {FAQS.map((faq, idx) => (
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
          }),
        }}
      />
    </>
  );
}
