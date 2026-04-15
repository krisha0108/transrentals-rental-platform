import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { CityContentSection } from '@/components/location/CityContentSection';
import { permanentRedirect } from 'next/navigation';
import { capitalize, formatPriceHighlight } from '@/lib/utils';
import { ALL_CITIES, STATIC_CITIES, getCityBySlug } from '@/data/indian-cities';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { ComingSoonHero } from '@/components/services/ComingSoonHero';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { prisma } from '@/lib/db/prisma';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { getCachedServiceBySlug } from '@/lib/services/cached-service-lookups';
import { getServiceLocations } from '@/lib/services/service-locations';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only enabled locations
export async function generateStaticParams() {
  return getServiceLocations('bus-rental');
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const _seoDb = await resolvePageMeta(`bus-rental:${params.location}`);
  return {
    title: _seoDb?.metaTitle || formatPriceHighlight(`Bus Rental in ${locationName} | Starting @₹2499/Day | TransRentals`),
    description: _seoDb?.metaDescription || formatPriceHighlight(`Rent buses in ${locationName} with TransRentals. Choose from mini buses, tempo travellers, luxury coaches. Best prices guaranteed. Book your bus rental now!`),
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `bus rental in ${locationName}`,
      `bus on rent ${locationName}`,
      `${locationName} bus rental`,
      `tempo traveller ${locationName}`,
      `mini bus rental ${locationName}`,
    ],
    alternates: {
      canonical: `https://transrentals.in/bus-rental/${params.location}`,
    },
    openGraph: {
      title: formatPriceHighlight(`Bus Rental in ${locationName} - TransRentals`),
      description: formatPriceHighlight(`Rent buses in ${locationName} starting @₹2499/day. Best prices guaranteed.`),
    },
  };
}

export default async function BusLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('bus-rental', params.location, { comingSoonIfUnavailable: true });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="bus-rental" serviceName="Bus Rental" />;
  if (pageContext.type === 'coming-soon') {
    const cityName = pageContext.city.name;
    return (
      <>
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/bus-rental" className="hover:text-primary">Bus Rental</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{cityName}</span>
            </nav>
          </div>
        </div>
        <ComingSoonHero
          city={cityName}
          citySlug={params.location}
          serviceSlug="bus-rental"
          serviceName="Bus Rental"
          themeColor="orange"
        />
        <NearbyActiveCities
          currentCitySlug={params.location}
          serviceSlug="bus-rental"
          serviceName="Bus Rental"
        />
      </>
    );
  }
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));
  const cityData = getCityBySlug(params.location);

  // Fetch admin vehicle models for this location (cached)
  const service = await getCachedServiceBySlug('bus-rental');

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
    const vehicleModels = await prisma.vehicle_models.findMany({
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
        vehicle_model_locations: {
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
        vehicle_model_locations: {
          where: {
            locationId: location.id,
            isActive: true,
          },
          select: { basePricePerDay: true },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      take: 12,
    });

    vehicles = vehicleModels.map((model) => {
      const locationPricing = model.vehicle_model_locations?.[0]?.basePricePerDay;
      const price = locationPricing || model.basePricePerDay || 2499;

      return {
        id: model.id,
        name: model.name,
        slug: model.slug,
        brand: model.brands?.name || undefined,
        image: model.sideImage || '/images/fleet/default-bus.jpg',
        price: price,
        rating: model.rating || 4.5,
        specs: {
          ...(model.seatingCapacity ? { seating: `${model.seatingCapacity} Seater` } : {}),
          ...(model.fuelType ? { fuel: model.fuelType } : {}),
          ...(model.transmission ? { transmission: model.transmission } : {}),
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

  const seoData = await resolvePageMeta(`bus-rental:${params.location}`);


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
        pageHeading={seoData?.pageHeading || undefined}
        pageDescription={seoData?.pageDescription || undefined}
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

      <CityContentSection
        citySlug={params.location}
        serviceSlug="bus-rental"
        cityName={locationName}
        stateCode={cityData?.stateCode}
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
