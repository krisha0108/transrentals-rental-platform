import React from 'react';
import type { Metadata } from 'next';
import { WeddingBusRentalServiceHero } from '@/components/services/WeddingBusRentalServiceHero';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { FAQSection } from '@/components/services/FAQSection';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Wedding Bus Rental - Luxury Buses for Marriage Starting @₹3999 | TransRentals'),
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

export default function WeddingBusRentalPage() {
  return (
    <div className="flex flex-col">
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

      <FAQSection service="bus-rental" />

    </div>
  );
}
