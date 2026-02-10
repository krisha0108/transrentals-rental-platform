import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { ServiceComingSoon } from '@/components/location/ServiceComingSoon';
import { capitalize } from '@/lib/utils';
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
    title: `Truck Rental in ${locationName} | Starting @₹3999/Day | TransRentals`,
    description: `Professional truck rental and transport services in ${locationName}. 7-ton to 32-ton trucks with GPS tracking. Best prices guaranteed. Book now!`,
    keywords: [
      `truck rental in ${locationName}`,
      `transporter in ${locationName}`,
      `${locationName} goods transport`,
      `truck on rent ${locationName}`,
      `cargo transport ${locationName}`,
    ],
    openGraph: {
      title: `Truck Rental in ${locationName} - TransRentals`,
      description: `Professional truck rental in ${locationName} starting @₹3999/day. GPS tracking included.`,
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

  // Fetch trucks/transporters from database (ALL_INDIA type vehicles)
  const dbVehicles = await getAllIndiaFleet(
    ['truck', 'transporter', 'Truck Rental', 'Transporter', 'Truck', 'Mini Truck']
  );

  // Fallback mock data if database is empty
  const fallbackVehicles = [
    {
      id: '1',
      name: '7-Ton Mini Truck',
      slug: '7-ton-mini-truck',
      brand: 'Tata',
      image: '/images/fleet/tempo-traveller-17-seater.jpg',
      price: 3999,
      rating: 4.7,
      features: [],
      specs: {},
      vehicleType: 'Mini Truck',
      availabilityType: 'ALL_INDIA',
    },
    {
      id: '2',
      name: '14-Ton Medium Truck',
      slug: '14-ton-medium-truck',
      brand: 'Ashok Leyland',
      image: '/images/fleet/force-traveller-12-seater.jpg',
      price: 5999,
      rating: 4.8,
      features: [],
      specs: {},
      vehicleType: 'Medium Truck',
      availabilityType: 'ALL_INDIA',
    },
    {
      id: '3',
      name: '32-Ton Heavy Truck',
      slug: '32-ton-heavy-truck',
      brand: 'Bharat Benz',
      image: '/images/fleet/luxury-bus-45-seater.jpg',
      price: 8999,
      rating: 4.9,
      features: [],
      specs: {},
      vehicleType: 'Heavy Truck',
      availabilityType: 'ALL_INDIA',
    },
  ];

  const vehicles = dbVehicles.length > 0 ? dbVehicles : fallbackVehicles;

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
