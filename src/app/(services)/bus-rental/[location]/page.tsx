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
      console.log('[bus-rental] Skipping database calls during build');
      return [];
    }

    // Fetch enabled locations from database
    const service = await prisma.services.findUnique({
      where: { slug: 'bus-rental' },
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
      console.log('[bus-rental] Service not found in database');
      return [];
    }

    const locations = service.service_locations.map((sl) => ({
      location: sl.locations.slug,
    }));

    console.log(`[bus-rental] Generating ${locations.length} location pages from database`);
    return locations;
  } catch (error) {
    console.error('[bus-rental] Error fetching locations:', error);
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
    title: `Bus Rental in ${locationName} | Starting @₹2499/Day | TransRentals`,
    description: `Rent buses in ${locationName} with TransRentals. Choose from mini buses, tempo travellers, luxury coaches. Best prices guaranteed. Book your bus rental now!`,
    keywords: [
      `bus rental in ${locationName}`,
      `bus on rent ${locationName}`,
      `${locationName} bus rental`,
      `tempo traveller ${locationName}`,
      `mini bus rental ${locationName}`,
    ],
    openGraph: {
      title: `Bus Rental in ${locationName} - TransRentals`,
      description: `Rent buses in ${locationName} starting @₹2499/day. Best prices guaranteed.`,
    },
  };
}

export default async function BusLocationPage({ params }: PageProps) {
  const locationName = capitalize(params.location.replace(/-/g, ' '));
  const cityData = getCityBySlug(params.location);

  // Check if bus-rental service is available in this location
  const isAvailable = await isServiceAvailableInLocation('bus-rental', params.location);

  // If service not available, show coming soon page
  if (!isAvailable) {
    const nearbyLocations = await getNearbyAvailableLocations('bus-rental', params.location, 6);
    return (
      <ServiceComingSoon
        serviceName="Bus Rental"
        serviceSlug="bus-rental"
        locationName={locationName}
        locationSlug={params.location}
        nearbyLocations={nearbyLocations}
      />
    );
  }

  // Fetch vendor fleets available for this location
  const service = await prisma.services.findUnique({
    where: { slug: 'bus-rental' },
    select: { id: true, name: true, slug: true },
  });

  // Find the location record (MySQL collation is typically case-insensitive by default)
  const location = await prisma.locations.findFirst({
    where: {
      OR: [
        { slug: params.location },
        { name: locationName },
      ],
      isActive: true,
    },
  });

  let vehicles: Array<{
    id: string;
    name: string;
    slug: string;
    brand?: string;
    image: string;
    price: number;
    rating: number;
    specs?: Record<string, string>;
  }> = [];

  if (service && location) {
    // Fetch vendor fleets that are available in this location
    const vendorFleets = await prisma.vendor_fleets.findMany({
      where: {
        serviceId: service.id,
        isActive: true,
        isAvailable: true,
        vendor_fleet_locations: {
          some: {
            locationId: location.id,
            isActive: true,
          },
        },
      },
      include: {
        brands: {
          select: { name: true, logo: true },
        },
        vehicle_models: {
          select: { name: true, slug: true, sideImage: true, basePricePerDay: true },
        },
        chauffeur_vehicle_categories: {
          select: { name: true, slug: true },
        },
        fleet_pricing: {
          where: {
            locationId: location.id,
            isActive: true,
          },
          take: 1,
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 12,
    });

    vehicles = vendorFleets.map((fleet) => {
      // Get price: fleet_pricing > vehicle_models.basePricePerDay > fallback
      const locationPricing = fleet.fleet_pricing?.[0];
      const modelBasePrice = fleet.vehicle_models?.basePricePerDay;
      const price = locationPricing?.basePrice || modelBasePrice || 2499;

      // Generate a URL-friendly slug
      const fleetSlug = fleet.vehicle_models?.slug ||
        fleet.vehicleName?.toLowerCase().replace(/\s+/g, '-') ||
        fleet.id;

      return {
        id: fleet.id,
        name: fleet.vehicleName || fleet.vehicle_models?.name || 'Bus',
        slug: fleetSlug,
        brand: fleet.brands?.name || undefined,
        image: fleet.images ? JSON.parse(fleet.images)[0] : (fleet.vehicle_models?.sideImage || '/images/fleet/default-bus.jpg'),
        price: price,
        rating: fleet.avgRating || 4.5,
        specs: {
          ...(fleet.seatingCapacity ? { seating: `${fleet.seatingCapacity} Seater` } : {}),
          ...(fleet.fuelType ? { fuel: fleet.fuelType } : {}),
          ...(fleet.transmission ? { transmission: fleet.transmission } : {}),
        },
      };
    });
  }

  // Page data
  const pageData = {
    location: {
      name: locationName,
      slug: params.location,
      state: cityData?.state || 'India',
    },
    service: {
      name: 'Bus Rental',
      slug: 'bus-rental',
    },
    hero: {
      title: `Bus Rental in ${locationName}`,
      subtitle: `Comfortable and affordable bus rental services for your group travel in ${locationName}`,
      image: '/images/locations/default.jpg',
    },
    vehicles,
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
            <a href="/bus-rental" className="hover:text-primary">
              Bus Rental
            </a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <ServiceHeroWithChat
        badge={`Bus Rental in ${locationName}`}
        title="Bus Rental Services"
        titleHighlight="Mini & Luxury Buses @₹2499/day"
        description={`Rent comfortable buses in ${locationName} for group travel, tours, and events. Choose from mini buses, tempo travellers, and luxury coaches.`}
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Verified Fleet', color: 'text-green-600' },
          { icon: 'zap', text: 'Instant Booking', color: 'text-blue-600' },
        ]}
        gradientFrom="green-50"
        gradientTo="teal-50"
      />

      <VehicleGrid
        vehicles={pageData.vehicles}
        title={`Available Buses in ${locationName}`}
        location={locationName}
        locationSlug={params.location}
        serviceSlug="bus-rental"
      />

      <WhyRentHere locationName={locationName} />

      <PopularRoutes
        location={locationName}
        locationSlug={params.location}
        serviceSlug="bus-rental"
      />

      <FAQSection service="bus-rental" location={locationName} />

      <NearbyLocations
        locationSlug={params.location}
        service="bus-rental"
      />

      {/* Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: `Bus Rental in ${locationName}`,
            description: `Rent buses in ${locationName} starting at ₹${Math.min(...(vehicles.length > 0 ? vehicles.map(v => v.price) : [2499]))}/day`,
            offers: {
              '@type': 'AggregateOffer',
              lowPrice: String(Math.min(...(vehicles.length > 0 ? vehicles.map(v => v.price) : [2499]))),
              highPrice: String(Math.max(...(vehicles.length > 0 ? vehicles.map(v => v.price) : [5999]))),
              offerCount: vehicles.length || 3,
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
