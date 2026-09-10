import { Metadata } from 'next';
import { Users, Armchair, Wrench, Luggage, Heart, Landmark, Plane, MessageCircleQuestion, Plus } from 'lucide-react';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { HowToSchema } from '@/components/seo/schemas';

const WHY_INNOVA = [
  { icon: Users, anim: 'pulse', title: '7+1 Seating', desc: 'Perfect for large families' },
  { icon: Armchair, anim: 'lift', title: 'Captain Seats', desc: 'Premium comfort for all' },
  { icon: Wrench, anim: 'wrench', title: 'Toyota Reliability', desc: 'Most trusted MPV' },
  { icon: Luggage, anim: 'grow', title: 'Huge Boot', desc: 'Plenty of luggage space' },
];

const INNOVA_PERFECT_FOR = [
  { icon: Users, anim: 'pulse', title: 'Family Trips', desc: '7 people + luggage comfortably' },
  { icon: Heart, anim: 'tick', title: 'Weddings', desc: 'Perfect for wedding functions' },
  { icon: Landmark, anim: 'lift', title: 'Pilgrimages', desc: 'Comfortable long journeys' },
  { icon: Plane, anim: 'drive', title: 'Airport Pickup', desc: 'Group airport transfers' },
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

function WhyChooseGrid({ items }: { items: typeof WHY_INNOVA }) {
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
  title: 'Innova on Rent Without Driver | Self Drive Innova @₹2499/Day | TransRentals',
  description: 'Rent Toyota Innova without driver across India. Self-drive Innova Crysta rental for family trips, weddings & outstation. 7+1 seater MPV. Book now!',
  keywords: [
    'innova on rent',
    'toyota innova on rent',
    'innova crysta self drive',
    'rent innova without driver',
    'innova rental near me',
    '7 seater car rental',
  ],
  openGraph: {
    title: 'Innova on Rent Without Driver @₹2499/Day | TransRentals',
    description: 'Self-drive Toyota Innova Crysta rental. Best 7-seater MPV for family trips.',
    type: 'website',
    url: 'https://transrentals.in/innova-on-rent',
  },
  alternates: {
    canonical: 'https://transrentals.in/innova-on-rent',
  },
};

const FAQS = [
  { question: 'What is the seating capacity of the Innova Crysta on rent?', answer: 'The Innova Crysta comes in a 7+1 (8-seater including driver) configuration, with captain seats available in the VX and ZX variants for extra comfort on long trips.' },
  { question: 'Can I rent the Innova with a driver instead of self-drive?', answer: 'Yes, both options are available — self-drive Innova starts at ₹2,499/day, or you can book it with a professional driver for weddings, outstation trips, or airport transfers.' },
  { question: 'How much luggage can the Innova Crysta carry with all seats occupied?', answer: 'With all 7 seats occupied there is still a decent boot for hand luggage; folding down the third row (when travelling with fewer passengers) opens up much more space for bigger bags.' },
  { question: 'What documents and security deposit are needed for self-drive Innova rental?', answer: 'A valid driving licence and Aadhaar/PAN are required for KYC. Since the Innova is a higher-value MPV, the refundable security deposit is higher than for hatchbacks like the Swift.' },
  { question: 'Is the Innova Crysta good for outstation and pilgrimage trips?', answer: 'Yes, its diesel engine, sturdy build, and spacious cabin make it one of the most preferred choices for family outstation travel, weddings, and pilgrimage tours across India.' },
];

export default function InnovaOnRentPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent Toyota Innova on TransRentals"
        description="Book Innova Crysta self-drive or with driver in 4 simple steps."
        totalTime="PT8M"
        steps={[
          { name: 'Select Rental Type & City', text: 'Choose self-drive or driver-included Innova rental. Select your city and travel dates.' },
          { name: 'Confirm Vehicle Variant', text: 'Choose Innova Crysta 2.4G or 2.8 ZX. Check 7-seater configuration and AC.' },
          { name: 'Submit Documents', text: 'Upload driving licence, Aadhaar. Pay security deposit for self-drive or advance for driver booking.' },
          { name: 'Receive & Travel', text: 'Collect keys at vendor or get home delivery in select cities. Enjoy 7-seater comfort.' },
        ]}
      />
      <SwiftRentalTypeHero
        vehicleName="Toyota Innova"
        selfDrivePrice="₹2,499"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-800 to-blue-950 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Toyota Innova Crysta on Rent Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Crysta GX • Crysta VX • Crysta ZX • Innova HyCross
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-800 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Innova */}
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
            Why Rent a Toyota Innova?
          </h2>
          <WhyChooseGrid items={WHY_INNOVA} />
        </div>
      </section>

      {/* Innova Variants */}
      {/* Perfect For */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Innova is Perfect For
          </h2>
          <WhyChooseGrid items={INNOVA_PERFECT_FOR} />
        </div>
      </section>

      <StaticServicePopularCitiesGrid serviceSlug="innova-on-rent" title="Innova on Rent in Available Cities" />

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
              Innova Rental <span className="text-emerald-600">FAQs</span>
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
