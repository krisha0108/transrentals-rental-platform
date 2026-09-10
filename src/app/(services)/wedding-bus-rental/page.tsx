import React from 'react';
import type { Metadata } from 'next';
import {
  Bus, UserCheck, Flower2, Snowflake, Music, Armchair, ShieldCheck, PhoneCall,
  MessageCircleQuestion, Plus,
} from 'lucide-react';
import { WeddingBusRentalHubHero } from '@/components/services/WeddingBusRentalHubHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Wedding Bus Rental - Luxury Buses for Marriage @₹3999',
  description:
    formatPriceHighlight('Rent luxury AC buses for weddings. Guest transportation, decorated buses, 20-50 seater options. Make your wedding memorable. Book now!'),
  keywords: [
    'wedding bus rental',
    'bus for wedding',
    'marriage bus rental',
    'wedding transport',
    'luxury bus for wedding',
    'guest transport bus',
    'shaadi bus',
  ],
  openGraph: {
    title: formatPriceHighlight('Wedding Bus Rental - Starting @₹3999 | TransRentals'),
    description: formatPriceHighlight('Luxury AC buses for your wedding guests. All sizes available.'),
  },
};

const FAQS = [
  { question: 'How much does a wedding bus rental cost?', answer: 'Wedding bus rental starts from ₹5,999/day for a decorated 20-seater and scales up with bus size and decoration level. Baraat buses with sound systems and premium decoration are priced higher. Get a free quote for your city and guest count.' },
  { question: 'Can buses be decorated for the baraat or guest transport?', answer: 'Yes, TransRentals partners offer flower decoration, ribbon work, and themed decor for baraat buses on request. Mention decoration requirements while booking so the vendor can quote and prepare in advance.' },
  { question: 'How many buses do I need for my wedding guest count?', answer: 'As a rule of thumb: a 20-seater covers 15–18 guests comfortably with luggage, a 35-seater covers 28–30 guests, and a 50-seater covers 42–45 guests. TransRentals can suggest the right mix of bus sizes based on your total guest count.' },
  { question: 'How far in advance should I book a wedding bus?', answer: 'Book at least 3–4 weeks in advance, especially during wedding season (November–February and April–May) when demand for wedding transport peaks and popular dates sell out early.' },
  { question: 'Are drivers available in formal or traditional attire for weddings?', answer: 'Many wedding transport vendors on TransRentals offer drivers in formal uniforms on request — mention this requirement when requesting your quote so it can be confirmed with the vendor in advance.' },
];

export default function WeddingBusRentalPage() {
  return (
    <div className="flex flex-col">
      <HowToSchema
        name="How to Book a Wedding Bus Rental on TransRentals"
        description="Book decorated buses for wedding ceremonies in 4 simple steps."
        totalTime="PT15M"
        steps={[
          { name: 'Enter Wedding Details', text: 'Share wedding date, guest count, pickup and drop locations. Mention if you need decorated or luxury AC buses.' },
          { name: 'Choose Bus Size', text: 'Select from 20-seater mini buses to 50-seater Volvo coaches based on guest count. Luxury and decorated options available.' },
          { name: 'Compare Vendor Quotes', text: 'Get quotes from verified wedding transport vendors. Check decorations, driver attire, and inclusions.' },
          { name: 'Confirm & Coordinate', text: 'Pay advance to confirm. Share final guest list and pickup schedule. Vendor coordinates logistics on wedding day.' },
        ]}
      />
      <WeddingBusRentalHubHero />

      {/* Services Included */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/25 to-white">
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
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            What&apos;s Included in Wedding Bus Rental?
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {[
              { Icon: Bus, title: 'Well-Maintained Buses', desc: 'Clean & serviced vehicles' },
              { Icon: UserCheck, title: 'Professional Drivers', desc: 'Experienced & courteous' },
              { Icon: Flower2, title: 'Decoration Options', desc: 'Flowers & ribbons available' },
              { Icon: Snowflake, title: 'AC Comfort', desc: 'Climate controlled interiors' },
              { Icon: Music, title: 'Music System', desc: 'Play your favorite songs' },
              { Icon: Armchair, title: 'Comfortable Seating', desc: 'Push-back & reclining seats' },
              { Icon: ShieldCheck, title: 'Fully Insured', desc: 'Complete safety coverage' },
              { Icon: PhoneCall, title: '24/7 Support', desc: 'Always available for assistance' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="group rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 px-4 py-5 text-center">
                <div className="relative w-14 h-14 mx-auto mb-3.5">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[78deg] transition-transform duration-500" />
                  <span className="absolute inset-[5px] rounded-full bg-emerald-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-emerald-600" strokeWidth={1.9} />
                  </span>
                </div>
                <h3 className="font-bold text-[15px] text-gray-900 leading-snug">{title}</h3>
                <p className="mt-1 text-[12.5px] leading-snug text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StaticServicePopularCitiesGrid serviceSlug="wedding-bus-rental" title="Wedding Bus Rental in Available Cities" />

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
              Wedding Bus Rental <span className="text-emerald-600">FAQs</span>
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
              { '@type': 'ListItem', position: 2, name: 'Bus Rental', item: 'https://transrentals.in/bus-rental' },
              { '@type': 'ListItem', position: 3, name: 'Wedding Bus Rental', item: 'https://transrentals.in/wedding-bus-rental' },
            ],
          }),
        }}
      />
    </div>
  );
}
