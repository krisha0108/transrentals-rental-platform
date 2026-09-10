import React from 'react';
import type { Metadata } from 'next';
import { Fuel, Wallet, Wrench, Award, Briefcase, Package, GraduationCap, MessageCircleQuestion, Plus } from 'lucide-react';
import { BikeSearchHero } from '@/components/bike/BikeSearchHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { HowToSchema } from '@/components/seo/schemas';

const WHY_SPLENDOR = [
  { icon: Fuel, anim: 'fill', title: 'Best Mileage', desc: 'Up to 75 km/litre' },
  { icon: Wallet, anim: 'pulse', title: 'Most Affordable', desc: 'Lowest rental rates' },
  { icon: Wrench, anim: 'wrench', title: 'Low Maintenance', desc: 'Reliable & easy to maintain' },
  { icon: Award, anim: 'lift', title: 'Proven Trust', desc: "India's #1 selling bike" },
];

const PERFECT_FOR = [
  { icon: Briefcase, anim: 'drive', title: 'Office Commute', desc: 'Low fuel cost, easy parking' },
  { icon: Package, anim: 'lift', title: 'Delivery Work', desc: 'Reliable for delivery executives' },
  { icon: GraduationCap, anim: 'pulse', title: 'Students', desc: 'Affordable & practical' },
];

/* Wahi "Why Choose Us" card language jo excavator-on-rent ke
   "Excavator Applications" section me hai — top icon-ring, sheen on hover. */
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

/* Plain Tailwind group-hover utilities — same mechanism as excavator-on-rent's Applications ring. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  wrench: 'group-hover:rotate-45',
  lift: 'group-hover:-translate-y-2',
  fill: 'group-hover:-translate-y-1.5',
};

export const metadata: Metadata = {
  title: 'Splendor on Rent in India | Hero Splendor Rental @₹299/Day | TransRentals',
  description: 'Rent Hero Splendor bikes across India. Splendor Plus, Splendor iSmart, Super Splendor available. Most fuel efficient bike. Daily & monthly rental from ₹299/day.',
  keywords: [
    'splendor on rent',
    'hero splendor rental',
    'splendor plus on rent',
    'super splendor rental',
    'splendor bike rental india',
    'fuel efficient bike rental',
  ],
  openGraph: {
    title: 'Splendor on Rent in India @₹299/Day | TransRentals',
    description: 'Rent Hero Splendor bikes. Most fuel efficient bikes starting @₹299/day.',
    type: 'website',
    url: 'https://transrentals.in/splendor-on-rent',
    images: [
      {
        url: 'https://transrentals.in/images/og/splendor-rental.jpg',
        width: 1200,
        height: 630,
        alt: 'Splendor Bike Rental - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Splendor on Rent in India | TransRentals',
    description: 'Rent Hero Splendor bikes starting @₹299/day.',
    images: ['https://transrentals.in/images/og/splendor-rental.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/splendor-on-rent',
  },
};

const FAQS = [
  { question: 'What is the rental price for Hero Splendor?', answer: 'Hero Splendor rental starts at just ₹299/day — the most affordable bike rental option on TransRentals, with additional savings on weekly and monthly plans.' },
  { question: 'Which Splendor variants can I rent?', answer: 'Splendor Plus, Splendor iSmart, and Super Splendor are all available for daily and monthly rental across 200+ cities.' },
  { question: 'What mileage does Hero Splendor give?', answer: 'Splendor offers up to 75 km/litre, making it India\'s most fuel-efficient commuter bike and a great low-cost rental choice.' },
  { question: 'What documents and deposit are needed to rent a Splendor?', answer: 'A valid two-wheeler driving license and Aadhaar card are required, along with a minimal refundable security deposit — lower than premium bike segments.' },
  { question: 'Is Splendor a good choice for daily office commute?', answer: 'Yes, its light weight, easy handling, and low fuel cost make Splendor ideal for daily office commute, delivery work, and short city rides.' },
];

export default function SplendorRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Hero Splendor on TransRentals"
        description="Book Hero Splendor rental for daily commuting in 4 simple steps."
        totalTime="PT7M"
        steps={[
          { name: 'Select City & Duration', text: 'Enter city and choose rental period. Splendor Plus, iSmart, and Super Splendor available for daily and monthly rental.' },
          { name: 'Choose Variant', text: 'Select Splendor Plus for basic commuting or Super Splendor for slightly more power. Both offer great fuel economy.' },
          { name: 'Upload DL & Pay Deposit', text: 'Submit driving licence with two-wheeler class and Aadhaar. Pay minimal deposit for this commuter segment.' },
          { name: 'Pick Up & Commute', text: 'Collect Splendor at vendor location. Perfect for daily office commute with excellent mileage.' },
        ]}
      />
      <BikeSearchHero />

      {/* Why Splendor */}
      <section className="wcs relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white">
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
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.1] font-black tracking-tight text-gray-900">
              Why Rent <span className="text-emerald-600">Splendor?</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 max-w-5xl mx-auto">
            {WHY_SPLENDOR.map((item, idx) => (
              <div
                key={item.title}
                className="wcs-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-7 text-center overflow-hidden"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <span aria-hidden className="wcs-sheen" />
                <div className="relative">
                  <div className="relative w-14 h-14 mx-auto mb-4">
                    <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                    <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                      <item.icon
                        className={`w-5 h-5 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                      />
                    </span>
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-900 mb-1.5 leading-snug">{item.title}</h3>
                  <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-white">
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.1] font-black tracking-tight text-gray-900">
              Perfect <span className="text-emerald-600">For</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6 max-w-4xl mx-auto">
            {PERFECT_FOR.map((item, idx) => (
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
                        className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                      />
                    </span>
                  </div>
                  <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-snug">{item.title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StaticServicePopularCitiesGrid serviceSlug="splendor-on-rent" title="Splendor Rental in Available Cities" />

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
              Splendor Rental <span className="text-emerald-600">FAQs</span>
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
                  <h3 className="flex-1 font-bold text-[15px] leading-snug text-gray-900">
                    {faq.question}
                  </h3>
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
