import React from 'react';
import type { Metadata } from 'next';
import { RoyalEnfieldRentalServiceHero } from '@/components/services/RoyalEnfieldRentalServiceHero';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { FAQSection } from '@/components/services/FAQSection';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { BikeServiceSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Royal Enfield on Rent - Classic 350, Himalayan & More @₹599/Day | TransRentals',
  description:
    'Rent Royal Enfield bikes for your road trips. Classic 350, Himalayan, Meteor, Hunter available across 150+ cities. Perfect for Ladakh & mountain trips. Book now!',
  keywords: [
    'royal enfield on rent',
    'royal enfield rental',
    'bullet on rent',
    're on rent',
    'classic 350 on rent',
    'himalayan on rent',
    'royal enfield hire',
    'enfield rental near me',
    'bullet rental ladakh',
    'royal enfield tour',
  ],
  openGraph: {
    title: 'Royal Enfield on Rent - Classic 350, Himalayan @₹599/Day | TransRentals',
    description: 'Rent Royal Enfield bikes for road trips across India. Classic 350, Himalayan, Meteor, Hunter available.',
    type: 'website',
    url: 'https://transrentals.in/royal-enfield-on-rent',
    images: [
      {
        url: 'https://transrentals.in/images/og/royal-enfield-rental.jpg',
        width: 1200,
        height: 630,
        alt: 'Royal Enfield Rental - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Royal Enfield on Rent - Starting @₹599/Day | TransRentals',
    description: 'Rent Royal Enfield bikes for road trips across 150+ cities in India.',
    images: ['https://transrentals.in/images/og/royal-enfield-rental.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/royal-enfield-on-rent',
  },
};

// Schema data
const schemaFaqs = [
  { question: 'Which Royal Enfield models are available for rent?', answer: 'We have Classic 350, Himalayan, Meteor 350, Hunter 350, Interceptor 650, Continental GT 650, Super Meteor 650, and Scram 411 available for rent.' },
  { question: 'Can I take Royal Enfield to Ladakh?', answer: 'Yes, our Royal Enfield bikes are perfect for Ladakh trips. Himalayan and Classic 350 are most popular for high-altitude riding. We also provide necessary accessories.' },
  { question: 'What is the security deposit for Royal Enfield rental?', answer: 'Security deposit ranges from ₹5,000 to ₹15,000 depending on the model. This is fully refundable upon return of the bike in good condition.' },
  { question: 'Is roadside assistance available on long trips?', answer: 'Yes, we provide 24/7 roadside assistance across India. For remote areas like Ladakh, we have tie-ups with local mechanics.' },
  { question: 'Do you provide helmets and riding gear?', answer: 'Yes, helmets are provided free. Riding jackets, gloves, and knee guards are available at additional charges.' },
];

const schemaVehicles = [
  { name: 'Royal Enfield Classic 350', brand: 'Royal Enfield', price: 599 },
  { name: 'Royal Enfield Himalayan', brand: 'Royal Enfield', price: 799 },
  { name: 'Royal Enfield Meteor 350', brand: 'Royal Enfield', price: 699 },
  { name: 'Royal Enfield Hunter 350', brand: 'Royal Enfield', price: 649 },
  { name: 'Royal Enfield Interceptor 650', brand: 'Royal Enfield', price: 999 },
];

export default function RoyalEnfieldOnRentPage() {
  return (
    <>
      {/* Schema Markup for SEO */}
      <BikeServiceSchema
        serviceName="Royal Enfield on Rent"
        serviceSlug="royal-enfield-on-rent"
        description="Rent Royal Enfield bikes for road trips across India. Classic 350, Himalayan, Meteor, Hunter available. Best prices starting @₹599/day."
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 599, max: 1099 }}
        rating={4.8}
        reviewCount={2340}
      />
      <div className="flex flex-col">
        <ServiceHeroWithChat
        badge="Royal Enfield Rental in 150+ Cities"
        title="Royal Enfield on Rent | Bullet Rental"
        titleHighlight="Starting @₹899/Day"
        description="Rent Royal Enfield bikes for road trips, bike tours, and weekend adventures. Classic 350, Himalayan, Meteor available."
        gradientFrom="red-50"
        gradientTo="orange-50"
      />

      <RoyalEnfieldRentalServiceHero />

      {/* Models Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Available Royal Enfield Models
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Classic 350', cc: '350cc', price: '₹599/day', type: 'Cruiser' },
              { name: 'Meteor 350', cc: '350cc', price: '₹699/day', type: 'Cruiser' },
              { name: 'Himalayan', cc: '411cc', price: '₹799/day', type: 'Adventure' },
              { name: 'Hunter 350', cc: '350cc', price: '₹649/day', type: 'Roadster' },
              { name: 'Interceptor 650', cc: '648cc', price: '₹999/day', type: 'Twin' },
              { name: 'Continental GT 650', cc: '648cc', price: '₹999/day', type: 'Cafe Racer' },
              { name: 'Super Meteor 650', cc: '648cc', price: '₹1099/day', type: 'Cruiser' },
              { name: 'Scram 411', cc: '411cc', price: '₹749/day', type: 'Adventure' },
            ].map((model) => (
              <div key={model.name} className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-lg shadow-md hover:shadow-xl transition border-2 border-amber-200">
                <div className="text-4xl mb-3">🏍️</div>
                <h3 className="text-lg font-bold mb-1">{model.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{model.cc} • {model.type}</p>
                <p className="text-primary font-bold text-lg">{model.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Popular Royal Enfield Trip Routes
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                route: 'Ladakh Circuit',
                description: 'Manali - Leh - Khardung La - Pangong',
                duration: '10-15 days',
                gradient: 'from-blue-500 to-indigo-600',
              },
              {
                route: 'Rajasthan Heritage',
                description: 'Jaipur - Jodhpur - Jaisalmer - Udaipur',
                duration: '7-10 days',
                gradient: 'from-orange-500 to-red-600',
              },
              {
                route: 'Spiti Valley',
                description: 'Manali - Kaza - Key Monastery - Chandratal',
                duration: '8-12 days',
                gradient: 'from-green-500 to-teal-600',
              },
            ].map((trip) => (
              <div key={trip.route} className={`bg-gradient-to-br ${trip.gradient} text-white p-6 rounded-xl shadow-lg`}>
                <h3 className="text-2xl font-bold mb-3">{trip.route}</h3>
                <p className="mb-4 text-white/90">{trip.description}</p>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded inline-block text-sm font-semibold">
                  {trip.duration}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

        <LocationsGrid service="royal-enfield-on-rent" />

        <FAQSection service="bike-on-rent" />
      </div>
    </>
  );
}
