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
    type: 'website',
    url: 'https://transrentals.in/packers-and-movers',
    images: [{ url: 'https://transrentals.in/images/og/packers-movers.jpg', width: 1200, height: 630, alt: 'Packers and Movers - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Packers and Movers | TransRentals',
    description: 'Professional packers and movers services across India. Local & intercity relocation.',
    images: ['https://transrentals.in/images/og/packers-movers.jpg'],
  },
  alternates: { canonical: 'https://transrentals.in/packers-and-movers' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
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
