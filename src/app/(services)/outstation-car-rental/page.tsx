import type { Metadata } from 'next';
import {
  UserCheck, Fuel, Route, Briefcase, ShieldCheck, Map, Phone, Sparkles,
  MessageCircleQuestion, Plus,
} from 'lucide-react';
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: formatPriceHighlight('Outstation Car Rental - Intercity Car Hire Starting @₹10/km | TransRentals'),
  description:
    formatPriceHighlight('Rent cars for outstation trips across India. Round trips, one-way drops, multi-city tours. Professional drivers, all India permits. Book now!'),
  keywords: [
    'outstation car rental',
    'intercity car rental',
    'outstation cab',
    'car for outstation',
    'outstation taxi',
    'intercity car hire',
    'long distance car rental',
  ],
  openGraph: {
    title: formatPriceHighlight('Outstation Car Rental - Starting @₹10/km | TransRentals'),
    description: formatPriceHighlight('Rent cars for intercity and long-distance trips.'),
  },
};

const FAQS = [
  { question: 'What is the starting price for outstation car rental?', answer: 'Outstation car rental starts at ₹10/km, with prices varying by car category — hatchback, sedan, SUV, or luxury — and trip type: one-way, round trip, or multi-city.' },
  { question: 'Are toll, parking, and driver allowance included in the price?', answer: 'Yes, quotes are all-inclusive and cover fuel, toll and parking charges, and driver allowance, so there are no surprise costs during your outstation trip.' },
  { question: 'Can I book a one-way outstation drop, or only round trips?', answer: 'Both are available. You can book a one-way drop to your destination or a round trip where the car and driver wait to bring you back.' },
  { question: 'Is the vehicle insured and does it have valid permits for interstate travel?', answer: 'Yes, all vehicles are fully insured and carry all-India permits, so you can travel across state borders without any permit-related delays.' },
  { question: 'How far in advance should I book for outstation travel?', answer: "For regular routes, 1-2 days' notice is enough. During long weekends and festival season, book at least a week ahead to lock in your preferred car and driver." },
];

const WHATS_INCLUDED = [
  { icon: UserCheck, anim: 'lift', title: 'Professional Driver', desc: 'Experienced & courteous' },
  { icon: Fuel, anim: 'fill', title: 'Fuel Charges', desc: 'All fuel costs included' },
  { icon: Route, anim: 'drive', title: 'Toll & Parking', desc: 'All charges included' },
  { icon: Briefcase, anim: 'pulse', title: 'Driver Allowance', desc: 'Daily allowance covered' },
  { icon: ShieldCheck, anim: 'pulse', title: 'Insurance', desc: 'Fully insured vehicles' },
  { icon: Map, anim: 'drive', title: 'State Permits', desc: 'All India permits' },
  { icon: Phone, anim: 'ring', title: '24/7 Support', desc: 'Always available' },
  { icon: Sparkles, anim: 'tick', title: 'Clean Vehicles', desc: 'Sanitized & maintained' },
];

/* Icon-tile card grid — same fade-in/hover language as excavator-on-rent
   "What's Included" section. */
const OCR_CSS = `
.ocr-card {
  opacity: 0;
  animation: ocr-in .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
}
@keyframes ocr-in {
  from { opacity: 0; transform: translateY(22px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
.ocr-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 36px -16px rgba(16,185,129,.35);
  border-color: rgb(167 243 208);
}
@media (prefers-reduced-motion: reduce) {
  .ocr-card { opacity: 1; animation: none; }
  .ocr-card:hover { transform: none; }
}
`;

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  fill: 'group-hover:-translate-y-1.5',
  lift: 'group-hover:-translate-y-2',
  ring: 'group-hover:rotate-12',
};

export default function OutstationCarRentalPage() {
  return (
    <div className="flex flex-col">
      <HowToSchema
        name="How to Book Outstation Car Rental on TransRentals"
        description="Book a car for outstation travel in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Enter Trip Details', text: 'Enter pickup city, destination, travel date, and trip type — one-way or round trip.' },
          { name: 'Choose Car Category', text: 'Select hatchback, sedan, SUV, or luxury car based on group size and comfort preference.' },
          { name: 'Compare Driver Quotes', text: 'Review quotes from verified drivers. Check rates per km, driver allowance, and toll inclusions.' },
          { name: 'Book & Travel', text: 'Confirm booking with advance payment. Driver reports at pickup location at scheduled time.' },
        ]}
      />
      {/* Hero with booking form */}
      <SpecialtyCarBookingHero service="outstation" />

      {/* Fleet Display from Database */}
      <ServiceFleetDisplay
        serviceSlug="outstation-car-rental"
        title="Available Vehicles for Outstation"
        showCategories={true}
        limit={12}
        priceUnit="/km"
      />

      {/* Locations */}
      <StaticServicePopularCitiesGrid serviceSlug="outstation-car-rental" title="Outstation Car Rental in Available Cities" />

      {/* What's Included */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <style dangerouslySetInnerHTML={{ __html: OCR_CSS }} />
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
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              What&apos;s <span className="text-emerald-600">Included</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {WHATS_INCLUDED.map((item, idx) => (
              <div
                key={item.title}
                className="ocr-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm p-5"
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
              Outstation Car Rental <span className="text-emerald-600">FAQs</span>
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
    </div>
  );
}
