import React from 'react';
import type { Metadata } from 'next';
import { ServiceTypesGrid } from '@/components/services/ServiceTypesGrid';
import { FAQSection } from '@/components/services/FAQSection';
import { SimpleServiceHero } from '@/components/services/SimpleServiceHero';
import { ServiceLocationsGrid } from '@/components/services/ServiceLocationsGrid';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';

export const metadata: Metadata = {
  title: 'Airport Transfer - Pickup & Drop Services | Starting @₹799',
  description:
    'Reliable airport transfer services across India. Sedans, SUVs, luxury cars available. Flight tracking, professional drivers. Book your airport cab now!',
  keywords: [
    'airport transfer',
    'airport taxi',
    'airport pickup',
    'airport drop',
    'airport cab service',
    'airport shuttle',
    'airport car rental',
  ],
  openGraph: {
    title: 'Airport Transfer - Starting @₹799 | TransRentals',
    description: 'Reliable airport transfer services across India. Flight tracking included.',
  },
};

const transferTypes = [
  {
    name: 'Sedan Transfer',
    description: 'Comfortable sedan for 3-4 passengers',
    price: '₹799',
    features: [
      'AC sedan cars',
      '3-4 passenger capacity',
      'Professional driver',
      'Flight tracking',
      'Free waiting time',
    ],
  },
  {
    name: 'SUV Transfer',
    description: 'Spacious SUV for families & groups',
    price: '₹1299',
    features: [
      'Premium SUV vehicles',
      '6-7 passenger capacity',
      'Extra luggage space',
      'Experienced chauffeur',
      'Complimentary water',
      'Meet & greet service',
    ],
    popular: true,
  },
  {
    name: 'Luxury Transfer',
    description: 'Premium cars for business travelers',
    price: '₹2499',
    features: [
      'Mercedes, BMW, Audi',
      'Executive comfort',
      'Professional chauffeur',
      'Premium amenities',
      'Priority service',
      'Business class experience',
    ],
  },
];

export default function AirportTransferPage() {
  return (
    <div className="flex flex-col">
      {/* Simple Hero without booking form */}
      <SimpleServiceHero
        badge="Airport Transfer Services"
        title="Airport Transfer"
        titleHighlight="Starting @₹799"
        description="Reliable airport pickup and drop service. On-time arrival guaranteed. Professional drivers with flight tracking."
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Flight Tracking', color: 'text-blue-600' },
          { icon: 'clock', text: 'On-Time Guarantee', color: 'text-green-600' },
        ]}
        stats={[
          { value: '50,000+', label: 'Successful Transfers' },
          { value: '50+', label: 'Airports Covered' },
          { value: '₹799', label: 'Starting Price' },
        ]}
        gradientFrom="sky-50"
        gradientTo="indigo-50"
        gradientAccent="from-sky-600 to-indigo-600"
      />

      {/* Fleet Display from Database */}
      <ServiceFleetDisplay
        serviceSlug="airport-transfer"
        title="Airport Transfer Vehicles"
        showCategories={true}
        limit={12}
      />

      {/* Locations from Database */}
      <ServiceLocationsGrid
        serviceSlug="airport-transfer"
        title="Airport Transfer in Popular Cities"
        startingPrice="₹799"
      />

      <ServiceTypesGrid
        title="Choose Your Transfer Type"
        subtitle="Select the perfect vehicle for your airport transfer needs"
        types={transferTypes}
      />

      <FAQSection service="airport-transfer" />

      {/* Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Airport Transfer Service',
            description: 'Professional airport pickup and drop services across India',
            provider: {
              '@type': 'Organization',
              name: 'TransRentals',
            },
            areaServed: {
              '@type': 'Country',
              name: 'India',
            },
            offers: {
              '@type': 'Offer',
              price: '799',
              priceCurrency: 'INR',
            },
          }),
        }}
      />
    </div>
  );
}
