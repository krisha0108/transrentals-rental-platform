import React from 'react';
import type { Metadata } from 'next';
import { WeddingBusRentalServiceHero } from '@/components/services/WeddingBusRentalServiceHero';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { FAQSection } from '@/components/services/FAQSection';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
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
      <ServiceHeroWithChat
        badge="Wedding Bus Services in 250+ Cities"
        title="Wedding Bus Rental | Baraat Bus Hire"
        titleHighlight="Starting @₹5999/Day"
        description="Book luxury buses for wedding guests, baraat, and family transport. Decorated AC buses with professional service."
        gradientFrom="rose-50"
        gradientTo="pink-50"
      />

      <WeddingBusRentalServiceHero />

      {/* Services Included */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            What&apos;s Included in Wedding Bus Rental?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🚌', title: 'Well-Maintained Buses', desc: 'Clean & serviced vehicles' },
              { icon: '👨‍✈️', title: 'Professional Drivers', desc: 'Experienced & courteous' },
              { icon: '🎀', title: 'Decoration Options', desc: 'Flowers & ribbons available' },
              { icon: '❄️', title: 'AC Comfort', desc: 'Climate controlled interiors' },
              { icon: '🎵', title: 'Music System', desc: 'Play your favorite songs' },
              { icon: '💺', title: 'Comfortable Seating', desc: 'Push-back & reclining seats' },
              { icon: '🛡️', title: 'Fully Insured', desc: 'Complete safety coverage' },
              { icon: '📞', title: '24/7 Support', desc: 'Always available for assistance' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LocationsGrid service="wedding-bus-rental" />

      <FAQSection service="wedding-bus-rental" customFaqs={FAQS} />

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
