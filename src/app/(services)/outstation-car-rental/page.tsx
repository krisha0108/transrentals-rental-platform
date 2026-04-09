import React from 'react';
import type { Metadata } from 'next';
import { FAQSection } from '@/components/services/FAQSection';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { ServiceLocationsGrid } from '@/components/services/ServiceLocationsGrid';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Outstation Car Rental - Intercity Car Hire Starting @₹10/km | TransRentals'),
  description:
    formatPriceHighlight('Rent cars for outstation trips across India. Round trips, one-way drops, multi-city tours. Professional drivers, all India permits. Book now!'),
  keywords: [
    'outstation car rental',
    'intercity car rental',
    'outstation cab',
    'car for outstation',
    'outstation taxi',
    'intercity car hire',
    'long distance car rental',
  ],
  openGraph: {
    title: formatPriceHighlight('Outstation Car Rental - Starting @₹10/km | TransRentals'),
    description: formatPriceHighlight('Rent cars for intercity and long-distance trips.'),
  },
};

export default function OutstationCarRentalPage() {
  return (
    <div className="flex flex-col">
      {/* Hero with booking form */}
      <ServiceHeroWithChat
        badge="Outstation Car Rental"
        title="Outstation Car Rental"
        titleHighlight="Starting @₹10/Km"
        description="Rent cars for outstation trips, family vacations, or business tours. Self-drive and chauffeur options available."
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'All India Permits', color: 'text-blue-600' },
          { icon: 'zap', text: 'Quick Booking', color: 'text-green-600' },
        ]}
        gradientFrom="sky-50"
        gradientTo="blue-50"
      />

      {/* Fleet Display from Database */}
      <ServiceFleetDisplay
        serviceSlug="outstation-car-rental"
        title="Available Vehicles for Outstation"
        showCategories={true}
        limit={12}
        priceUnit="/km"
      />

      {/* Locations from Database */}
      <ServiceLocationsGrid
        serviceSlug="outstation-car-rental"
        title="Outstation Car Rental in Popular Cities"
        startingPrice="₹10"
        priceUnit="/km"
      />

      {/* What's Included */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            What&apos;s Included?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '👨‍✈️', title: 'Professional Driver', desc: 'Experienced & courteous' },
              { icon: '⛽', title: 'Fuel Charges', desc: 'All fuel costs included' },
              { icon: '🛣️', title: 'Toll & Parking', desc: 'All charges included' },
              { icon: '💼', title: 'Driver Allowance', desc: 'Daily allowance covered' },
              { icon: '🛡️', title: 'Insurance', desc: 'Fully insured vehicles' },
              { icon: '🗺️', title: 'State Permits', desc: 'All India permits' },
              { icon: '📞', title: '24/7 Support', desc: 'Always available' },
              { icon: '🧼', title: 'Clean Vehicles', desc: 'Sanitized & maintained' },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50 p-6 rounded-lg shadow-md text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQSection service="car-rental" />

    </div>
  );
}
