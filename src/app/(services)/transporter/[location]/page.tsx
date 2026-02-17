import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { ServiceComingSoon } from '@/components/location/ServiceComingSoon';
import { capitalize, formatPriceHighlight } from '@/lib/utils';
import { ALL_CITIES, STATIC_CITIES } from '@/data/indian-cities';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { getAllIndiaFleet } from '@/lib/fleet-utils';
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
      console.log('[transporter] Skipping database calls during build');
      return [];
    }

    // Fetch enabled locations from database
    const service = await prisma.services.findUnique({
      where: { slug: 'transporter' },
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
      console.log('[transporter] Service not found in database');
      return [];
    }

    const locations = service.service_locations.map((sl) => ({
      location: sl.locations.slug,
    }));

    console.log(`[transporter] Generating ${locations.length} location pages from database`);
    return locations;
  } catch (error) {
    console.error('[transporter] Error fetching locations:', error);
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
    title: formatPriceHighlight(`Truck Rental in ${locationName} | Starting @₹3999/Day | TransRentals`),
    description: formatPriceHighlight(`Professional truck rental and transport services in ${locationName}. 7-ton to 32-ton trucks with GPS tracking. Best prices guaranteed. Book now!`),
    keywords: [
      `truck rental in ${locationName}`,
      `transporter in ${locationName}`,
      `${locationName} goods transport`,
      `truck on rent ${locationName}`,
      `cargo transport ${locationName}`,
    ],
    openGraph: {
      title: formatPriceHighlight(`Truck Rental in ${locationName} - TransRentals`),
      description: formatPriceHighlight(`Professional truck rental in ${locationName} starting @₹3999/day. GPS tracking included.`),
    },
  };
}

export default async function TransporterLocationPage({ params }: PageProps) {
  const locationName = capitalize(params.location.replace(/-/g, ' '));

  // Check if transporter service is available in this location
  const isAvailable = await isServiceAvailableInLocation('transporter', params.location);

  // If service not available, show coming soon page
  if (!isAvailable) {
    const nearbyLocations = await getNearbyAvailableLocations('transporter', params.location, 6);
    return (
      <ServiceComingSoon
        serviceName="Truck Rental"
        serviceSlug="transporter"
        locationName={locationName}
        locationSlug={params.location}
        nearbyLocations={nearbyLocations}
      />
    );
  }

  // Fetch trucks/transporters from database (filtered by service and location)
  const service = await prisma.services.findUnique({
    where: { slug: 'transporter' },
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
        brands: {
          isActive: true,
        },
        AND: [
          {
            OR: [
              { vehicleCategoryId: null },
              { chauffeur_vehicle_categories: { isActive: true } },
            ],
          },
          {
            OR: [
              { subServiceId: null },
              { services_vehicle_models_subServiceIdToservices: { isActive: true } },
            ],
          },
        ],
        OR: [
          { vehicleCategoryId: null }, // No category assigned
          {
            chauffeur_vehicle_categories: {
              isActive: true,
            },
          },
        ],
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
      // Parse specs safely
      let specsObj: any = {};
      if (v.specs) {
        try {
          specsObj = typeof v.specs === 'string' ? JSON.parse(v.specs) : v.specs;
        } catch (e) {
          console.error('[transporter] Failed to parse specs:', e);
        }
      }

      // Format specs for VehicleGrid (expects Record<string, string>)
      const displaySpecs: Record<string, string> = {};
      if (v.fuelType) displaySpecs.fuel = v.fuelType;
      if (v.transmission) displaySpecs.transmission = v.transmission;
      if (v.seatingCapacity) displaySpecs.seating = `${v.seatingCapacity} Seats`;
      if (v.mileage) displaySpecs.mileage = v.mileage;
      if (v.engineCC) displaySpecs.engine = `${v.engineCC} CC`;

      return {
        id: v.id,
        name: v.name,
        slug: v.slug,
        brand: v.brands?.name || 'Tata',
        image: v.sideImage || '/images/fleet/honda-city.jpg',
        price: v.vehicle_model_locations[0]?.basePricePerDay || v.basePricePerDay || 3999,
        rating: v.rating || 4.7,
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
            <a href="/transporter" className="hover:text-primary">
              Transporter
            </a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <ServiceHeroWithChat
        badge={`Truck Rental in ${locationName}`}
        title="Professional Transport Services"
        titleHighlight="7-32 Ton Trucks @₹3999/day"
        description={`Reliable truck rental and transport services in ${locationName}. GPS tracking, professional drivers, and timely delivery for all your cargo needs.`}
        features={[
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'GPS Tracking', color: 'text-slate-600' },
          { icon: 'zap', text: 'Timely Delivery', color: 'text-green-600' },
        ]}
        gradientFrom="slate-50"
        gradientTo="gray-50"
      />

      <VehicleGrid
        vehicles={vehicles}
        title={`Available Trucks in ${locationName}`}
        locationSlug={params.location}
        serviceSlug="transporter"
      />

      <WhyRentHere locationName={locationName} />

      <PopularRoutes
        location={locationName}
        locationSlug={params.location}
        serviceSlug="transporter"
      />

      <FAQSection service="transporter" location={locationName} />

      <NearbyLocations
        locationSlug={params.location}
        service="transporter"
      />

      {/* Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: `Truck Rental in ${locationName}`,
            description: `Professional truck rental services in ${locationName} starting at ₹3999/day`,
            offers: {
              '@type': 'AggregateOffer',
              lowPrice: '3999',
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
