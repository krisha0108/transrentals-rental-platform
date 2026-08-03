import React from 'react';
import type { Metadata } from 'next';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { prisma } from '@/lib/db/prisma';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { OutstationCabSection } from '@/components/outstation-cab/OutstationCabSection';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { OutstationBookingHero } from '@/components/outstation-car-rental/OutstationBookingHero';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { RelatedServices } from '@/components/services/RelatedServices';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { ComingSoonHero } from '@/components/services/ComingSoonHero';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

const COMING_SOON_SLUGS = new Set([
  'ahmedabad-airport-amd',
]);

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL locations - GOD LEVEL SEO
// Generate static params from DATABASE - Only locations where car-rental is available
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
    resolvePageMeta(`outstation-car-rental:${params.location.toLowerCase()}`),
    getServiceCityContent('outstation-car-rental', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Outstation Car Rental in ${locationName} | ₹10/Km Intercity`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent cars for outstation trips from ${locationName}. Round trips, one-way drops, multi-city tours. Professional drivers, all India permits. Book now!`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `outstation car rental in ${locationName}`,
      `intercity car hire ${locationName}`,
      `${locationName} outstation cab`,
      `car for long trip ${locationName}`,
      `outstation taxi ${locationName}`,
    ],
    openGraph: {
      title: `Outstation Car Rental from ${locationName} - TransRentals`,
      description: `Rent cars for outstation trips from ${locationName} starting @₹10/km.`,
    },
    alternates: { canonical: `https://transrentals.in/outstation-car-rental/${params.location.toLowerCase()}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Outstation Car Rental in ${locationName} | TransRentals`,
      description: `Rent cars for outstation trips from ${locationName} starting @₹10/km with professional drivers.`,
    },
  };
}

