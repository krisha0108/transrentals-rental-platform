import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { CityContentSection } from '@/components/location/CityContentSection';
import { permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';
import { getCachedServiceBySlug } from '@/lib/services/cached-service-lookups';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { ComingSoonHero } from '@/components/services/ComingSoonHero';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { prisma } from '@/lib/db/prisma';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL cities - GOD LEVEL SEO
// Generate static params from DATABASE - Only locations where packers-and-movers is available
export async function generateStaticParams() {
  return getServiceLocations('packers-and-movers');
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const _seoDb = await resolvePageMeta(`packers-and-movers:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Packers and Movers in ${locationName} | Starting @₹4999 | TransRentals`,
    description: _seoDb?.metaDescription || `Professional packers and movers in ${locationName}. Local & intercity relocation, office shifting. Insured and reliable service. Book now!`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `packers and movers in ${locationName}`,
      `movers and packers ${locationName}`,
      `${locationName} relocation services`,
      `home shifting ${locationName}`,
      `office relocation ${locationName}`,
    ],
    alternates: {
      canonical: `https://transrentals.in/packers-and-movers/${params.location}`,
    },
    openGraph: {
      title: `Packers and Movers in ${locationName} - TransRentals`,
      description: `Professional relocation services in ${locationName} starting @₹4999. Insured moves.`,
    },
  };
}

export default async function PackersMoversLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('packers-and-movers', params.location, { comingSoonIfUnavailable: true });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="packers-and-movers" serviceName="Packers and Movers" />;
  if (pageContext.type === 'coming-soon') {
    const cityName = pageContext.city.name;
    return (
      <>
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/packers-and-movers" className="hover:text-primary">Packers & Movers</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{cityName}</span>
            </nav>
          </div>
        </div>
        <ComingSoonHero
          city={cityName}
          citySlug={params.location}
          serviceSlug="packers-and-movers"
          serviceName="Packers & Movers"
          themeColor="pink"
        />
        <NearbyActiveCities
          currentCitySlug={params.location}
          serviceSlug="packers-and-movers"
          serviceName="Packers & Movers"
        />
      </>
    );
  }
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));
  const cityData = getCityBySlug(params.location);

  // Fetch admin vehicle models for this location (cached)
  const service = await getCachedServiceBySlug('packers-and-movers');

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
          select: { name: true },
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
      const price = locationPricing || model.basePricePerDay || 14999;

      return {
        id: model.id,
        name: model.name,
        slug: model.slug,
        brand: model.brands?.name || undefined,
        image: model.sideImage || '/images/packers/default.jpg',
        price: price,
        rating: model.rating || 4.7,
        specs: {
          ...(model.loadCapacity ? { capacity: `${model.loadCapacity} Tons` } : {}),
          ...(model.bodyType ? { body: model.bodyType } : {}),
          ...(model.wheels ? { wheels: model.wheels } : {}),
        },
      };
    });
  }

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
    vehicles,
    nearbyLocations: [
      { name: 'Nearby City 1', slug: 'nearby-city-1' },
      { name: 'Nearby City 2', slug: 'nearby-city-2' },
    ],
  };

  const seoData = await resolvePageMeta(`packers-and-movers:${params.location}`);


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
        pageHeading={seoData?.pageHeading || undefined}
        pageDescription={seoData?.pageDescription || undefined}
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

      <CityContentSection
        citySlug={params.location}
        serviceSlug="packers-and-movers"
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
