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

  // Fetch equipment from database (filtered by service and location)
  const service = await prisma.services.findUnique({
    where: { slug: 'equipment-rental' },
    select: { id: true }
  });

  const location = await prisma.locations.findUnique({
    where: { slug: params.location },
    select: { id: true }
  });

  let dbVehicles: any[] = [];
  if (service && location) {
    const vehiclesData = await prisma.vehicle_models.findMany({
      where: {
        serviceId: service.id,
        isActive: true,
        vehicle_model_locations: {
          some: {
            locationId: location.id,
            isActive: true
          }
        }
      },
      include: {
        brands: true,
        vehicle_model_locations: {
          where: {
            locationId: location.id
          }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });

    dbVehicles = vehiclesData.map(v => {
      // Format specs for VehicleGrid (expects Record<string, string>)
      const displaySpecs: Record<string, string> = {};
      if (v.loadCapacity) displaySpecs.capacity = `${v.loadCapacity} Tons`;
      if (v.heightFt) displaySpecs.height = `${v.heightFt} Ft`;
      if (v.lengthFt) displaySpecs.length = `${v.lengthFt} Ft`;

      return {
        id: v.id,
        name: v.name,
        slug: v.slug,
        brand: v.brands?.name || '',
        image: v.sideImage || '/images/fleet/honda-city.jpg',
        price: v.vehicle_model_locations[0]?.basePricePerDay || v.basePricePerDay || 1499,
        rating: v.rating || 4.8,
        features: Array.isArray(v.features) ? v.features : [],
        specs: displaySpecs,
      };
    });
  }

  const vehicles = dbVehicles;

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
        vehicles={vehicles}
        title={`Available Equipment in ${locationName}`}
        locationSlug={params.location}
        serviceSlug="equipment-rental"
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
