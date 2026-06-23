import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { CityContentSection } from '@/components/location/CityContentSection';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { ComingSoonHero } from '@/components/services/ComingSoonHero';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { prisma } from '@/lib/db/prisma';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { getCachedServiceBySlug } from '@/lib/services/cached-service-lookups';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';
import { CITY_SEO } from '@/data/city-seo-content';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections, hasSectionsContent } from '@/components/seo/ServiceCitySections';
import { ServiceAreasSection } from '@/components/location/ServiceAreasSection';
import { CrossServiceLinks } from '@/components/location/CrossServiceLinks';

const BUS_RENTAL_FALLBACK_FAQS = [
  { question: 'What is the cost of bus rental per km in India?', answer: 'Bus rental rates depend on bus size and type. Tempo Traveller (12-seater) starts from ₹18/km. Mini bus (20-seater) starts from ₹25/km. Luxury coach (40-50 seater) starts from ₹40/km. Local packages (8 hrs/80 km) are also available. Get a free quote on TransRentals for your specific route and group size.' },
  { question: 'What bus sizes are available for rent?', answer: 'TransRentals offers Tempo Travellers (9, 12, 14, 17, 20-seater), mini buses (20–32 seater), standard buses (35–45 seater), and luxury coaches (45–55 seater). Both AC and non-AC options are available. Choose based on your group size — for comfortable travel with luggage, plan for 1–2 fewer passengers than stated capacity.' },
  { question: 'Is driver included in bus rental?', answer: 'Yes, all bus rentals on TransRentals include a professional driver. For outstation trips, driver allowance (₹300–₹500/day) is typically charged separately. Drivers are verified, licensed, and experienced on the relevant routes.' },
  { question: 'What are buses typically hired for?', answer: 'Common use cases: weddings (baraat and guest transport), corporate team outings, school and college excursions, pilgrimages (Shirdi, Tirupati, Char Dham), airport group transfers, sports events, and political/social rallies. Both single-day and multi-day packages are available.' },
  { question: 'How far in advance should I book a bus for a wedding or event?', answer: 'For weddings, book at least 3–4 weeks in advance — premium dates (wedding season Nov–Feb, May) fill up quickly. For corporate outings and pilgrimages, 1 week in advance is sufficient for regular demand. During Navratri, Dussehra, and long weekends, book 2 weeks ahead minimum.' },
];

const COMING_SOON_SLUGS = new Set([
  'uluberia',
  'bardhaman',
]);

interface PageProps {
  params: {
    location: string;
  };
}

export async function generateStaticParams() {
  if (process.env.SKIP_DATABASE_CALLS === '1') return [];
  try {
    const locations = await prisma.locations.findMany({
      where: { type: { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] }, isActive: true },
      select: { slug: true },
    });
    return locations.map((loc) => ({ location: loc.slug }));
  } catch {
    return getServiceLocations('bus-rental');
  }
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`bus-rental:${params.location.toLowerCase()}`),
    getServiceCityContent('bus-rental', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Bus Rental in ${locationName} | Starting ₹18/km | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Hire buses and tempo travellers in ${locationName}. Mini buses, luxury coaches, and AC Tempo Travellers for pilgrimages, weddings, corporate events. Verified operators.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `bus rental in ${locationName}`,
      `bus on rent ${locationName}`,
      `${locationName} bus rental`,
      `tempo traveller ${locationName}`,
      `mini bus rental ${locationName}`,
    ],
    alternates: {
      canonical: `https://transrentals.in/bus-rental/${params.location.toLowerCase()}`,
    },
    openGraph: {
      title: `Bus Rental in ${locationName} | TransRentals`,
      description: `Hire buses and tempo travellers in ${locationName}. AC/Non-AC options for pilgrimages, weddings, and corporate events. 500+ verified operators.`,
      type: 'website',
      url: `https://transrentals.in/bus-rental/${params.location.toLowerCase()}`,
      images: [
        {
          url: `https://transrentals.in/api/og?service=bus-rental&location=${encodeURIComponent(locationName)}`,
          width: 1200,
          height: 630,
          alt: `Bus Rental in ${locationName} - TransRentals`,
        },
      ],
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Bus Rental in ${locationName} | TransRentals`,
      description: `Hire buses and tempo travellers in ${locationName}. Verified operators for pilgrimages, weddings, and events.`,
      images: [`https://transrentals.in/api/og?service=bus-rental&location=${encodeURIComponent(locationName)}`],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
  };
}

export default async function BusLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('bus-rental', params.location, { comingSoonIfUnavailable: true });
  if (pageContext.type === 'redirect') {
    if (COMING_SOON_SLUGS.has(params.location)) {
      const cityName = getCityBySlug(params.location)?.name ??
        params.location.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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
            citySlug={params.location.toLowerCase()}
            serviceSlug="bus-rental"
            serviceName="Bus Rental"
            themeColor="blue"
          />
        </>
      );
    }
    permanentRedirect(pageContext.to);
  }
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
          citySlug={params.location.toLowerCase()}
          serviceSlug="bus-rental"
          serviceName="Bus Rental"
          themeColor="orange"
        />
        <NearbyActiveCities
          currentCitySlug={params.location.toLowerCase()}
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

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`bus-rental:${params.location.toLowerCase()}`),
    getServiceCityContent('bus-rental', params.location),
  ]);
  const cityFAQs = CITY_SEO[params.location]?.serviceFAQs?.['bus-rental'] || [];

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
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined}
        badge={`Bus Rental in ${locationName}`}
        title="Bus Rental Services"
        titleHighlight="Mini Bus & Luxury Coach Hire"
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
        vehicles={vehicles}
        title={`Available Buses in ${locationName}`}
        location={locationName}
        locationSlug={params.location.toLowerCase()}
        serviceSlug="bus-rental"
      />

      <WhyRentHere locationName={locationName} />

      <NearbyLocations
        locationSlug={params.location.toLowerCase()}
        service="bus-rental"
      />

      <ServiceAreasSection
        serviceSlug="bus-rental"
        citySlug={params.location.toLowerCase()}
        cityName={locationName}
        serviceName="Bus Rental"
      />

      <CrossServiceLinks
        citySlug={params.location.toLowerCase()}
        cityName={locationName}
        currentServiceSlug="bus-rental"
      />

      {/* TravelAgency / BusService Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: `Bus Rental in ${locationName} — TransRentals`,
            description: `Hire buses and tempo travellers in ${locationName}. Mini buses, luxury coaches for pilgrimages, weddings, and corporate events.`,
            url: `https://transrentals.in/bus-rental/${params.location.toLowerCase()}`,
            areaServed: { '@type': 'City', name: locationName },
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            priceRange: '₹₹',
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Bus Rental Services',
              itemListElement: [
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Tempo Traveller Hire' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Mini Bus Rental' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Luxury Coach Hire' } },
              ],
            },
          }),
        }}
      />
      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
              { '@type': 'ListItem', position: 2, name: 'Bus Rental', item: 'https://transrentals.in/bus-rental' },
              { '@type': 'ListItem', position: 3, name: `Bus Rental in ${locationName}`, item: `https://transrentals.in/bus-rental/${params.location.toLowerCase()}` },
            ],
          }),
        }}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="bus-rental"
        parentName="Bus Rental"
        currentSlug="bus-rental"
        siblings={[
          { slug: 'mini-truck-rental', name: 'Mini Truck Rental' },
          { slug: 'packers-and-movers', name: 'Packers & Movers' },
        ]}
      />

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
              : BUS_RENTAL_FALLBACK_FAQS.map((faq) => ({
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
