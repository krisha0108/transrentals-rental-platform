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
import {
  UserCog, Fuel, Route as RouteIcon, Briefcase, Shield, MapPinned, Headphones, Sparkles, ArrowRight,
} from 'lucide-react';

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
      <section className="relative overflow-hidden py-14 md:py-16 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-[2rem] font-black tracking-tight text-gray-900 text-center mb-10">
            What&apos;s <span className="text-emerald-600">Included?</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              { icon: UserCog, title: 'Professional Driver', desc: 'Experienced & courteous' },
              { icon: Fuel, title: 'Fuel Charges', desc: 'All fuel included' },
              { icon: RouteIcon, title: 'Toll & Parking', desc: 'All charges included' },
              { icon: Briefcase, title: 'Driver Allowance', desc: 'Daily allowance covered' },
              { icon: Shield, title: 'Insurance', desc: 'Fully insured vehicles' },
              { icon: MapPinned, title: 'State Permits', desc: 'All India permits' },
              { icon: Headphones, title: '24/7 Support', desc: 'Always available' },
              { icon: Sparkles, title: 'Clean Vehicles', desc: 'Sanitized cars' },
            ].map((item) => (
              <div
                key={item.title}
                className="group bg-white border border-gray-100 shadow-sm rounded-2xl p-5 text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <span className="inline-flex w-11 h-11 rounded-xl bg-emerald-50 items-center justify-center mb-3 group-hover:bg-emerald-600 transition-colors duration-300">
                  <item.icon className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                </span>
                <h3 className="text-[13.5px] font-bold text-gray-900 leading-snug mb-1">{item.title}</h3>
                <p className="text-[11.5px] leading-relaxed text-gray-500">{item.desc}</p>
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
        <section className="relative overflow-hidden py-14 md:py-16 bg-white">
          <div className="container-custom relative">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl md:text-[2rem] font-black tracking-tight text-gray-900">
                Popular Outstation Routes from <span className="text-emerald-600">{locationName}</span>
              </h2>
              <p className="text-gray-500 text-sm mt-2">All-inclusive · Professional drivers · All India permit</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {popularRoutes.map((route) => (
                <a
                  key={route.toSlug}
                  href={`/one-way-cab/${params.location.toLowerCase()}-to-${route.toSlug}`}
                  className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-emerald-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">{locationName}</p>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                        {route.toName} <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                      </h3>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold text-emerald-700">Get Quote</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    {route.estimatedKm > 0 && (
                      <span>{route.estimatedKm} km</span>
                    )}
                    {route.estimatedDuration && (
                      <span>~{route.estimatedDuration}</span>
                    )}
                    <span className="text-emerald-600 font-medium">Round trip &amp; one-way available</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {route.vehicles.slice(0, 3).map((v) => (
                      <span key={v} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full capitalize">
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
