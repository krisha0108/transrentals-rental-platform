import { Metadata } from 'next';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';
import Image from 'next/image';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL cities - GOD LEVEL SEO
// Generate static params from DATABASE - Only locations where car-rental is available
export async function generateStaticParams() {
  return getAllCityLocations();
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);

  if (!city) {
    return { title: 'One Way Car Rental | TransRentals' };
  }

  const locationName = city.name;

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`one-way-car-rental:${params.location.toLowerCase()}`),
    getServiceCityContent('one-way-car-rental', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `One Way Car Rental from ${locationName} | Drop at Different City @₹1299 | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `One-way car rental from ${locationName}. Drop car at different city. No return trip needed. Convenient intercity travel. Book online instantly.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `one way car rental ${locationName.toLowerCase()}`,
      `one way car hire ${locationName.toLowerCase()}`,
      `${locationName.toLowerCase()} to other cities cab`,
      `drop car different city ${locationName.toLowerCase()}`,
      `intercity car rental ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `one way car ${k}`),
    ],
    openGraph: {
      title: `One Way Car Rental from ${locationName} - Starting @₹1299`,
      description: `Rent a car in ${locationName} and drop it at a different city. No return trip required.`,
      url: `https://transrentals.in/one-way-car-rental/${params.location.toLowerCase()}`,
    },
    alternates: {
      canonical: `https://transrentals.in/one-way-car-rental/${params.location.toLowerCase()}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `One Way Car Rental from ${locationName} | TransRentals`,
      description: `One-way car rental from ${locationName}. Drop at different city. No return trip needed @₹1299.`,
    },
  };
}

export default async function OneWayCarRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('one-way-car-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="one-way-car-rental" serviceName="One Way Car Rental" />;
  const city = pageContext.city;

  const scContent = await getServiceCityContent('one-way-car-rental', params.location);
  const locationName = city.name;

  // Fetch one-way route packages FROM this location
  const routePackages = await prisma.chauffeur_route_packages.findMany({
    where: {
      isActive: true,
      isAirportTransfer: false,
      locations_chauffeur_route_packages_fromLocationIdTolocations: { slug: params.location },
      locations_chauffeur_route_packages_toLocationIdTolocations: { type: { not: 'AIRPORT' } },
    },
    select: {
      id: true,
      basePrice: true,
      estimatedKm: true,
      estimatedDuration: true,
      isPopular: true,
      chauffeur_vehicle_categories: {
        select: { id: true, name: true, slug: true, seatingCapacity: true, acType: true, image: true, exampleVehicles: true, isPopular: true },
      },
      locations_chauffeur_route_packages_toLocationIdTolocations: { select: { name: true, slug: true } },
    },
    orderBy: [{ isPopular: 'desc' }, { basePrice: 'asc' }],
  });

  // Group by vehicle category — min price per category
  const catMap = new Map<string, {
    cat: typeof routePackages[0]['chauffeur_vehicle_categories'];
    minPrice: number;
    routeCount: number;
  }>();
  for (const rp of routePackages) {
    const existing = catMap.get(rp.chauffeur_vehicle_categories.id);
    if (!existing) {
      catMap.set(rp.chauffeur_vehicle_categories.id, { cat: rp.chauffeur_vehicle_categories, minPrice: rp.basePrice, routeCount: 1 });
    } else {
      if (rp.basePrice < existing.minPrice) existing.minPrice = rp.basePrice;
      existing.routeCount++;
    }
  }
  const vehicleCats = Array.from(catMap.values());

  // Group popular routes by destination
  const destMap = new Map<string, { toName: string; toSlug: string; minPrice: number; estimatedKm: number; isPopular: boolean }>();
  for (const rp of routePackages) {
    const dest = rp.locations_chauffeur_route_packages_toLocationIdTolocations;
    const existing = destMap.get(dest.slug);
    if (!existing) {
      destMap.set(dest.slug, { toName: dest.name, toSlug: dest.slug, minPrice: rp.basePrice, estimatedKm: rp.estimatedKm, isPopular: rp.isPopular });
    } else {
      if (rp.basePrice < existing.minPrice) existing.minPrice = rp.basePrice;
      if (rp.isPopular) existing.isPopular = true;
    }
  }
  const popularRoutes = Array.from(destMap.values()).sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0)).slice(0, 8);

  const pageFaqs = [
    { question: 'What is a one-way car rental and how does it work?', answer: 'A one-way rental lets you travel from one city to another and drop the car there — no need to return to the starting city. Pay only for the distance travelled.' },
    { question: 'Is one-way car rental cheaper than a round trip?', answer: 'For single-direction travel, one-way is cheaper as you pay per km for only one leg. Round-trip pricing includes return journey even if unused.' },
    { question: 'Is there a dead-km charge for one-way car rental?', answer: 'No dead-km charges. You pay only for the actual distance from pickup to drop. Toll and state taxes are charged extra on actuals.' },
    { question: 'Which cities can I travel to with a one-way car rental?', answer: 'We offer one-way car rental to 100+ cities across India. Popular routes include metro-to-metro and metro-to-hill-station routes.' },
  ];

  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/one-way-car-rental" className="hover:text-primary">One Way Car Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      {/* Booking Hero - Same as Car Rental */}
      <CarRentalBookingHero
        city={locationName}
        citySlug={params.location.toLowerCase()}
        serviceSlug="car-rental"
        serviceTitle="One Way Car Rental"
      />

      {/* Why One Way from This City */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Why Choose One Way Car Rental from {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '🎯', title: 'No Return Needed', desc: 'Drop car at destination' },
              { icon: '💰', title: 'Cost Effective', desc: 'Pay only one-way fare' },
              { icon: '⏱️', title: 'Time Saving', desc: 'Direct travel to destination' },
              { icon: '🛣️', title: 'Flexible Routes', desc: `Travel from ${locationName} anywhere` },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Cars — dynamic from chauffeur_route_packages */}
      {vehicleCats.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-3xl font-bold mb-2">One Way Cars Available from {locationName}</h2>
            <p className="text-gray-500 mb-8">Choose your vehicle type for a one-way trip</p>
            <div className={`grid gap-6 ${vehicleCats.length === 1 ? 'max-w-sm mx-auto' : vehicleCats.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'md:grid-cols-3'}`}>
              {vehicleCats.map(({ cat, minPrice, routeCount }) => {
                let examples: string[] = [];
                try { examples = cat.exampleVehicles ? JSON.parse(cat.exampleVehicles) : []; } catch {}
                return (
                  <div key={cat.id} className={`relative bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col ${cat.isPopular ? 'ring-2 ring-green-500' : 'border border-gray-200'}`}>
                    {cat.isPopular && (
                      <div className="absolute top-0 left-0 right-0 flex justify-center">
                        <span className="bg-green-600 text-white text-xs font-bold px-4 py-1 rounded-b-lg">⭐ POPULAR</span>
                      </div>
                    )}
                    <div className={`relative h-40 bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center ${cat.isPopular ? 'mt-6' : ''}`}>
                      {cat.image ? (
                        <Image src={cat.image} alt={cat.name} fill className="object-contain p-4" sizes="(max-width:768px) 100vw,33vw" />
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
                        <p className="text-sm text-gray-400 text-center mb-3">{examples.slice(0, 2).join(', ')}</p>
                      )}
                      <div className="text-center mb-4">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl font-bold text-green-600">₹{minPrice.toLocaleString('en-IN')}</span>
                          <span className="text-sm text-gray-400">onwards</span>
                        </div>
                        <p className="text-xs text-gray-400">{routeCount} route{routeCount > 1 ? 's' : ''} available</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-gray-400 mt-6">
              * Prices shown are starting fares. Final price includes driver charges, fuel & GST (5%). Toll & parking extra.
            </p>
          </div>
        </section>
      )}

      {/* Popular One Way Routes — dynamic from DB */}
      {popularRoutes.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container-custom">
            <h2 className="text-3xl font-bold mb-2">Popular One Way Routes from {locationName}</h2>
            <p className="text-gray-500 mb-8">Fixed prices · All-inclusive · No return charges</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularRoutes.map((route) => (
                <a
                  key={route.toSlug}
                  href={`/one-way-cab/${params.location.toLowerCase()}-to-${route.toSlug}`}
                  className={`group flex items-center justify-between bg-gray-50 hover:bg-green-50 border-2 p-4 rounded-xl transition ${route.isPopular ? 'border-green-300' : 'border-gray-200 hover:border-green-200'}`}
                >
                  <div>
                    <p className="text-xs text-gray-400">{locationName}</p>
                    <p className="font-semibold text-gray-900 group-hover:text-green-700 transition">→ {route.toName}</p>
                    {route.estimatedKm > 0 && <p className="text-xs text-gray-400">{route.estimatedKm} km</p>}
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-lg font-bold text-green-600">₹{route.minPrice.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-400">one-way</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing Structure */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            One Way Car Rental Pricing from {locationName}
          </h2>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-4 text-green-600">Included in Price</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Base fare for journey</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Driver charges (if applicable)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Tolls and permits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>No return charges</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4 text-orange-600">Extra Charges</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>Fuel (actual consumption)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>State tax if applicable</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>Driver accommodation (overnight)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>Parking charges</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Book */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            How to Book One Way Car from {locationName}
          </h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Select Route', desc: `Choose ${locationName} as pickup and your destination city` },
              { step: '2', title: 'Choose Car Type', desc: 'Select from hatchback, sedan, SUV based on your needs' },
              { step: '3', title: 'Book Online', desc: 'Complete booking with your details and travel date' },
              { step: '4', title: 'Pick Up', desc: `Collect your car in ${locationName} at scheduled time` },
              { step: '5', title: 'Drop Off', desc: 'Drop the car at your destination city - done!' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="one-way-car-rental"
              cityName={locationName}
              stateCode={city?.stateCode}
            />
      */}

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: `One Way Car Rental from ${locationName}`,
            description: `One-way car rental service from ${locationName}. Drop at different city.`,
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: 1299,
              highPrice: 9999,
              offerCount: 30,
            },
            provider: {
              '@type': 'Organization',
              name: 'TransRentals',
              url: 'https://transrentals.in',
            },
          }),
        }}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="car-rental"
        parentName="Car Rental with Driver"
        currentSlug="one-way-car-rental"
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

    </>
  );
}
