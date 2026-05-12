import type { Metadata } from 'next';
import { FAQSection } from '@/components/services/FAQSection';
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { ServiceLocationsGrid } from '@/components/services/ServiceLocationsGrid';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

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
      <HowToSchema
        name="How to Book Outstation Car Rental on TransRentals"
        description="Book a car for outstation travel in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Enter Trip Details', text: 'Enter pickup city, destination, travel date, and trip type — one-way or round trip.' },
          { name: 'Choose Car Category', text: 'Select hatchback, sedan, SUV, or luxury car based on group size and comfort preference.' },
          { name: 'Compare Driver Quotes', text: 'Review quotes from verified drivers. Check rates per km, driver allowance, and toll inclusions.' },
          { name: 'Book & Travel', text: 'Confirm booking with advance payment. Driver reports at pickup location at scheduled time.' },
        ]}
      />
      {/* Hero with booking form */}
      <SpecialtyCarBookingHero service="outstation" />

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
