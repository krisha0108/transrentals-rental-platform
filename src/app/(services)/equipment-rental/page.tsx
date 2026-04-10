import React from 'react';
import type { Metadata } from 'next';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { FAQSection } from '@/components/services/FAQSection';
import { EquipmentTypesCards } from '@/components/services/EquipmentTypesCards';
import { SimpleServiceHero } from '@/components/services/SimpleServiceHero';

export const metadata: Metadata = {
  title: 'Equipment Rental - Construction & Event Equipment | Starting @₹1499/Day',
  description:
    'Rent construction and event equipment across India. Excavators, cranes, generators, DJ equipment, and more. Professional operators available. Book now!',
  keywords: [
    'equipment rental',
    'construction equipment rental',
    'event equipment rental',
    'crane rental',
    'excavator rental',
    'generator rental',
    'DJ equipment rental',
  ],
  openGraph: {
    title: 'Equipment Rental - Starting @₹1499/Day | TransRentals',
    description: 'Rent construction and event equipment across India. Best prices guaranteed.',
    type: 'website',
    url: 'https://transrentals.in/equipment-rental',
    images: [{ url: 'https://transrentals.in/images/og/equipment-rental.jpg', width: 1200, height: 630, alt: 'Equipment Rental - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Equipment Rental | TransRentals',
    description: 'Rent construction and event equipment across India. Excavators, cranes, generators and more.',
    images: ['https://transrentals.in/images/og/equipment-rental.jpg'],
  },
  alternates: { canonical: 'https://transrentals.in/equipment-rental' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export default function EquipmentRentalPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <SimpleServiceHero
        badge="Equipment Rental"
        title="Construction & Event Equipment"
        titleHighlight="Starting @₹1499/Day"
        description="Rent JCB, cranes, excavators, generators, and more. Professional operators available. Get quotes now!"
        features={[
          { icon: 'star', text: '4.6/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'With Operators', color: 'text-blue-600' },
          { icon: 'zap', text: 'Multiple Quotes', color: 'text-green-600' },
        ]}
        gradientFrom="yellow-50"
        gradientTo="orange-50"
      />

      

      <EquipmentTypesCards />

      <LocationsGrid service="equipment-rental" />

      <FAQSection service="equipment-rental" />

      {/* Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Equipment Rental Service',
            description: 'Construction and event equipment rental services across India',
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
              price: '1499',
              priceCurrency: 'INR',
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: '1499',
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
