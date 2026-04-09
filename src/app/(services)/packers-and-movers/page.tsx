import React from 'react';
import type { Metadata } from 'next';
import { ServiceTypesGrid } from '@/components/services/ServiceTypesGrid';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { FAQSection } from '@/components/services/FAQSection';
import { SimpleServiceHero } from '@/components/services/SimpleServiceHero';

export const metadata: Metadata = {
  title: 'Packers and Movers - Professional Relocation Services | Starting @₹4999',
  description:
    'Professional packers and movers services across India. Local & intercity relocation, office shifting, home moving. Insured and reliable. Book now!',
  keywords: [
    'packers and movers',
    'movers and packers',
    'relocation services',
    'home shifting',
    'office relocation',
    'local shifting',
    'intercity movers',
  ],
  openGraph: {
    title: 'Packers and Movers - Starting @₹4999 | TransRentals',
    description: 'Professional relocation services across India. Insured and reliable.',
  },
};

export default function PackersAndMoversPage() {

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <SimpleServiceHero
        badge="Packers & Movers"
        title="Professional Relocation"
        titleHighlight="Starting @₹4999"
        description="Home shifting, office relocation, vehicle transport. Insured and reliable packers & movers. Get quotes now!"
        features={[
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Insured Moving', color: 'text-blue-600' },
          { icon: 'zap', text: 'Multiple Quotes', color: 'text-green-600' },
        ]}
      />

      

      <LocationsGrid service="packers-and-movers" />

      <FAQSection service="packers-and-movers" />

      {/* Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Packers and Movers Service',
            description: 'Professional packing and moving services across India',
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
              price: '4999',
              priceCurrency: 'INR',
            },
          }),
        }}
      />
    </div>
  );
}
