import React from 'react';
import type { Metadata } from 'next';
import { Gauge, Target, Zap, ShieldCheck, MessageCircleQuestion, Plus } from 'lucide-react';
import { BikeSearchHero } from '@/components/bike/BikeSearchHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { HowToSchema } from '@/components/seo/schemas';

const WHY_KTM = [
  { icon: Gauge, anim: 'pulse', title: 'High Performance', desc: 'Up to 43 HP power output' },
  { icon: Target, anim: 'lift', title: 'Aggressive Styling', desc: 'Head-turning street presence' },
  { icon: Zap, anim: 'fill', title: 'Quick Acceleration', desc: '0-100 in under 6 seconds' },
  { icon: ShieldCheck, anim: 'pulse', title: 'Premium Build', desc: 'European engineering quality' },
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

const ICON_HOVER_ANIM: Record<string, string> = {
  pulse: 'group-hover:scale-125',
  lift: 'group-hover:-translate-y-2',
  fill: 'group-hover:-translate-y-1.5',
};

export const metadata: Metadata = {
  title: 'KTM on Rent in India | Duke & RC Bike Rental @₹999/Day | TransRentals',
  description: 'Rent KTM bikes across India. Duke 200, Duke 390, RC 200, RC 390 available. High performance sports bikes for thrill seekers. Daily & monthly rental from ₹999/day.',
  keywords: [
    'ktm on rent',
    'ktm duke on rent',
    'ktm rc on rent',
    'duke 390 rental',
    'ktm bike rental india',
    'sports bike on rent',
  ],
  openGraph: {
    title: 'KTM on Rent in India @₹999/Day | TransRentals',
    description: 'Rent KTM Duke & RC bikes. High performance sports bikes starting @₹999/day.',
    type: 'website',
    url: 'https://transrentals.in/ktm-on-rent',
    images: [
      {
        url: 'https://transrentals.in/images/og/ktm-rental.jpg',
        width: 1200,
        height: 630,
        alt: 'KTM Bike Rental - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KTM on Rent in India | TransRentals',
    description: 'Rent KTM Duke & RC bikes starting @₹999/day.',
    images: ['https://transrentals.in/images/og/ktm-rental.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/ktm-on-rent',
  },
};

const FAQS = [
  { question: 'What is the rental price for a KTM bike?', answer: 'KTM rental starts at ₹999/day, with Duke 200 the entry-level option and the RC 390 priced higher for its performance-tuned engine and fairing.' },
  { question: 'Which KTM models are available on rent?', answer: 'Duke 200, Duke 390, RC 200, and RC 390 are available for daily and monthly rental across 200+ cities on TransRentals.' },
  { question: 'What documents and deposit are required to rent a KTM?', answer: 'A valid driving license with a motorcycle endorsement and Aadhaar are required, along with a higher security deposit given the high-performance category.' },
  { question: 'Do I need prior riding experience to rent a KTM?', answer: 'Since KTM Duke and RC models offer up to 43 HP and 0-100 km/h in under 6 seconds, we recommend prior experience with geared bikes before riding a KTM.' },
  { question: 'Is riding gear provided with the KTM rental?', answer: 'A helmet is included with every booking; full riding jackets, gloves, and knee guards are strongly recommended and available on request given the bike\'s performance.' },
];

export default function KTMRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a KTM Bike on TransRentals"
        description="Book KTM Duke or RC rental in 4 simple steps."
        totalTime="PT8M"
        steps={[
          { name: 'Select City & Rental Period', text: 'Enter your city and rental duration. KTM Duke 200, Duke 390, RC 200, RC 390 available daily.' },
          { name: 'Choose KTM Model', text: 'Pick Duke for street riding or RC for track/performance. Check engine size and handlebar configuration.' },
          { name: 'Submit Documents', text: 'Upload DL with valid motorcycle endorsement and Aadhaar. Pay deposit for high-performance bike category.' },
          { name: 'Ride the Beast', text: 'Pick up KTM at vendor location after inspection. Wear full riding gear before starting your ride.' },
        ]}
      />
      <BikeSearchHero />

      {/* Why KTM */}
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
              Why Rent <span className="text-emerald-600">KTM?</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 max-w-5xl mx-auto">
            {WHY_KTM.map((item, idx) => (
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

      <StaticServicePopularCitiesGrid serviceSlug="ktm-on-rent" title="KTM Rental in Available Cities" />

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
              KTM Rental <span className="text-emerald-600">FAQs</span>
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
