import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { capitalize } from '@/lib/utils';
import { ALL_CITIES, STATIC_CITIES, getCityBySlug } from '@/data/indian-cities';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL cities - GOD LEVEL SEO
export async function generateStaticParams() {
  // Generate pages for ALL 206 cities across India
  return STATIC_CITIES.map((city) => ({
    location: city.slug,
  }));
}

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locationName = capitalize(params.location.replace(/-/g, ' '));

  return {
    title: `Airport Transfer in ${locationName} | Starting @₹799 | TransRentals`,
    description: `Reliable airport transfer services in ${locationName}. Pickup and drop to all airports. Flight tracking, professional drivers. Book now!`,
    keywords: [
      `airport transfer ${locationName}`,
      `airport taxi ${locationName}`,
      `${locationName} airport pickup`,
      `airport drop ${locationName}`,
      `${locationName} airport cab`,
    ],
    openGraph: {
      title: `Airport Transfer in ${locationName} - TransRentals`,
      description: `Reliable airport transfer in ${locationName} starting @₹799. Flight tracking included.`,
    },
  };
}

export default async function AirportTransferLocationPage({ params }: PageProps) {
  const locationName = capitalize(params.location.replace(/-/g, ' '));
  const cityData = getCityBySlug(params.location);

  // Mock data for now - in production, fetch from API
  const pageData = {
    location: {
      name: locationName,
      slug: params.location,
      state: cityData?.state || 'India',
    },
    service: {
      name: 'Airport Transfer',
      slug: 'airport-transfer',
    },
    hero: {
      title: `Airport Transfer in ${locationName}`,
      subtitle: `Reliable and punctual airport pickup and drop services in ${locationName}`,
      image: '/images/locations/default.jpg',
    },
    vehicles: [
      {
        id: 1,
        name: 'Sedan Airport Transfer',
        image: '/images/airport/sedan.jpg',
        price: 799,
        rating: 4.8,
      },
      {
        id: 2,
        name: 'SUV Airport Transfer',
        image: '/images/airport/suv.jpg',
        price: 1299,
        rating: 4.9,
      },
      {
        id: 3,
        name: 'Luxury Airport Transfer',
        image: '/images/airport/luxury.jpg',
        price: 2499,
        rating: 4.9,
      },
    ],
    nearbyLocations: [
      { name: 'Nearby City 1', slug: 'nearby-city-1' },
      { name: 'Nearby City 2', slug: 'nearby-city-2' },
    ],
  };

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">
              Home
            </a>
            <span className="mx-2">/</span>
            <a href="/airport-transfer" className="hover:text-primary">
              Airport Transfer
            </a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <ServiceHeroWithChat
        badge={`Airport Transfer in ${locationName}`}
        title="Airport Transfer Services"
        titleHighlight="Pickup & Drop @₹799"
        description={`Reliable airport transfer in ${locationName}. Flight tracking, professional drivers, and punctual service. Book pickup or drop to all airports.`}
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Flight Tracking', color: 'text-sky-600' },
          { icon: 'zap', text: 'On-Time Pickup', color: 'text-blue-600' },
        ]}
        gradientFrom="sky-50"
        gradientTo="blue-50"
      />

      <VehicleGrid
        vehicles={pageData.vehicles}
        title={`Available Transfer Options in ${locationName}`}
      />

      <WhyRentHere locationName={locationName} />

      <PopularRoutes
        location={locationName}
        locationSlug={params.location}
        serviceSlug="airport-transfer"
      />

      <FAQSection service="airport-transfer" location={locationName} />

      <NearbyLocations
        locationSlug={params.location}
        service="airport-transfer"
      />

      {/* Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: `Airport Transfer in ${locationName}`,
            description: `Professional airport transfer services in ${locationName} starting at ₹799`,
            offers: {
              '@type': 'AggregateOffer',
              lowPrice: '799',
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
            },
            provider: {
              '@type': 'Organization',
              name: 'TransRentals',
            },
          }),
        }}
      />
    </div>
  );
}
