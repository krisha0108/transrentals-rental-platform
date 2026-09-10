import { Metadata } from 'next';
import { Crown, Zap, Mountain, ShieldCheck, Heart, Briefcase, Film, MessageCircleQuestion, Plus } from 'lucide-react';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { HowToSchema } from '@/components/seo/schemas';

const WHY_FORTUNER = [
  { icon: Crown, anim: 'pulse', title: 'Premium Status', desc: 'Make a statement' },
  { icon: Zap, anim: 'tick', title: 'Powerful Engine', desc: '2.8L Diesel, 204 HP' },
  { icon: Mountain, anim: 'lift', title: '4x4 Capability', desc: 'Go anywhere' },
  { icon: ShieldCheck, anim: 'grow', title: '7 Airbags', desc: 'Maximum safety' },
];

const FORTUNER_PERFECT_FOR = [
  { icon: Heart, anim: 'pulse', title: 'Weddings', desc: 'Grand entry for the couple' },
  { icon: Briefcase, anim: 'wrench', title: 'VIP Travel', desc: 'Executive & corporate' },
  { icon: Mountain, anim: 'lift', title: 'Adventure Trips', desc: 'Ladakh, mountains, off-road' },
  { icon: Film, anim: 'drive', title: 'Special Events', desc: 'Film shoots, events' },
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

function WhyChooseGrid({ items }: { items: typeof WHY_FORTUNER }) {
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
  title: 'Fortuner on Rent Without Driver | Self Drive Fortuner @₹4999/Day | TransRentals',
  description: 'Rent Toyota Fortuner without driver across India. Self-drive Fortuner rental for premium travel, weddings & VIP transport. 7-seater luxury SUV. Book now!',
  keywords: [
    'fortuner on rent',
    'toyota fortuner on rent',
    'fortuner self drive',
    'rent fortuner without driver',
    'fortuner rental near me',
    'luxury suv rental',
  ],
  openGraph: {
    title: 'Fortuner on Rent Without Driver @₹4999/Day | TransRentals',
    description: 'Self-drive Toyota Fortuner rental. Premium 7-seater SUV for luxury travel.',
    type: 'website',
    url: 'https://transrentals.in/fortuner-on-rent',
  },
  alternates: {
    canonical: 'https://transrentals.in/fortuner-on-rent',
  },
};

const FAQS = [
  { question: 'What is included in the ₹4,999/day self-drive Fortuner rental?', answer: 'The daily rate covers the vehicle rental for a 7-seater Fortuner (4x2, 4x4, or Legender variant); fuel, tolls, and state permits are billed separately as per usage.' },
  { question: 'Is a higher security deposit required for Fortuner rental?', answer: 'Yes, being a premium SUV category, the refundable security deposit is higher than mid-size cars like the Innova or Scorpio, and is returned after the vehicle inspection at drop-off.' },
  { question: 'Can I rent a Fortuner with a chauffeur for weddings or VIP travel?', answer: 'Yes, apart from self-drive, you can book the Fortuner with a professional driver for weddings, corporate VIP transport, or special events.' },
  { question: 'What is the seating capacity and safety features of the Fortuner?', answer: 'The Fortuner seats 7 passengers and comes equipped with up to 7 airbags along with a powerful 2.8L diesel engine producing 204 HP for a safe, premium ride.' },
  { question: 'Is the 4x4 Fortuner variant available for rent?', answer: 'Yes, both 4x2 and 4x4 Fortuner variants, including the Legender trim, are available for rent depending on city and stock availability.' },
];

export default function FortunerOnRentPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Toyota Fortuner on TransRentals"
        description="Book Fortuner self-drive or with chauffeur in 4 simple steps."
        totalTime="PT8M"
        steps={[
          { name: 'Choose City & Dates', text: 'Enter your city, rental start date, and duration. Fortuner available for day, weekend, and weekly rentals.' },
          { name: 'Confirm Rental Type', text: 'Choose self-drive Fortuner or with driver for VIP/wedding use. Confirm 7-seater 4WD requirement.' },
          { name: 'Verify & Pay Deposit', text: 'Submit DL and government ID for KYC. Pay higher security deposit applicable for premium SUV category.' },
          { name: 'Pick Up Premium SUV', text: 'Collect keys at vendor or doorstep delivery (select cities). Inspect and start your premium journey.' },
        ]}
      />
      <SwiftRentalTypeHero
        vehicleName="Toyota Fortuner"
        selfDrivePrice="₹4,999"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-800 to-slate-900 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Toyota Fortuner on Rent Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Fortuner 4x2 • Fortuner 4x4 • Fortuner Legender
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-slate-900 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Fortuner */}
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
            Why Rent a Toyota Fortuner?
          </h2>
          <WhyChooseGrid items={WHY_FORTUNER} />
        </div>
      </section>

      {/* Fortuner Variants */}
      {/* Perfect For */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Fortuner is Perfect For
          </h2>
          <WhyChooseGrid items={FORTUNER_PERFECT_FOR} />
        </div>
      </section>

      <StaticServicePopularCitiesGrid serviceSlug="fortuner-on-rent" title="Fortuner on Rent in Available Cities" />

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
              Fortuner Rental <span className="text-emerald-600">FAQs</span>
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
