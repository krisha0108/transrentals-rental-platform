import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { ComingSoonHero } from '@/components/services/ComingSoonHero';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { prisma } from '@/lib/db/prisma';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { B2BServiceNote } from '@/components/common/B2BServiceNote';
import { getCachedServiceBySlug, getCachedSubServices } from '@/lib/services/cached-service-lookups';
import { getServiceLocations } from '@/lib/services/service-locations';

function parseJsonField<T>(value: unknown, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return defaultValue; }
  }
  return value as T;
}

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only enabled locations
export async function generateStaticParams() {
  return getServiceLocations('equipment-rental');
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Always fetch fresh data (reflect admin category changes)
export const dynamic = 'force-dynamic';

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const _seoDb = await resolvePageMeta(`equipment-rental:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Equipment Rental in ${locationName} | Starting @₹1499/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Rent construction and event equipment in ${locationName}. Excavators, cranes, generators, DJ systems. Professional operators available. Book now!`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
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
  const pageContext = await resolveServicePage('equipment-rental', params.location, { comingSoonIfUnavailable: true });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="equipment-rental" serviceName="Equipment Rental" />;
  if (pageContext.type === 'coming-soon') {
    const cityName = pageContext.city.name;
    return (
      <>
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/equipment-rental" className="hover:text-primary">Equipment Rental</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{cityName}</span>
            </nav>
          </div>
        </div>
        <ComingSoonHero
          city={cityName}
          citySlug={params.location}
          serviceSlug="equipment-rental"
          serviceName="Equipment Rental"
          themeColor="cyan"
        />
        <NearbyActiveCities
          currentCitySlug={params.location}
          serviceSlug="equipment-rental"
          serviceName="Equipment Rental"
        />
      </>
    );
  }
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));
  const cityData = getCityBySlug(params.location);

  // Fetch equipment from database (filtered by service and location) (cached)
  const service = await getCachedServiceBySlug('equipment-rental');

  const location = await prisma.locations.findFirst({
    where: {
      OR: [
        { slug: params.location },
        { name: params.location.replace(/-/g, ' ') },
      ],
      isActive: true,
    },
    select: { id: true }
  });

  let dbVehicles: any[] = [];
  if (service && location) {
    const [activeCategories, activeSubServices] = await Promise.all([
      prisma.chauffeur_vehicle_categories.findMany({
        where: {
          serviceId: service.id,
          isActive: true,
        },
        select: { id: true },
      }),
      getCachedSubServices(service.id),
    ]);

    const activeCategoryIds = activeCategories.map((cat) => cat.id);
    const activeSubServiceIds = activeSubServices.map((sub) => sub.id);

    const vehiclesData = await prisma.vehicle_models.findMany({
      where: {
        serviceId: service.id,
        isActive: true,
        AND: [
          {
            OR: [
              { brandId: null },
              { brands: { isActive: true } },
            ],
          },
          {
            OR: [
              { vehicleCategoryId: null },
              { vehicleCategoryId: { in: activeCategoryIds } },
            ],
          },
          {
            OR: [
              { subServiceId: null },
              { subServiceId: { in: activeSubServiceIds } },
            ],
          },
          {
            OR: [
              {
                vehicle_model_locations: {
                  some: {
                    locationId: location.id,
                    isActive: true,
                  },
                },
              },
              {
                vehicle_model_locations: {
                  none: {},
                },
              },
            ],
          },
        ],
      },
      include: {
        chauffeur_vehicle_categories: {
          select: { id: true, name: true, isActive: true },
        },
        brands: true,
        vehicle_model_locations: {
          where: {
            locationId: location.id
          },
          select: { basePricePerDay: true }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });

    const filteredVehicles = vehiclesData.filter((vehicle) => {
      const specs = parseJsonField<Record<string, unknown>>(vehicle.specs, {});
      const specCategoryId = typeof specs.categoryId === 'string' ? specs.categoryId : null;

      if (!specCategoryId) return true;

      return activeCategoryIds.includes(specCategoryId)
        || activeSubServiceIds.includes(specCategoryId);
    });

    dbVehicles = filteredVehicles.map(v => {
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

  const seoData = await resolvePageMeta(`equipment-rental:${params.location}`);


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

      <B2BServiceNote serviceName="Equipment Rental" />

      <ServiceHeroWithChat
        pageHeading={seoData?.pageHeading || undefined}
        pageDescription={seoData?.pageDescription || undefined}
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

      
      <CityContentSection
        citySlug={params.location}
        serviceSlug="equipment-rental"
        cityName={locationName}
        stateCode={city?.stateCode}
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
