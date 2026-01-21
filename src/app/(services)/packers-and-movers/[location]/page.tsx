import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { ServiceComingSoon } from '@/components/location/ServiceComingSoon';
import { capitalize } from '@/lib/utils';
import { ALL_CITIES, STATIC_CITIES, getCityBySlug } from '@/data/indian-cities';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { isServiceAvailableInLocation, getNearbyAvailableLocations } from '@/lib/services/service-availability';

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
    title: `Packers and Movers in ${locationName} | Starting @₹4999 | TransRentals`,
    description: `Professional packers and movers in ${locationName}. Local & intercity relocation, office shifting. Insured and reliable service. Book now!`,
    keywords: [
      `packers and movers in ${locationName}`,
      `movers and packers ${locationName}`,
      `${locationName} relocation services`,
      `home shifting ${locationName}`,
      `office relocation ${locationName}`,
    ],
    openGraph: {
      title: `Packers and Movers in ${locationName} - TransRentals`,
      description: `Professional relocation services in ${locationName} starting @₹4999. Insured moves.`,
    },
  };
}

export default async function PackersMoversLocationPage({ params }: PageProps) {
  const locationName = capitalize(params.location.replace(/-/g, ' '));
  const cityData = getCityBySlug(params.location);

  // Check if packers-and-movers service is available in this location
  const isAvailable = await isServiceAvailableInLocation('packers-and-movers', params.location);

  // If service not available, show coming soon page
  if (!isAvailable) {
    const nearbyLocations = await getNearbyAvailableLocations('packers-and-movers', params.location, 6);
    return (
      <ServiceComingSoon
        serviceName="Packers and Movers"
        serviceSlug="packers-and-movers"
        locationName={locationName}
        locationSlug={params.location}
        nearbyLocations={nearbyLocations}
      />
    );
  }

  // Mock data for now - in production, fetch from API
  const pageData = {
    location: {
      name: locationName,
      slug: params.location,
      state: cityData?.state || 'India',
    },
    service: {
      name: 'Packers and Movers',
      slug: 'packers-and-movers',
    },
    hero: {
      title: `Packers and Movers in ${locationName}`,
      subtitle: `Professional and reliable packing and moving services for stress-free relocation in ${locationName}`,
      image: '/images/locations/default.jpg',
    },
    vehicles: [
      {
        id: 1,
        name: 'Local Shifting Package',
        image: '/images/packers/local.jpg',
        price: 4999,
        rating: 4.8,
      },
      {
        id: 2,
        name: 'Domestic Moving Package',
        image: '/images/packers/domestic.jpg',
        price: 9999,
        rating: 4.9,
      },
      {
        id: 3,
        name: 'Office Shifting Package',
        image: '/images/packers/office.jpg',
        price: 14999,
        rating: 4.7,
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
            <a href="/packers-and-movers" className="hover:text-primary">
              Packers and Movers
            </a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <ServiceHeroWithChat
        badge={`Packers and Movers in ${locationName}`}
        title="Professional Moving Services"
        titleHighlight="Insured Relocation @₹4999"
        description={`Reliable packers and movers in ${locationName}. Local & intercity relocation, office shifting, household moving. Insured and professional service.`}
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Insured Moving', color: 'text-blue-600' },
          { icon: 'zap', text: 'Quick Service', color: 'text-green-600' },
        ]}
        gradientFrom="blue-50"
        gradientTo="cyan-50"
      />

      <VehicleGrid
        vehicles={pageData.vehicles}
        title={`Available Packages in ${locationName}`}
      />

      <WhyRentHere locationName={locationName} />

      <PopularRoutes
        location={locationName}
        locationSlug={params.location}
        serviceSlug="packers-and-movers"
      />

      <FAQSection service="packers-and-movers" location={locationName} />

      <NearbyLocations
        locationSlug={params.location}
        service="packers-and-movers"
      />

      {/* Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: `Packers and Movers in ${locationName}`,
            description: `Professional packing and moving services in ${locationName} starting at ₹4999`,
            offers: {
              '@type': 'AggregateOffer',
              lowPrice: '4999',
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
