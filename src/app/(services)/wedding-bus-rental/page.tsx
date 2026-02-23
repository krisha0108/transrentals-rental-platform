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

      {/* Wedding Packages */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Wedding Bus Rental Packages
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Mini Bus Package',
                size: '20-25 Seaters',
                price: '₹3,999/day',
                features: [
                  'AC mini bus',
                  'Professional driver',
                  'Basic decoration included',
                  'Local pickup & drop',
                  'Perfect for small weddings',
                ],
                gradient: 'from-pink-500 to-rose-500',
              },
              {
                name: 'Standard Bus Package',
                size: '30-35 Seaters',
                price: '₹5,999/day',
                features: [
                  'Premium AC bus',
                  'Experienced driver',
                  'Premium decoration',
                  'Music system',
                  'Ideal for medium weddings',
                  'Bottled water included',
                ],
                gradient: 'from-rose-500 to-red-500',
                popular: true,
              },
              {
                name: 'Luxury Coach Package',
                size: '40-50 Seaters',
                price: '₹8,999/day',
                features: [
                  'Luxury AC coach',
                  'Premium driver',
                  'Full decoration',
                  'Entertainment system',
                  'Comfortable push-back seats',
                  'Best for large weddings',
                ],
                gradient: 'from-red-500 to-orange-500',
              },
            ].map((pkg) => (
              <div
                key={pkg.name}
                className={`relative bg-gradient-to-br ${pkg.gradient} text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 right-6">
                    <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                <p className="text-white/90 mb-3">{pkg.size}</p>
                <p className="text-3xl font-bold mb-6">{pkg.price}</p>
                <ul className="space-y-2">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="text-white mt-1">✓</span>
                      <span className="text-white/90">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

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
