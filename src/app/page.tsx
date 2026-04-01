import React from 'react';
import type { Metadata } from 'next';
import { HeroSectionDynamic } from '@/components/home/HeroSectionDynamic';
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
    canonical: 'https://transrentals.in',
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
      description: "India's largest vehicle rental marketplace — cars, bikes, buses, equipment across 150+ cities.",
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-9999999999',
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi'],
      },
      sameAs: [
        'https://facebook.com/transrentals',
        'https://instagram.com/transrentals',
        'https://twitter.com/transrentals',
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
      <FeaturesSection />
      <ServicesGridDynamic />
      <PopularDestinationsDynamic />
      <HowItWorks />
      <Testimonials />
      <BackrTokenSection />
      <AppDownloadSection />
      <BlogSectionDynamic />
      <CTASectionDynamic />
      <StoriesStrip />
    </div>
  );
}
