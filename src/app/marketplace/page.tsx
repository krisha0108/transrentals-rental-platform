import React from 'react';
import type { Metadata } from 'next';
import { HeroSectionDynamic } from '@/components/home/HeroSectionDynamic';
import { CustomBookingSection } from '@/components/home/CustomBookingSection';
import { ServicesGridDynamic } from '@/components/home/ServicesGridDynamic';
import { PopularDestinationsDynamic } from '@/components/home/PopularDestinationsDynamic';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Testimonials } from '@/components/home/Testimonials';
import { BackrTokenSection } from '@/components/home/BackrTokenSection';
import { AppDownloadSection } from '@/components/home/AppDownloadSection';
import { BlogSectionDynamic } from '@/components/home/BlogSectionDynamic';
import { CTASectionDynamic } from '@/components/home/CTASectionDynamic';
import { StoriesStrip } from '@/components/home/StoriesStrip';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://transrentals.in/marketplace',
  },
};

const homepageSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://transrentals.in/#organization',
      name: 'TransRentals',
      url: 'https://transrentals.in',
      logo: {
        '@type': 'ImageObject',
        url: 'https://transrentals.in/images/logo.png',
        width: 200,
        height: 60,
      },
      description: "India's largest vehicle rental marketplace — cars, bikes, buses, equipment across 500+ cities.",
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-9737965551',
        email: 'book@transrentals.in',
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi'],
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Shakti Dhar Complex, 2nd Floor, Bapunagar',
        addressLocality: 'Ahmedabad',
        addressRegion: 'Gujarat',
        postalCode: '382350',
        addressCountry: 'IN',
      },
      sameAs: [
        'https://www.facebook.com/transrentals',
        'https://www.instagram.com/transrentals',
        'https://twitter.com/transrentals',
        'https://www.linkedin.com/company/transrentals',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://transrentals.in/#website',
      url: 'https://transrentals.in',
      name: 'TransRentals',
      publisher: { '@id': 'https://transrentals.in/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://transrentals.in/search?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSchema) }}
      />
      <HeroSectionDynamic />
      <ServicesGridDynamic />
      <FeaturesSection />
      <CustomBookingSection />
      <PopularDestinationsDynamic />
      <HowItWorks />
      <StoriesStrip />
      <Testimonials />
      <BackrTokenSection />
      <AppDownloadSection />
      <BlogSectionDynamic />
      <CTASectionDynamic />
    </div>
  );
}