export default async function OutstationCarLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('outstation-car-rental', params.location);
  if (pageContext.type === 'redirect') {
    if (COMING_SOON_SLUGS.has(params.location)) {
      const cityName = getCityBySlug(params.location)?.name ??
        params.location.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return (
        <>
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="container-custom py-3">
              <nav className="text-sm text-gray-600">
                <a href="/" className="hover:text-primary">Home</a>
                <span className="mx-2">/</span>
                <a href="/outstation-car-rental" className="hover:text-primary">Outstation Car Rental</a>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">{cityName}</span>
              </nav>
            </div>
          </div>
          <ComingSoonHero
            city={cityName}
            citySlug={params.location.toLowerCase()}
            serviceSlug="outstation-car-rental"
            serviceName="Outstation Car Rental"
            themeColor="blue"
          />
        </>
      );
    }
    permanentRedirect(pageContext.to);
  }
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="outstation-car-rental" serviceName="Outstation Car Rental" />;
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const pageFaqs = [
    { question: 'How is outstation car rental pricing calculated?', answer: 'Outstation car rental is priced per km with a minimum km guarantee. Round trips include return journey; one-way trips charge only actual distance.' },
    { question: 'What vehicles are available for outstation travel?', answer: 'We offer Sedan (Dzire, City), SUV (Ertiga, Innova), and Luxury (Fortuner, Crysta) for all outstation routes with experienced drivers.' },
    { question: 'Are night halt charges applicable for outstation trips?', answer: 'Yes, ₹300–₹500 driver night halt is charged per night for multi-day trips. This is separate from the per-km vehicle charge.' },
    { question: 'Can I modify or cancel my outstation car rental booking?', answer: 'Free cancellation up to 6 hours before the trip. Modifications allowed up to 2 hours before start subject to availability.' },
  ];

  const [seoData, vehicleCategories, cityPricing, routePackages, scContent] = await Promise.all([
    resolvePageMeta(`outstation-car-rental:${params.location.toLowerCase()}`),
    prisma.chauffeur_vehicle_categories.findMany({
      where: {
        isActive: true,
        services: { slug: 'car-rental' },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        seatingCapacity: true,
        luggageCapacity: true,
        acType: true,
        exampleVehicles: true,
        isPopular: true,
        dailyRate: true,
      },
      orderBy: [{ isPopular: 'desc' }, { displayOrder: 'asc' }],
    }),
    prisma.chauffeur_city_pricing.findMany({
      where: {
        isActive: true,
        locations: { slug: params.location },
      },
      select: {
        vehicleCategoryId: true,
        baseKmRate: true,
        minKmPerDay: true,
        driverDayAllowance: true,
      },
    }),
    prisma.chauffeur_route_packages.findMany({
      where: {
        isActive: true,
        locations_chauffeur_route_packages_fromLocationIdTolocations: { slug: params.location },
        locations_chauffeur_route_packages_toLocationIdTolocations: { type: { not: 'AIRPORT' } },
      },
      select: {
        id: true,
        basePrice: true,
        returnMultiplier: true,
        estimatedKm: true,
        estimatedDuration: true,
        isPopular: true,
        chauffeur_vehicle_categories: { select: { name: true, slug: true } },
        locations_chauffeur_route_packages_toLocationIdTolocations: { select: { name: true, slug: true } },
      },
      orderBy: [{ isPopular: 'desc' }, { estimatedKm: 'asc' }],
    }),
    getServiceCityContent('outstation-car-rental', params.location),
  ]);

  // Group route packages by destination — pick min round-trip price per destination
  const routesByDest = new Map<string, {
    toName: string; toSlug: string; estimatedKm: number;
    estimatedDuration: string | null; isPopular: boolean;
    minRoundTrip: number; minOneWay: number;
    vehicles: string[];
  }>();
  for (const rp of routePackages) {
    const dest = rp.locations_chauffeur_route_packages_toLocationIdTolocations;
    const roundTrip = Math.round(rp.basePrice * rp.returnMultiplier);
    const existing = routesByDest.get(dest.slug);
    if (!existing) {
      routesByDest.set(dest.slug, {
        toName: dest.name, toSlug: dest.slug,
        estimatedKm: rp.estimatedKm, estimatedDuration: rp.estimatedDuration,
        isPopular: rp.isPopular, minRoundTrip: roundTrip, minOneWay: rp.basePrice,
        vehicles: [rp.chauffeur_vehicle_categories.name],
      });
    } else {
      if (roundTrip < existing.minRoundTrip) existing.minRoundTrip = roundTrip;
      if (rp.basePrice < existing.minOneWay) existing.minOneWay = rp.basePrice;
      if (!existing.vehicles.includes(rp.chauffeur_vehicle_categories.name))
        existing.vehicles.push(rp.chauffeur_vehicle_categories.name);
      if (rp.isPopular) existing.isPopular = true;
    }
  }
  const popularRoutes = Array.from(routesByDest.values()).slice(0, 9);

  // Build pricing map and filter categories to only those with city-specific pricing
  const pricingMap = new Map(cityPricing.map((p) => [p.vehicleCategoryId, p]));
  const catsToShow = cityPricing.length > 0
    ? vehicleCategories.filter((cat) => pricingMap.has(cat.id))
    : vehicleCategories;

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/outstation-car-rental" className="hover:text-primary">Outstation Car Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <OutstationBookingHero cityName={locationName} citySlug={params.location.toLowerCase()} vehicleCategories={vehicleCategories} cityPricing={cityPricing} />

      {/* What's Included */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            What&apos;s Included?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '👨‍✈️', title: 'Professional Driver', desc: 'Experienced & courteous' },
              { icon: '⛽', title: 'Fuel Charges', desc: 'All fuel included' },
              { icon: '🛣️', title: 'Toll & Parking', desc: 'All charges included' },
              { icon: '💼', title: 'Driver Allowance', desc: 'Daily allowance covered' },
              { icon: '🛡️', title: 'Insurance', desc: 'Fully insured vehicles' },
              { icon: '🗺️', title: 'State Permits', desc: 'All India permits' },
              { icon: '📞', title: '24/7 Support', desc: 'Always available' },
              { icon: '🧼', title: 'Clean Vehicles', desc: 'Sanitized cars' },
            ].map((item) => (
              <div key={item.title} className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-lg border border-purple-200 text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic vehicle categories with city-specific pricing */}
      {catsToShow.length > 0 && (
        <OutstationCabSection
          categories={catsToShow}
          pricingMap={Object.fromEntries(pricingMap)}
        />
      )}

      {/* Popular Round Trip Routes from DB */}
      {popularRoutes.length > 0 && (
        <section className="py-12 bg-white">
          <div className="container-custom">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Popular Outstation Routes from {locationName}
              </h2>
              <p className="text-gray-500 text-sm">Fixed prices · All-inclusive · Professional drivers</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {popularRoutes.map((route) => (
                <a
                  key={route.toSlug}
                  href={`/one-way-cab/${params.location.toLowerCase()}-to-${route.toSlug}`}
                  className={`group relative bg-white rounded-xl border-2 p-5 hover:shadow-lg transition-all ${
                    route.isPopular ? 'border-purple-300 shadow-md' : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  {route.isPopular && (
                    <span className="absolute -top-2.5 left-4 bg-purple-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">{locationName}</p>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-purple-700 transition-colors">
                        → {route.toName}
                      </h3>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xl font-bold text-purple-600">₹{route.minRoundTrip.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-400">round trip</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    {route.estimatedKm > 0 && (
                      <span>{route.estimatedKm} km</span>
                    )}
                    {route.estimatedDuration && (
                      <span>~{route.estimatedDuration}</span>
                    )}
                    <span className="text-green-600 font-medium">One-way ₹{route.minOneWay.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {route.vehicles.slice(0, 3).map((v) => (
                      <span key={v} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full capitalize">
                        {v}
                      </span>
                    ))}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <WhyRentHere locationName={locationName} />

      <NearbyLocations
        locationSlug={params.location.toLowerCase()}
        service="outstation-car-rental"
      />

      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="outstation-car-rental"
              cityName={locationName}
              stateCode={city?.stateCode}
            />
      */}
      <BikeServiceSchema
        serviceName="Outstation Car Rental"
        serviceSlug="outstation-car-rental"
        description={`Rent cars for outstation trips from ${locationName} starting @₹10/km with professional drivers.`}
        city={locationName}
        citySlug={params.location.toLowerCase()}
        faqs={[]}
        rating={4.7}
        reviewCount={1589}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="car-rental"
        parentName="Car Rental with Driver"
        currentSlug="outstation-car-rental"
        siblings={[
          { slug: 'chauffeur-service', name: 'Chauffeur Service' },
          { slug: 'local-taxi', name: 'Local Taxi' },
          { slug: 'outstation-cab', name: 'Outstation Cab' },
          { slug: 'one-way-car-rental', name: 'One Way Car Rental' },
          { slug: 'outstation-car-rental', name: 'Outstation Car Rental' },
          { slug: 'monthly-car-rental', name: 'Monthly Car Rental' },
          { slug: 'corporate-car-rental', name: 'Corporate Car Rental' },
        ]}
      />
    </div>
  );
}
