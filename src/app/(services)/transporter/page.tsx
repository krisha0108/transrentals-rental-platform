import React from 'react';
import type { Metadata } from 'next';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { FAQSection } from '@/components/services/FAQSection';
import { TruckTypesCards } from '@/components/services/TruckTypesCards';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Truck Rental & Transport Services - Starting @₹3999/Day | TransRentals'),
  description:
    formatPriceHighlight('Professional truck rental and transport services across India. 7-ton to 32-ton trucks available. GPS tracking, verified drivers. Book your transporter now!'),
  keywords: [
    'truck rental',
    'transporter services',
    'goods transport',
    'truck on rent',
    'cargo transport',
    'logistics services',
    'freight transport',
  ],
  openGraph: {
    title: formatPriceHighlight('Truck Rental & Transport Services - Starting @₹3999/Day | TransRentals'),
    description: formatPriceHighlight('Professional truck rental services across India. Best prices guaranteed.'),
  },
};

export default function TransporterPage() {
  return (
    <div className="flex flex-col">
      {/* Hero with Chat Booking System */}
      <ServiceHeroWithChat
        badge="Truck Rental & Transport"
        title="Transporter Services"
        titleHighlight="Starting @₹3999/Day"
        description="Professional truck rental and transport services. 7-ton to 32-ton trucks available. GPS tracking, verified drivers. Get quotes now!"
        features={[
          { icon: 'star', text: '4.6/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Verified Transporters', color: 'text-blue-600' },
          { icon: 'zap', text: 'Multiple Quotes', color: 'text-green-600' },
        ]}
        gradientFrom="slate-50"
        gradientTo="gray-50"
      />



      <TruckTypesCards />

      <LocationsGrid service="transporter" />

      <FAQSection service="transporter" />

      {/* Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Truck Rental and Transport Service',
            description: 'Professional truck rental and goods transport services across India',
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
              price: '3999',
              priceCurrency: 'INR',
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: '3999',
                priceCurrency: 'INR',
                referenceQuantity: {
                  '@type': 'QuantitativeValue',
                  value: '1',
                  unitCode: 'DAY',
                },
              },
            },
          }),
        }}
      />
    </div>
  );
}
