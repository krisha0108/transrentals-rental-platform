import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { notFound } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { getAllIndiaFleet } from '@/lib/fleet-utils';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { ComingSoonHero } from '@/components/services/ComingSoonHero';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { prisma } from '@/lib/db/prisma';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { CITY_SEO } from '@/data/city-seo-content';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections, hasSectionsContent } from '@/components/seo/ServiceCitySections';

const TRANSPORTER_FALLBACK_FAQS = [
  { question: 'What is the cost of truck rental per day?', answer: 'Mini truck (Tata Ace, 1T) starts from ₹2,500/day for local trips. Tata 407 (5T) starts from ₹6,000/day. Container trucks (20–32 ft) are quoted per trip based on route and load. Outstation rates are charged per km. Get a free quote on TransRentals for your specific load and route requirements.' },
  { question: 'What types of trucks are available for rent?', answer: 'TransRentals offers mini trucks (Tata Ace, Mahindra Jeeto — 1T), light commercial vehicles (Tata 407, Bolero Pickup — 1.5–5T), medium trucks (Eicher 14/17/19 ft — 3–7T), container trucks (20 ft, 24 ft, 32 ft — 10–25T), and full trailers (40-ft flatbed/container — 25–40T).' },
  { question: 'What is the difference between full-load (FTL) and part-load (LTL)?', answer: 'Full-truck-load (FTL) means you hire the entire truck exclusively for your goods — faster transit, better for large or fragile shipments. Part-load (LTL) means your goods share space with others — cheaper but slower transit. TransRentals offers both options.' },
  { question: 'Can I book a truck for a one-way intercity trip?', answer: 'Yes, one-way intercity truck bookings are available. Major routes: Delhi–Mumbai, Mumbai–Pune, Bangalore–Chennai, Delhi–Kolkata. One-way rates include driver allowance. Contact TransRentals for freight quotes on specific routes.' },
  { question: 'Is goods insurance available for truck rentals?', answer: 'Yes, transit insurance for goods is available at 0.5–1% of declared goods value. All vehicles have mandatory third-party insurance. For valuable or fragile cargo, always opt for goods-in-transit insurance before booking.' },
];
import { getCachedServiceBySlug } from '@/lib/services/cached-service-lookups';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';

const COMING_SOON_SLUGS = new Set([
  'logistics-company-in-bhiwandi',
  'logistics-company-in-kolkata',
  'Nellore',
  'nellore',
  'bhayandar',
  'dehradun',
  'vapi',
  'logistics-service-in-gandhidham',
  'gandhidham',
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

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`transporter:${params.location}`),
    getServiceCityContent('transporter', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Truck Rental in ${locationName} | Starting from ₹3,999/Day | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Book trucks and goods vehicles in ${locationName}. Mini trucks to 32-ton containers with GPS tracking and verified drivers. Full-load and part-load options.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `truck rental in ${locationName}`,
      `transporter in ${locationName}`,
      `${locationName} goods transport`,
      `truck on rent ${locationName}`,
      `cargo transport ${locationName}`,
    ],
    openGraph: {
      title: `Truck Rental in ${locationName} | TransRentals`,
      description: `Book trucks and goods vehicles in ${locationName}. GPS tracking, verified drivers. Full-load and part-load available.`,
    },
  };
}

export default async function TransporterLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('transporter', params.location, { comingSoonIfUnavailable: true });
  if (pageContext.type === 'redirect') {
    if (COMING_SOON_SLUGS.has(params.location)) {
      const cityName = params.location.replace('logistics-company-in-', '')
        .split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return (
        <>
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="container-custom py-3">
              <nav className="text-sm text-gray-600">
                <a href="/" className="hover:text-primary">Home</a>
                <span className="mx-2">/</span>
                <a href="/transporter" className="hover:text-primary">Truck & Tempo Rental</a>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">{cityName}</span>
              </nav>
            </div>
          </div>
          <ComingSoonHero
            city={cityName}
            citySlug={params.location}
            serviceSlug="transporter"
            serviceName="Truck & Tempo Rental"
            themeColor="red"
          />
        </>
      );
    }
    notFound();
  }
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="transporter" serviceName="Transporter" />;
  if (pageContext.type === 'coming-soon') {
    const cityName = pageContext.city.name;
    return (
      <>
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/transporter" className="hover:text-primary">Truck & Tempo Rental</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{cityName}</span>
            </nav>
          </div>
        </div>
        <ComingSoonHero
          city={cityName}
          citySlug={params.location}
          serviceSlug="transporter"
          serviceName="Truck & Tempo Rental"
          themeColor="red"
        />
        <NearbyActiveCities
          currentCitySlug={params.location}
          serviceSlug="transporter"
          serviceName="Truck & Tempo Rental"
        />
      </>
    );
  }
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));

  // Fetch trucks/transporters from database (filtered by service and location) (cached)
  const service = await getCachedServiceBySlug('transporter');

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
          },
          select: { basePricePerDay: true }
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

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`transporter:${params.location}`),
    getServiceCityContent('transporter', params.location),
  ]);
  const cityFAQs = CITY_SEO[params.location]?.serviceFAQs?.['transporter'] || [];

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
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined}
        badge={`Truck Rental in ${locationName}`}
        title="Professional Transport Services"
        titleHighlight="7-32 Ton Trucks | GPS Tracked"
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

      <NearbyLocations
        locationSlug={params.location}
        service="transporter"
      />

      {/* LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: `Truck Rental in ${locationName} — TransRentals`,
            description: `Professional truck rental and goods transport in ${locationName}. Mini trucks to 32-ton container trucks. GPS tracking, verified drivers.`,
            url: `https://transrentals.in/transporter/${params.location}`,
            areaServed: { '@type': 'City', name: locationName },
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            priceRange: '₹₹',
          }),
        }}
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
              : TRANSPORTER_FALLBACK_FAQS.map((faq) => ({
                  '@type': 'Question',
                  name: faq.question,
                  acceptedAnswer: { '@type': 'Answer', text: faq.answer },
                })),
          }),
        }}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />
    </div>
  );
}
