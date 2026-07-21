import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
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
import { CITY_SEO } from '@/data/city-seo-content';

const EQUIPMENT_FALLBACK_FAQS = [
  { question: 'What is the cost of equipment rental per day?', answer: 'JCB backhoe loader starts from ₹2,999/day with certified operator. Mini excavators start from ₹3,500/day. Cranes, road rollers, and generators are quoted based on machine type and project requirements. Get a free quote on TransRentals for your specific site.' },
  { question: 'Is a certified operator included with equipment rental?', answer: 'Yes, all heavy equipment rentals on TransRentals include a certified, experienced operator. You need to provide clear site access and necessary permissions. Independent operation without our operator is not permitted for safety reasons.' },
  { question: 'How many hours does rented equipment work per day?', answer: 'Standard rental is 8 working hours per day. Extended 12-hour and 24-hour shifts are available at additional cost. Fuel is typically not included — the client arranges diesel at the site. Confirm the fuel arrangement with your vendor at booking.' },
  { question: 'What types of construction equipment are available for rent?', answer: 'Available equipment includes: JCB backhoe loaders, hydraulic excavators, cranes (hydraulic, tower, pick-and-carry), road rollers, motor graders, tipper trucks, generators (15 kVA–500 kVA), concrete mixers, and compactors. Event equipment (DJ systems, lighting, generators) is also available.' },
  { question: 'How do I book construction equipment for my project?', answer: 'Specify your equipment type, site location, start date, and duration on TransRentals. Get quotes from multiple verified vendors and compare before confirming. Book at least 48–72 hours in advance; for rare or heavy equipment, book 5–7 days ahead.' },
];
import { B2BServiceNote } from '@/components/common/B2BServiceNote';
import { getCachedServiceBySlug, getCachedSubServices } from '@/lib/services/cached-service-lookups';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections, hasSectionsContent } from '@/components/seo/ServiceCitySections';
import { ServiceAreasSection } from '@/components/location/ServiceAreasSection';
import { CrossServiceLinks } from '@/components/location/CrossServiceLinks';

function parseJsonField<T>(value: unknown, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return defaultValue; }
  }
  return value as T;
}

const COMING_SOON_SLUGS = new Set([
  'equipment-rental-in-india',
  'equipment-rental-technology',
  'top-benefits-of-renting-construction-equipment-for-your-next-project',
]);

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only enabled locations
export async function generateStaticParams() {
  return getAllCityLocations();
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

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`equipment-rental:${params.location.toLowerCase()}`),
    getServiceCityContent('equipment-rental', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Equipment Rental in ${locationName} | @₹1,499/Day`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent construction and event equipment in ${locationName}. Excavators, cranes, generators, DJ systems. Professional operators available. Book now!`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `equipment rental in ${locationName}`,
      `construction equipment ${locationName}`,
      `${locationName} event equipment`,
      `crane rental ${locationName}`,
      `generator rental ${locationName}`,
    ],
    alternates: { canonical: `https://transrentals.in/equipment-rental/${params.location.toLowerCase()}` },
    openGraph: {
      title: `Equipment Rental in ${locationName} | TransRentals`,
      description: `Rent construction and event equipment in ${locationName}. Excavators, cranes, generators, DJ systems. Verified operators available.`,
      type: 'website',
      url: `https://transrentals.in/equipment-rental/${params.location.toLowerCase()}`,
      images: [{ url: `https://transrentals.in/api/og?service=equipment-rental&location=${encodeURIComponent(locationName)}`, width: 1200, height: 630, alt: `Equipment Rental in ${locationName}` }],
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Equipment Rental in ${locationName} | TransRentals`,
      description: `Rent construction and event equipment in ${locationName}. Excavators, cranes, generators. Certified operators available.`,
      images: [`https://transrentals.in/api/og?service=equipment-rental&location=${encodeURIComponent(locationName)}`],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
  };
}

export default async function EquipmentLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('equipment-rental', params.location, { comingSoonIfUnavailable: true });
  if (pageContext.type === 'redirect') {
    if (COMING_SOON_SLUGS.has(params.location)) {
      return (
        <>
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="container-custom py-3">
              <nav className="text-sm text-gray-600">
                <a href="/" className="hover:text-primary">Home</a>
                <span className="mx-2">/</span>
                <a href="/equipment-rental" className="hover:text-primary">Equipment Rental</a>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">Coming Soon</span>
              </nav>
            </div>
          </div>
          <ComingSoonHero
            city="Equipment Rental"
            citySlug={params.location.toLowerCase()}
            serviceSlug="equipment-rental"
            serviceName="Equipment Rental"
            themeColor="blue"
          />
        </>
      );
    }
    permanentRedirect(pageContext.to);
  }
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
          citySlug={params.location.toLowerCase()}
          serviceSlug="equipment-rental"
          serviceName="Equipment Rental"
          themeColor="cyan"
        />
        <NearbyActiveCities
          currentCitySlug={params.location.toLowerCase()}
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

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`equipment-rental:${params.location.toLowerCase()}`),
    getServiceCityContent('equipment-rental', params.location),
  ]);
  const cityFAQs = CITY_SEO[params.location]?.serviceFAQs?.['equipment-rental'] || [];

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
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined}
        badge={`Equipment Rental in ${locationName}`}
        title="Construction & Event Equipment"
        titleHighlight="Verified Operators Available"
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
        locationSlug={params.location.toLowerCase()}
        serviceSlug="equipment-rental"
      />

      <WhyRentHere locationName={locationName} />

      <NearbyLocations
        locationSlug={params.location.toLowerCase()}
        service="equipment-rental"
      />

      <ServiceAreasSection
        serviceSlug="equipment-rental"
        citySlug={params.location.toLowerCase()}
        cityName={locationName}
        serviceName="Equipment Rental"
      />

      <CrossServiceLinks
        citySlug={params.location.toLowerCase()}
        cityName={locationName}
        currentServiceSlug="equipment-rental"
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="equipment-rental"
        parentName="Equipment Rental"
        currentSlug="equipment-rental"
        siblings={[
          { slug: 'mini-truck-rental', name: 'Mini Truck Rental' },
          { slug: 'trailer-on-rent', name: 'Trailer on Rent' },
        ]}
      />

      {/* LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: `Equipment Rental in ${locationName} — TransRentals`,
            description: `Construction and heavy equipment rental in ${locationName}. JCB, cranes, excavators, generators with certified operators.`,
            url: `https://transrentals.in/equipment-rental/${params.location.toLowerCase()}`,
            areaServed: { '@type': 'City', name: locationName, addressCountry: 'IN' },
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            priceRange: '₹₹',
          }),
        }}
      />
      {/* BreadcrumbList Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
          { '@type': 'ListItem', position: 2, name: 'Equipment Rental', item: 'https://transrentals.in/equipment-rental' },
          { '@type': 'ListItem', position: 3, name: `Equipment Rental in ${locationName}`, item: `https://transrentals.in/equipment-rental/${params.location.toLowerCase()}` },
        ],
      })}} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: cityFAQs.length > 0
              ? cityFAQs.map((faq) => ({
                  '@type': 'Question',
                  name: faq.q,
                  acceptedAnswer: { '@type': 'Answer', text: faq.a },
                }))
              : EQUIPMENT_FALLBACK_FAQS.map((faq) => ({
                  '@type': 'Question',
                  name: faq.question,
                  acceptedAnswer: { '@type': 'Answer', text: faq.answer },
                })),
          }),
        }}
      />
    </div>
  );
}
