import { Metadata } from 'next';
import {
  Clock, KeyRound, Fuel, Smartphone, Briefcase, ShoppingCart, Stethoscope, Plane,
  MessageCircleQuestion, Plus,
} from 'lucide-react';
import { HourlyPopularPackages } from '@/components/hourly-car-rental/HourlyPopularPackages';
import { HourlyBookingHeroAuto } from '@/components/hourly-car-rental/HourlyBookingHeroAuto';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { HowToSchema } from '@/components/seo/schemas';

const WHY_HOURLY = [
  { icon: Clock, anim: 'tick', title: 'Pay Per Hour', desc: 'No full-day charges' },
  { icon: KeyRound, anim: 'wrench', title: 'Self Drive', desc: 'Drive yourself, no driver' },
  { icon: Fuel, anim: 'fill', title: 'Fuel Included', desc: 'No extra fuel costs' },
  { icon: Smartphone, anim: 'pulse', title: 'Quick Booking', desc: 'Book in 2 minutes' },
];

const PERFECT_FOR = [
  { icon: Briefcase, anim: 'drive', title: 'Business Meetings', desc: 'Quick client visits' },
  { icon: ShoppingCart, anim: 'pulse', title: 'Shopping Trips', desc: 'Mall runs & errands' },
  { icon: Stethoscope, anim: 'lift', title: 'Hospital Visits', desc: 'Medical appointments' },
  { icon: Plane, anim: 'drive', title: 'Airport Runs', desc: 'Drop & pick' },
];

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover, no custom keyframes. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  fill: 'group-hover:-translate-y-1.5',
  wrench: 'group-hover:rotate-45',
  lift: 'group-hover:-translate-y-2',
};

export const metadata: Metadata = {
  title: 'Hourly Car Rental | Rent Car by Hour @₹149/hr | TransRentals',
  description: 'Rent a car by the hour for meetings, errands, shopping. Self-drive hourly rental from ₹149/hr. Flexible 2-8 hour packages. Book now!',
  keywords: ['hourly car rental', 'rent car by hour', 'car rental per hour', 'short term car rental', 'car hire hourly'],
  openGraph: {
    title: 'Hourly Car Rental @₹149/hr | TransRentals',
    description: 'Rent a car by the hour. Flexible packages for short trips.',
    url: 'https://transrentals.in/hourly-car-rental',
  },
  alternates: { canonical: 'https://transrentals.in/hourly-car-rental' },
};

const FAQS = [
  { question: 'What is the price of hourly car rental?', answer: 'Hourly self-drive car rental starts at ₹149/hr, with flexible 2, 4, and 8-hour packages that include a preset km limit. Exact pricing depends on your city and car type — hatchback, sedan, or SUV.' },
  { question: 'Is fuel included in the hourly rental price?', answer: 'Yes, fuel costs are included in the hourly package price — there are no separate fuel charges to pay on top of your booking.' },
  { question: 'What do I need to rent a self-drive car by the hour?', answer: 'You need a valid driving license and to complete quick online KYC verification. Once verified, you can book instantly and drive yourself — no separate driver required.' },
  { question: "What happens if I don't return the car within my booked hours?", answer: 'You can return anytime within your booked package (2, 4, or 8 hours). Extending the booking is possible if needed, but time used beyond the package is charged extra, so plan your hours accordingly.' },
  { question: 'Do I need to pick up the car myself, or is delivery available?', answer: "Both options are available — you can pick up the car at the vendor's location or opt for home delivery in select cities, based on your convenience." },
];

export default function HourlyCarRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Book Hourly Car Rental on TransRentals"
        description="Rent a car by the hour in 4 simple steps."
        totalTime="PT5M"
        steps={[
          { name: 'Choose City & Package', text: 'Select your city and hourly package — 2 hours, 4 hours, or 8 hours with included km limit.' },
          { name: 'Pick Car Type', text: 'Choose from hatchback, sedan, or SUV for your short-trip needs. All self-drive options available.' },
          { name: 'Verify & Book', text: 'Upload DL and complete KYC. Pay only for the hours needed. Instant booking confirmation.' },
          { name: 'Drive & Return', text: 'Pick up at vendor location or home delivery. Return car within the booked time to avoid extra charges.' },
        ]}
      />
      <HourlyBookingHeroAuto />

      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
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
              Why <span className="text-emerald-600">Hourly Rental?</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {WHY_HOURLY.map((item, idx) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
                style={{ animation: `hcr-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 90}ms forwards`, opacity: 0 }}
              >
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                    <item.icon
                      className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                    />
                  </span>
                </div>
                <h3 className="text-[16px] font-bold text-gray-900 mb-1.5 leading-snug">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes hcr-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="hcr-rise"] { animation: none !important; opacity: 1 !important; } }
        ` }} />
      </section>

      <HourlyPopularPackages />

      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Perfect <span className="text-emerald-600">For</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {PERFECT_FOR.map((item, idx) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animation: `hcr-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <span className="inline-flex w-12 h-12 rounded-xl bg-emerald-50 items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-emerald-600">
                  <item.icon
                    className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                  />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StaticServicePopularCitiesGrid serviceSlug="hourly-car-rental" title="Hourly Car Rental in Available Cities" />

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
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              GOOD TO KNOW
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Hourly Car Rental <span className="text-emerald-600">FAQs</span>
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
                <p className="px-4 sm:px-5 pb-5 sm:pl-[4.25rem] text-[14px] leading-relaxed text-gray-500">{faq.answer}</p>
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
