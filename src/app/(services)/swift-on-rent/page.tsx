import { Metadata } from 'next';
import { Gauge, Fuel, Wrench, ParkingSquare, MessageCircleQuestion, Plus } from 'lucide-react';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

const WHY_SWIFT = [
  { icon: Gauge, anim: 'drive', title: 'Sporty Design', desc: 'Head-turning looks & style' },
  { icon: Fuel, anim: 'tick', title: '22 km/l Mileage', desc: 'Best in class fuel efficiency' },
  { icon: Wrench, anim: 'wrench', title: 'Low Maintenance', desc: 'Maruti reliability & service' },
  { icon: ParkingSquare, anim: 'pulse', title: 'Easy Parking', desc: 'Compact size, perfect for city' },
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
  tick: 'group-hover:rotate-[360deg]',
  wrench: 'group-hover:rotate-45',
  pulse: 'group-hover:scale-125',
};

function WhyChooseGrid({ items }: { items: typeof WHY_SWIFT }) {
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
  title: 'Swift on Rent Without Driver | Self Drive @₹899/Day',
  description: formatPriceHighlight('Rent Maruti Swift without driver across India. Self-drive Swift rental for city commute & short trips. Most popular hatchback with great mileage. Book now!'),
  keywords: [
    'swift on rent',
    'maruti swift on rent',
    'swift self drive',
    'rent swift without driver',
    'swift rental near me',
    'swift car rental',
  ],
  openGraph: {
    title: formatPriceHighlight('Swift on Rent Without Driver @₹899/Day | TransRentals'),
    description: formatPriceHighlight('Self-drive Maruti Swift rental. Most popular hatchback for city commute.'),
    type: 'website',
    url: 'https://transrentals.in/swift-on-rent',
  },
  alternates: {
    canonical: 'https://transrentals.in/swift-on-rent',
  },
};

const FAQS = [
  { question: 'What documents are required to rent a Swift without a driver?', answer: 'You need a valid driving licence (held for at least 1 year) plus Aadhaar or PAN for KYC. Upload documents online and get instant approval to book the Maruti Swift self-drive.' },
  { question: 'What is the security deposit for self-drive Swift rental?', answer: 'A refundable security deposit (typically ₹3,000–₹5,000 depending on city and vendor) is collected at pickup and refunded after the post-rental vehicle inspection.' },
  { question: 'Is there a km limit on the ₹899/day Swift rental?', answer: 'Daily Swift plans usually include a free km limit (around 100–120 km/day), with extra km billed per km beyond that. Weekly packages often offer a higher combined km allowance.' },
  { question: 'Can I choose between manual and automatic (AMT) Swift?', answer: 'Yes, both Swift manual and Swift AMT are available on rent. The manual variant starts at the base ₹899/day rate; AMT is offered at a slightly higher daily rate depending on the city.' },
  { question: 'What is the minimum age and driving experience needed to rent a Swift?', answer: 'You must be at least 21 years old with a valid driving licence held for a minimum of 1 year to self-drive the Swift.' },
];

export default function SwiftOnRentPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Maruti Swift on TransRentals"
        description="Book Swift self-drive rental in 4 simple steps."
        totalTime="PT7M"
        steps={[
          { name: 'Choose City & Dates', text: 'Select your city and rental period. Swift available for 1 day, weekend, or weekly self-drive packages.' },
          { name: 'Confirm Swift Variant', text: 'Choose Swift petrol or diesel. Check if automatic transmission is required for city driving.' },
          { name: 'KYC & Payment', text: 'Upload DL and Aadhaar/PAN online. Pay security deposit to instantly confirm your Swift booking.' },
          { name: 'Pick Up & Drive', text: 'Collect Swift keys at vendor or request home delivery. Do pre-rental inspection and start your trip.' },
        ]}
      />
      <SwiftRentalTypeHero
        vehicleName="Maruti Swift"
        selfDrivePrice="₹899"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-red-600 to-orange-700 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Maruti Swift on Rent Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Swift LXi • Swift VXi • Swift ZXi • Swift AMT • Swift CNG
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Swift */}
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
            Why Rent a Maruti Swift?
          </h2>
          <WhyChooseGrid items={WHY_SWIFT} />
        </div>
      </section>

      <StaticServicePopularCitiesGrid serviceSlug="swift-on-rent" title="Swift on Rent in Available Cities" />

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
              Swift Rental <span className="text-emerald-600">FAQs</span>
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
