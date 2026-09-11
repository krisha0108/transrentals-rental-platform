import React from 'react';
import type { Metadata } from 'next';
import { Award, Fuel, Gauge, Wallet, MessageCircleQuestion, Plus } from 'lucide-react';
import { BikeHeroWithLocation } from '@/components/bike/BikeHeroWithLocation';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { HowToSchema } from '@/components/seo/schemas';

const WHY_PULSAR = [
  { icon: Award, anim: 'lift', title: 'Proven Reliability', desc: "India's best-selling sports bike" },
  { icon: Fuel, anim: 'fill', title: 'Fuel Efficient', desc: '45-55 km/litre mileage' },
  { icon: Gauge, anim: 'pulse', title: 'Sporty Design', desc: 'Aggressive looks, smooth ride' },
  { icon: Wallet, anim: 'pulse', title: 'Affordable', desc: 'Best value for money' },
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
  title: 'Pulsar on Rent in India | Bajaj Pulsar Rental @₹499/Day | TransRentals',
  description: 'Rent Bajaj Pulsar bikes across India. Pulsar 150, Pulsar 180, Pulsar NS200, Pulsar RS200 available. Reliable sports bikes. Daily & monthly rental from ₹499/day.',
  keywords: [
    'pulsar on rent',
    'bajaj pulsar rental',
    'pulsar 150 on rent',
    'pulsar ns200 rental',
    'pulsar bike rental india',
    'sports bike on rent',
  ],
  openGraph: {
    title: 'Pulsar on Rent in India @₹499/Day | TransRentals',
    description: 'Rent Bajaj Pulsar bikes. Reliable sports bikes starting @₹499/day.',
    type: 'website',
    url: 'https://transrentals.in/pulsar-on-rent',
    images: [
      {
        url: 'https://transrentals.in/images/og/pulsar-rental.jpg',
        width: 1200,
        height: 630,
        alt: 'Pulsar Bike Rental - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pulsar on Rent in India | TransRentals',
    description: 'Rent Bajaj Pulsar bikes starting @₹499/day.',
    images: ['https://transrentals.in/images/og/pulsar-rental.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/pulsar-on-rent',
  },
};

const FAQS = [
  { question: 'What is the rental price for a Bajaj Pulsar?', answer: 'Bajaj Pulsar rental starts at ₹499/day, with Pulsar 150 the most affordable option and NS200/RS200 priced slightly higher for their bigger engines. Weekly and monthly plans bring the per-day cost down further.' },
  { question: 'Which Pulsar models are available on rent?', answer: 'Pulsar 150, Pulsar 180, Pulsar NS200, and Pulsar RS200 are available across 200+ cities on TransRentals, so you can pick based on your commute or performance needs.' },
  { question: 'What documents do I need to rent a Pulsar?', answer: 'A valid driving license with a two-wheeler endorsement and an Aadhaar card are required. A refundable security deposit is collected at the time of pickup.' },
  { question: 'What mileage does a rented Pulsar give?', answer: 'Pulsar bikes deliver 45-55 km/litre depending on the model and riding conditions, making them a fuel-efficient choice even with their sportier engines.' },
  { question: 'Is a helmet provided with the Pulsar rental?', answer: 'Yes, a helmet is provided free of charge with every Pulsar rental booking. Additional riding gear can be arranged on request.' },
];

export default function PulsarRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Bajaj Pulsar on TransRentals"
        description="Book Pulsar bike rental in 4 simple steps."
        totalTime="PT7M"
        steps={[
          { name: 'Choose City & Dates', text: 'Select your city and rental period. Pulsar 150, 180, NS200, and RS200 available for daily and monthly rent.' },
          { name: 'Pick Pulsar Model', text: 'Choose based on engine size and riding purpose — Pulsar 150 for daily commute, NS200/RS200 for performance.' },
          { name: 'Submit Documents', text: 'Upload DL with two-wheeler endorsement and Aadhaar. Pay deposit and confirm booking instantly.' },
          { name: 'Collect & Ride', text: 'Pick up Pulsar at vendor location after inspection. Wear helmet and riding gear before heading out.' },
        ]}
      />
      <BikeHeroWithLocation />

      {/* Why Pulsar */}
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
              Why Rent <span className="text-emerald-600">Pulsar?</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 max-w-5xl mx-auto">
            {WHY_PULSAR.map((item, idx) => (
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

      <StaticServicePopularCitiesGrid serviceSlug="pulsar-on-rent" title="Pulsar Rental in Available Cities" />

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
              Pulsar Rental <span className="text-emerald-600">FAQs</span>
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
