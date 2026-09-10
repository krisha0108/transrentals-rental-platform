import { Metadata } from 'next';
import { CarSearchHero } from '@/components/car';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';
import { MessageCircleQuestion, Plus, Wallet, Fuel, ParkingCircle, Building2, Briefcase, GraduationCap, Car, Palmtree, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Self Drive Hatchback Rental India | @₹899/Day',
  description: formatPriceHighlight('Rent hatchback without driver across India. Swift, i20, Baleno, Tiago available. Self-drive hatchback rental for city commute. Most affordable option.'),
  keywords: [
    'self drive hatchback rental',
    'hatchback on rent without driver',
    'rent hatchback india',
    'swift on rent',
    'i20 self drive',
    'baleno rental',
  ],
  openGraph: {
    title: formatPriceHighlight('Self Drive Hatchback Rental India @₹899/Day | TransRentals'),
    description: formatPriceHighlight('Rent hatchbacks without driver. Swift, i20, Baleno available.'),
    type: 'website',
    url: 'https://transrentals.in/self-drive-hatchback-rental',
  },
  alternates: {
    canonical: 'https://transrentals.in/self-drive-hatchback-rental',
  },
};

const WHY_HATCHBACK = [
  { icon: Wallet, anim: 'pulse', title: 'Most Affordable', desc: 'Lowest rental rates in the self-drive category' },
  { icon: Fuel, anim: 'fill', title: 'Best Mileage', desc: '18-22 km/l fuel efficiency' },
  { icon: ParkingCircle, anim: 'tick', title: 'Easy Parking', desc: 'Compact size, fits anywhere' },
  { icon: Building2, anim: 'lift', title: 'City Perfect', desc: 'Ideal for traffic & narrow roads' },
];

const PERFECT_FOR = [
  { icon: Briefcase, anim: 'drive', title: 'Daily Commute', desc: 'Office travel, errands' },
  { icon: GraduationCap, anim: 'lift', title: 'Students', desc: 'Budget-friendly option' },
  { icon: Car, anim: 'drive', title: 'New Drivers', desc: 'Easy to handle & park' },
  { icon: Palmtree, anim: 'grow', title: 'Weekend Trips', desc: 'Short getaways' },
];

/* Wahi "Why Choose Us" card language jo excavator-on-rent ke Applications section me hai. */
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

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover, no custom keyframes. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  fill: 'group-hover:-translate-y-1.5',
  lift: 'group-hover:-translate-y-2',
  grow: 'group-hover:-translate-y-1.5 group-hover:scale-110',
};

function AppCard({ item, idx }: { item: typeof WHY_HATCHBACK[number]; idx: number }) {
  return (
    <div
      className="app-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden"
      style={{ animationDelay: `${idx * 90}ms` }}
    >
      <span aria-hidden className="app-sheen" />
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
  );
}

const FAQS = [
  { question: 'What is the rental price of a self-drive hatchback?', answer: 'Self-drive hatchback rental starts from ₹899/day, making it the most affordable self-drive category on TransRentals. Popular models include Maruti Swift, Hyundai i20, Tata Tiago, Baleno, Wagon R, and Grand i10.' },
  { question: 'How much mileage do self-drive hatchbacks give?', answer: 'Hatchbacks typically deliver 18-22 km/l fuel efficiency, making them the most economical choice for city commutes and short trips where you are paying for your own fuel.' },
  { question: 'What documents and deposit are needed to rent a hatchback without a driver?', answer: 'A valid driving licence and a government ID are required for KYC verification. The security deposit for hatchbacks is lower than for sedans or SUVs, reflecting the lower vehicle value and rental price.' },
  { question: 'Is a hatchback rental suitable for new or inexperienced drivers?', answer: 'Yes, hatchbacks are the easiest cars to drive and park due to their compact size, making them a popular choice for new drivers, students, and anyone not confident driving larger vehicles.' },
  { question: 'Can I rent a hatchback for a week or a month instead of daily?', answer: 'Yes, hatchbacks are available for 1-day, weekly, and monthly rentals, with discounted per-day rates on longer bookings compared to the standard ₹899/day daily rate.' },
];

export default function SelfDriveHatchbackRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Self-Drive Hatchback on TransRentals"
        description="Book a hatchback without driver in 4 simple steps."
        totalTime="PT8M"
        steps={[
          { name: 'Select City & Rental Period', text: 'Choose city, pickup date, and return date. Hatchbacks available for 1-day to monthly rentals.' },
          { name: 'Pick a Hatchback Model', text: 'Choose from Maruti Swift, Hyundai i20, Tata Tiago, or Baleno. Check fuel type and AC availability.' },
          { name: 'Complete KYC Verification', text: 'Submit driving licence and government ID online. Pay refundable security deposit to confirm booking.' },
          { name: 'Pick Up & Drive', text: 'Collect key at vendor location or opt for home delivery (select cities). Inspect car and start driving.' },
        ]}
      />
      <CarSearchHero
        city=""
        citySlug=""
        citySelectable
        pageDescription="Rent hatchbacks without driver. Swift, i20, Baleno, Tiago available. Most affordable self-drive option — starting @₹899/day."
      />

      {/* Hero */}
      <section className="bg-white py-10 border-b border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                Self Drive Hatchback Rental <span className="text-emerald-600">Across India</span>
              </h2>
              <p className="text-gray-500 mt-1.5">Swift • i20 • Baleno • Tiago • Wagon R • Grand i10</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Fully</p>
                  <p className="text-lg font-black text-gray-900">Insured</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Available</p>
                  <p className="text-lg font-black text-gray-900">6+ Models</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Hatchback */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white">
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
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">
            Why Rent a Hatchback?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {WHY_HATCHBACK.map((item, idx) => (
              <AppCard key={item.title} item={item} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <StaticServicePopularCitiesGrid serviceSlug="self-drive-hatchback-rental" title="Self Drive Hatchback in Available Cities" />

      {/* Perfect For */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">
            Perfect For
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {PERFECT_FOR.map((item, idx) => (
              <AppCard key={item.title} item={item} idx={idx} />
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
              Self Drive Hatchback <span className="text-emerald-600">FAQs</span>
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
