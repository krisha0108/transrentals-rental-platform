import React from 'react';
import type { Metadata } from 'next';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { prisma } from '@/lib/db/prisma';
import Image from 'next/image';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { OutstationBookingHero } from '@/components/outstation-car-rental/OutstationBookingHero';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL locations - GOD LEVEL SEO
// Generate static params from DATABASE - Only locations where car-rental is available
export async function generateStaticParams() {
  return getServiceLocations('car-rental');
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const _seoDb = await resolvePageMeta(`outstation-car-rental:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Outstation Car Rental in ${locationName} | Intercity Hire @₹10/Km | TransRentals`,
    description: _seoDb?.metaDescription || `Rent cars for outstation trips from ${locationName}. Round trips, one-way drops, multi-city tours. Professional drivers, all India permits. Book now!`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
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
  };
}

export default async function OutstationCarLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('outstation-car-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="outstation-car-rental" serviceName="Outstation Car Rental" />;
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const [seoData, vehicleCategories, cityPricing, routePackages] = await Promise.all([
    resolvePageMeta(`outstation-car-rental:${params.location}`),
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

      <OutstationBookingHero cityName={locationName} citySlug={params.location} vehicleCategories={vehicleCategories} cityPricing={cityPricing} />

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
        <section className="py-12 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
              Choose Your Cab from {locationName}
            </h2>
            <p className="text-center text-gray-500 mb-8 text-sm">Select from our range of well-maintained vehicles</p>

            {catsToShow.length === 1 ? (
              /* ── Single vehicle: wide horizontal card ── */
              (() => {
                const cat = catsToShow[0];
                let examples: string[] = [];
                try { examples = cat.exampleVehicles ? JSON.parse(cat.exampleVehicles) : []; } catch {}
                const pricing = pricingMap.get(cat.id);
                const rate = pricing?.baseKmRate ?? cat.dailyRate;
                const minKm = pricing?.minKmPerDay;
                const driverAllowance = pricing?.driverDayAllowance;
                return (
                  <div className={`relative bg-white rounded-2xl shadow-lg overflow-hidden max-w-3xl mx-auto flex flex-col sm:flex-row ${
                    cat.isPopular ? 'ring-2 ring-purple-500' : 'border border-purple-100'
                  }`}>
                    {cat.isPopular && (
                      <div className="absolute top-0 left-0 right-0 sm:left-0 sm:right-auto flex sm:block justify-center">
                        <span className="bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-b-lg sm:rounded-b-none sm:rounded-br-lg">
                          ⭐ POPULAR
                        </span>
                      </div>
                    )}
                    {/* Image */}
                    <div className={`relative sm:w-56 shrink-0 h-48 sm:h-auto bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center ${cat.isPopular ? 'mt-7 sm:mt-0 sm:ml-0' : ''}`}>
                      {cat.image ? (
                        <Image src={cat.image} alt={cat.name} fill className="object-contain p-6" sizes="(max-width:640px) 100vw,224px" />
                      ) : (
                        <span className="text-8xl">🚗</span>
                      )}
                    </div>
                    {/* Content */}
                    <div className="p-6 flex flex-col justify-center flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 capitalize">{cat.name}</h3>
                          <p className="text-sm text-gray-500">{cat.seatingCapacity} Seater{cat.acType ? ` · ${cat.acType}` : ''}</p>
                          {examples.length > 0 && (
                            <p className="text-sm text-gray-400 mt-0.5">{examples.slice(0, 2).join(', ')}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {rate ? (
                            <>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-purple-600">₹{rate.toLocaleString('en-IN')}</span>
                                <span className="text-sm text-gray-500">/km</span>
                              </div>
                              {minKm && <p className="text-xs text-gray-400">Min {minKm} km/day</p>}
                            </>
                          ) : (
                            <p className="text-xl font-bold text-purple-600">Get Quote</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                        {[
                          `${cat.seatingCapacity} passengers`,
                          'AC & comfortable',
                          'Professional driver',
                          ...(driverAllowance ? [`Driver allowance ₹${driverAllowance}/day`] : []),
                        ].map((f) => (
                          <p key={f} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="text-purple-500">✓</span>{f}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              /* ── Multiple vehicles: grid ── */
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {catsToShow.map((cat) => {
                  let examples: string[] = [];
                  try { examples = cat.exampleVehicles ? JSON.parse(cat.exampleVehicles) : []; } catch {}
                  const pricing = pricingMap.get(cat.id);
                  const rate = pricing?.baseKmRate ?? cat.dailyRate;
                  const minKm = pricing?.minKmPerDay;
                  const driverAllowance = pricing?.driverDayAllowance;
                  return (
                    <div
                      key={cat.id}
                      className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition overflow-hidden flex flex-col ${
                        cat.isPopular ? 'ring-2 ring-purple-500 scale-[1.02]' : 'border border-purple-100'
                      }`}
                    >
                      {cat.isPopular && (
                        <div className="absolute top-0 left-0 right-0 flex justify-center">
                          <span className="bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-b-lg">
                            ⭐ POPULAR
                          </span>
                        </div>
                      )}
                      <div className={`relative h-44 bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center ${cat.isPopular ? 'mt-6' : ''}`}>
                        {cat.image ? (
                          <Image src={cat.image} alt={cat.name} fill className="object-contain p-4" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" />
                        ) : (
                          <span className="text-7xl">🚗</span>
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <div className="text-center mb-3">
                          <h3 className="text-xl font-bold text-gray-900 capitalize">{cat.name}</h3>
                          <p className="text-sm text-gray-500">{cat.seatingCapacity} Seater{cat.acType ? ` · ${cat.acType}` : ''}</p>
                        </div>
                        {examples.length > 0 && (
                          <p className="text-sm text-gray-500 text-center mb-3">{examples.slice(0, 2).join(', ')}</p>
                        )}
                        <div className="text-center mb-4">
                          {rate ? (
                            <>
                              <div className="flex items-baseline justify-center gap-1">
                                <span className="text-3xl font-bold text-purple-600">₹{rate.toLocaleString('en-IN')}</span>
                                <span className="text-sm text-gray-500">/km</span>
                              </div>
                              {minKm && <p className="text-xs text-gray-400 mt-0.5">Min {minKm} km/day</p>}
                            </>
                          ) : (
                            <p className="text-xl font-bold text-purple-600">Get Quote</p>
                          )}
                        </div>
                        <div className="space-y-1.5 mb-4">
                          {[
                            `${cat.seatingCapacity} passengers`,
                            'AC & comfortable',
                            'Professional driver',
                            ...(driverAllowance ? [`Driver allowance ₹${driverAllowance}/day`] : []),
                          ].map((f) => (
                            <p key={f} className="text-sm text-gray-600 flex items-center gap-2">
                              <span className="text-purple-500">✓</span>{f}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Price info note */}
            <p className="text-center text-xs text-gray-400 mt-6">
              * Rates shown are per km. Final price includes driver allowance + GST (5%). Toll & parking extra.
            </p>
          </div>
        </section>
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
                  href={`/one-way-cab/${params.location}-to-${route.toSlug}`}
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

      <PopularRoutes
        location={locationName}
        locationSlug={params.location}
        serviceSlug="outstation-car-rental"
      />

      <FAQSection service="car-rental" location={locationName} />

      <NearbyLocations
        locationSlug={params.location}
        service="outstation-car-rental"
      />

      <CityContentSection
        citySlug={params.location}
        serviceSlug="outstation-car-rental"
        cityName={locationName}
        stateCode={city?.stateCode}
      />
    </div>
  );
}
