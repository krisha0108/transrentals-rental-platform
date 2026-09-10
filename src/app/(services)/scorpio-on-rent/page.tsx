import { Metadata } from 'next';
import { Zap, Mountain, Users, ShieldCheck, Tent, Heart, MessageCircleQuestion, Plus } from 'lucide-react';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

const WHY_SCORPIO = [
  { icon: Zap, anim: 'tick', title: 'Powerful Engine', desc: '2.2L mHawk Diesel' },
  { icon: Mountain, anim: 'lift', title: '4x4 Option', desc: 'Go anywhere capability' },
  { icon: Users, anim: 'pulse', title: '6/7 Seater', desc: 'Family-friendly space' },
  { icon: ShieldCheck, anim: 'grow', title: 'Rugged Build', desc: 'Built for tough roads' },
];

const SCORPIO_PERFECT_FOR = [
  { icon: Mountain, anim: 'lift', title: 'Mountain Trips', desc: 'Ladakh, Spiti, Himalayas' },
  { icon: Tent, anim: 'wrench', title: 'Adventure Travel', desc: 'Off-road capable' },
  { icon: Users, anim: 'pulse', title: 'Family Outstation', desc: 'Space for 7 + luggage' },
  { icon: Heart, anim: 'tick', title: 'Weddings', desc: 'Grand entry vehicle' },
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

function WhyChooseGrid({ items }: { items: typeof WHY_SCORPIO }) {
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
  title: 'Scorpio on Rent Without Driver | Self Drive @₹2499/Day',
  description: formatPriceHighlight('Rent Mahindra Scorpio-N without driver across India. Rugged SUV for adventure trips, outstation. 6 & 7 seater. Book now!'),
  keywords: ['scorpio on rent', 'mahindra scorpio on rent', 'scorpio n self drive', 'rent scorpio without driver'],
  openGraph: { title: formatPriceHighlight('Scorpio on Rent Without Driver @₹2499/Day'), url: 'https://transrentals.in/scorpio-on-rent' },
  alternates: { canonical: 'https://transrentals.in/scorpio-on-rent' },
};

const FAQS = [
  { question: 'What is the difference between Scorpio-N and Scorpio Classic on rent?', answer: 'Scorpio-N (Z4, Z6, Z8, Z8 L) is the newer, more powerful and feature-rich model, while Scorpio Classic is the older body-on-frame design. Both are available for self-drive rental starting around ₹2,499/day.' },
  { question: 'Is a 4x4 Scorpio available for rent?', answer: 'Yes, the 4x4 variant is available for rugged terrain and mountain trips like Ladakh or Spiti, usually at a slightly higher daily rate than the 4x2 version.' },
  { question: 'Does the Scorpio come in a 6-seater or 7-seater layout?', answer: 'Both 6-seater (captain seats) and 7-seater bench-seat configurations are available depending on the variant, so you can pick based on your group size.' },
  { question: 'What documents and security deposit are required for self-drive Scorpio rental?', answer: 'A valid driving licence and a government ID (Aadhaar/PAN) are needed for KYC. A refundable security deposit is collected at pickup and returned after the post-trip inspection.' },
  { question: 'Is the Scorpio suitable for mountain and off-road trips like Ladakh or Spiti?', answer: 'Yes, the 2.2L mHawk diesel engine, high ground clearance, and rugged build make the Scorpio one of the top picks for Himalayan and off-road adventure trips.' },
];

export default function ScorpioOnRentPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Mahindra Scorpio on TransRentals"
        description="Book Scorpio self-drive for adventure or family trips in 4 steps."
        totalTime="PT8M"
        steps={[
          { name: 'Select City & Trip Dates', text: 'Enter pickup city and rental period. Scorpio available for weekend, weekly, and monthly rentals.' },
          { name: 'Choose Scorpio Variant', text: 'Select Scorpio-N or Scorpio Classic in 6-seater or 7-seater configuration. Check 4WD availability.' },
          { name: 'KYC & Deposit', text: 'Upload DL and government ID. Pay refundable security deposit to confirm booking.' },
          { name: 'Pick Up & Explore', text: 'Collect Scorpio at vendor location or opt for home delivery. Perfect for rugged terrain trips.' },
        ]}
      />
      <SwiftRentalTypeHero
        vehicleName="Mahindra Scorpio"
        selfDrivePrice="₹2,499"
      />

      <section className="relative bg-gradient-to-br from-amber-700 to-orange-800 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Mahindra Scorpio on Rent</h1>
            <p className="text-xl opacity-90 mb-8">Scorpio-N Z4 • Z6 • Z8 • Z8 L • Scorpio Classic</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-amber-700 transition">Find Near You</a>
            </div>
          </div>
        </div>
      </section>

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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Why Rent Scorpio?</h2>
          <WhyChooseGrid items={WHY_SCORPIO} />
        </div>
      </section>

      <section className="relative overflow-hidden py-16 md:py-24 bg-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Perfect For</h2>
          <WhyChooseGrid items={SCORPIO_PERFECT_FOR} />
        </div>
      </section>

      <StaticServicePopularCitiesGrid serviceSlug="scorpio-on-rent" title="Scorpio on Rent in Available Cities" />

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
              Scorpio Rental <span className="text-emerald-600">FAQs</span>
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
