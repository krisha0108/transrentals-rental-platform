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
import { prisma } from '@/lib/db/prisma';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only enabled locations
export async function generateStaticParams() {
  try {
    // Skip database calls during CI/CD build
    if (process.env.SKIP_DATABASE_CALLS === '1') {
      console.log('[equipment-rental] Skipping database calls during build');
      return [];
    }

    // Fetch enabled locations from database
    const service = await prisma.services.findUnique({
      where: { slug: 'equipment-rental' },
      include: {
        service_locations: {
          where: { isActive: true },
          include: {
            locations: {
              select: { slug: true, name: true }
            }
          }
        }
      }
    });

    if (!service) {
      console.log('[equipment-rental] Service not found in database');
      return [];
    }

    const locations = service.service_locations.map((sl) => ({
      location: sl.locations.slug,
    }));

    console.log(`[equipment-rental] Generating ${locations.length} location pages from database`);
    return locations;
  } catch (error) {
    console.error('[equipment-rental] Error fetching locations:', error);
    // Fallback to empty array if database error
    return [];
  }
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locationName = capitalize(params.location.replace(/-/g, ' '));

  return {
    title: `Equipment Rental in ${locationName} | Starting @₹1499/Day | TransRentals`,
    description: `Rent construction and event equipment in ${locationName}. Excavators, cranes, generators, DJ systems. Professional operators available. Book now!`,
    keywords: [
      `equipment rental in ${locationName}`,
      `construction equipment ${locationName}`,
      `${locationName} event equipment`,
      `crane rental ${locationName}`,
      `generator rental ${locationName}`,
    ],
    openGraph: {
      title: `Equipment Rental in ${locationName} - TransRentals`,
      description: `Rent equipment in ${locationName} starting @₹1499/day. Construction & event equipment available.`,
    },
  };
}

export default async function EquipmentLocationPage({ params }: PageProps) {
  const locationName = capitalize(params.location.replace(/-/g, ' '));
  const cityData = getCityBySlug(params.location);

  // Check if equipment-rental service is available in this location
  const isAvailable = await isServiceAvailableInLocation('equipment-rental', params.location);

  // If service not available, show coming soon page
  if (!isAvailable) {
    const nearbyLocations = await getNearbyAvailableLocations('equipment-rental', params.location, 6);
    return (
      <ServiceComingSoon
        serviceName="Equipment Rental"
        serviceSlug="equipment-rental"
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
      name: 'Equipment Rental',
      slug: 'equipment-rental',
    },
    hero: {
      title: `Equipment Rental in ${locationName}`,
      subtitle: `Quality construction and event equipment rental services in ${locationName}`,
      image: '/images/locations/default.jpg',
    },
    vehicles: [
      {
        id: 1,
        name: 'DJ Sound System',
        image: '/images/equipment/dj-system.jpg',
        price: 1499,
        rating: 4.8,
      },
      {
        id: 2,
        name: '10 KVA Generator',
        image: '/images/equipment/generator.jpg',
        price: 2499,
        rating: 4.7,
      },
      {
        id: 3,
        name: 'Excavator',
        image: '/images/equipment/excavator.jpg',
        price: 4999,
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
            <a href="/equipment-rental" className="hover:text-primary">
              Equipment Rental
            </a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <ServiceHeroWithChat
        badge={`Equipment Rental in ${locationName}`}
        title="Construction & Event Equipment"
        titleHighlight="Rent Equipment @₹1499/day"
        description={`Rent quality construction and event equipment in ${locationName}. Excavators, cranes, generators, DJ systems, and more. Professional operators available.`}
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Quality Equipment', color: 'text-yellow-600' },
          { icon: 'zap', text: 'Quick Delivery', color: 'text-orange-600' },
        ]}
        gradientFrom="yellow-50"
        gradientTo="orange-50"
      />

      <VehicleGrid
        vehicles={pageData.vehicles}
        title={`Available Equipment in ${locationName}`}
      />

      <WhyRentHere locationName={locationName} />

      <PopularRoutes
        location={locationName}
        locationSlug={params.location}
        serviceSlug="equipment-rental"
      />

      <FAQSection service="equipment-rental" location={locationName} />

      <NearbyLocations
        locationSlug={params.location}
        service="equipment-rental"
      />

      {/* Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: `Equipment Rental in ${locationName}`,
            description: `Construction and event equipment rental in ${locationName} starting at ₹1499/day`,
            offers: {
              '@type': 'AggregateOffer',
              lowPrice: '1499',
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
