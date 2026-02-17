import React from 'react';
import type { Metadata } from 'next';
import { ActivaRentalServiceHero } from '@/components/services/ActivaRentalServiceHero';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { FAQSection } from '@/components/services/FAQSection';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Activa on Rent - Rent Activa & Scooty Starting @₹299/Day | TransRentals'),
  description:
    formatPriceHighlight('Rent Honda Activa, TVS Jupiter, Suzuki Access & other scooters across 150+ cities in India. Easy to ride, fuel efficient. Best prices guaranteed. Book your scooty rental now!'),
  keywords: [
    'activa on rent',
    'scooty on rent',
    'activa rental',
    'rent activa',
    'scooty rental',
    'scooter on rent',
    'honda activa rental',
    'activa hire',
    'tvs jupiter on rent',
    'scooter rental near me',
  ],
  openGraph: {
    title: formatPriceHighlight('Activa on Rent - Scooty Rental Starting @₹299/Day | TransRentals'),
    description: formatPriceHighlight('Rent Honda Activa, TVS Jupiter & scooters across 150+ cities. Easy to ride, fuel efficient.'),
    type: 'website',
    url: 'https://transrentals.in/activa-on-rent',
    images: [
      {
        url: 'https://transrentals.in/images/og/activa-rental.jpg',
        width: 1200,
        height: 630,
        alt: 'Activa & Scooty Rental - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: formatPriceHighlight('Activa on Rent - Starting @₹299/Day | TransRentals'),
    description: formatPriceHighlight('Rent scooters across 150+ cities in India. Easy to ride, fuel efficient.'),
    images: ['https://transrentals.in/images/og/activa-rental.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/activa-on-rent',
  },
};

// Schema data
const schemaFaqs = [
  { question: 'What is the minimum age to rent an Activa?', answer: 'You must be at least 18 years old with a valid driving license to rent an Activa or any scooter.' },
  { question: 'Do I need a gear license for Activa?', answer: 'No, Activa and scooters are automatic vehicles. A non-gear (scooter) license is sufficient.' },
  { question: 'What is the mileage of Honda Activa?', answer: 'Honda Activa gives approximately 50-60 km per liter, making it very fuel efficient for daily use.' },
  { question: 'Is helmet included with Activa rental?', answer: 'Yes, helmets are provided free of charge with every Activa and scooter rental.' },
  { question: 'Can I rent Activa for monthly basis?', answer: 'Yes, we offer monthly rental packages for Activa starting from ₹4,999/month with better rates for longer durations.' },
];

const schemaVehicles = [
  { name: 'Honda Activa 6G', brand: 'Honda', price: 299 },
  { name: 'TVS Jupiter', brand: 'TVS', price: 299 },
  { name: 'Suzuki Access 125', brand: 'Suzuki', price: 349 },
  { name: 'Honda Dio', brand: 'Honda', price: 299 },
  { name: 'TVS Ntorq 125', brand: 'TVS', price: 399 },
];

export default function ActivaOnRentPage() {
  return (
    <>
      {/* Schema Markup for SEO */}
      <BikeServiceSchema
        serviceName="Activa on Rent"
        serviceSlug="activa-on-rent"
        description="Rent Honda Activa, TVS Jupiter & scooters across 150+ cities in India. Easy to ride, fuel efficient. Best prices starting @₹299/day."
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 299, max: 499 }}
        rating={4.7}
        reviewCount={1890}
      />
      <div className="flex flex-col">
        <ServiceHeroWithChat
          badge="Activa Rental in 250+ Cities"
          title="Activa on Rent | Scooty Rental"
          titleHighlight="Starting @₹299/Day"
          description="Rent Honda Activa and scooters for daily commute, weekend trips, or long-term use. Well-maintained vehicles with flexible rental options."
          gradientFrom="cyan-50"
          gradientTo="blue-50"
        />

        <ActivaRentalServiceHero />

        {/* Key Features Section */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Why Rent Activa & Scooters?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  💰
                </div>
                <h3 className="text-xl font-bold mb-2">Affordable</h3>
                <p className="text-gray-600">Starting at just ₹299/day with flexible rental durations</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  ⚡
                </div>
                <h3 className="text-xl font-bold mb-2">Fuel Efficient</h3>
                <p className="text-gray-600">50-60 km/l mileage, perfect for daily commuting</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  🎯
                </div>
                <h3 className="text-xl font-bold mb-2">Easy to Ride</h3>
                <p className="text-gray-600">Automatic transmission, no clutch or gear shifting needed</p>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Models */}
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Popular Scooty Models Available
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Honda Activa', cc: '110cc', price: '₹299/day' },
                { name: 'TVS Jupiter', cc: '110cc', price: '₹299/day' },
                { name: 'Suzuki Access 125', cc: '125cc', price: '₹349/day' },
                { name: 'Honda Dio', cc: '110cc', price: '₹299/day' },
                { name: 'TVS Ntorq', cc: '125cc', price: '₹399/day' },
                { name: 'Hero Pleasure', cc: '110cc', price: '₹299/day' },
                { name: 'Yamaha Fascino', cc: '125cc', price: '₹349/day' },
                { name: 'Suzuki Burgman', cc: '125cc', price: '₹449/day' },
              ].map((model) => (
                <div key={model.name} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition">
                  <div className="text-4xl mb-3">🛵</div>
                  <h3 className="text-lg font-bold mb-1">{model.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{model.cc}</p>
                  <p className="text-primary font-bold">{model.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <LocationsGrid service="activa-on-rent" />

        <FAQSection service="bike-on-rent" />

      </div>
    </>
  );
}
