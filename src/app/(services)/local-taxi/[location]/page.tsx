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
import { getCarRentalServiceId, getLocationId } from '@/lib/db/build-cache';
import { LocalTaxiPackages } from '@/components/local-taxi/LocalTaxiPackages';
import { RelatedServices } from '@/components/services/RelatedServices';
import { ServiceComingSoon } from '@/components/location/ServiceComingSoon';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

const COMING_SOON_SLUGS = new Set([
  'bhavnagar',
  'goa',
  'Goa',
  'pune',
  'thrissur',
  'vrindavan',
]);

interface PageProps {
  params: {
    location: string;
  };
}

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
  // Fallback: getAllCities().find(c => c.slug === params.location);

  if (!city) {
    return { title: 'Local Taxi | TransRentals' };
  }

  const locationName = city.name;

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`local-taxi:${params.location}`),
    getServiceCityContent('local-taxi', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Local Taxi ${locationName} | Hourly Cab @₹399 | 4 Hour 8 Hour Package`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Book local taxi in ${locationName}. Hourly cab rental - 4hr, 8hr, 12hr packages. City taxi service. AC sedan, SUV @₹399.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `local taxi ${locationName.toLowerCase()}`,
      `hourly taxi ${locationName.toLowerCase()}`,
      `local cab ${locationName.toLowerCase()}`,
      `taxi for 4 hours ${locationName.toLowerCase()}`,
      `8 hour taxi ${locationName.toLowerCase()}`,
      `city taxi ${locationName.toLowerCase()}`,
      `hourly cab ${locationName.toLowerCase()}`,
      `local car rental ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `local taxi ${k}`),
    ],
    openGraph: {
      title: `Local Taxi in ${locationName} - Hourly Cab @₹399`,
      description: `Book hourly taxi in ${locationName}. 4hr, 8hr, 12hr packages available.`,
      url: `https://transrentals.in/local-taxi/${params.location}`,
    },
    alternates: {
      canonical: `https://transrentals.in/local-taxi/${params.location}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Local Taxi in ${locationName} | TransRentals`,
      description: `Book local taxi in ${locationName}. Hourly cab rental - 4hr, 8hr, 12hr packages @₹399.`,
    },
  };
}

export default async function LocalTaxiLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('local-taxi', params.location);
  if (pageContext.type === 'redirect') {
    if (COMING_SOON_SLUGS.has(params.location)) {
      const cityName = getCityBySlug(params.location)?.name ??
        params.location.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return (
        <ServiceComingSoon
          serviceName="Local Taxi"
          serviceSlug="local-taxi"
          locationName={cityName}
          locationSlug={params.location}
        />
      );
    }
    permanentRedirect(pageContext.to);
  }
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="local-taxi" serviceName="Local Taxi" />;
  const city = pageContext.city;
  // Fallback: getAllCities().find(c => c.slug === params.location);

  const locationName = city.name;

  // Fetch local packages from DB (city-specific + global fallback)
  const [locationId, carRentalServiceId, scContent] = await Promise.all([
    getLocationId(params.location),
    getCarRentalServiceId(),
    getServiceCityContent('local-taxi', params.location),
  ]);

  const localPackages = carRentalServiceId ? await prisma.chauffeur_local_packages.findMany({
    where: {
      isActive: true,
      chauffeur_vehicle_categories: { serviceId: carRentalServiceId, isActive: true },
      ...(locationId ? { OR: [{ locationId }, { locationId: null }] } : { locationId: null }),
    },
    select: {
      id: true, hours: true, kms: true, basePrice: true,
      extraKmCharge: true, isPopular: true,
      chauffeur_vehicle_categories: {
        select: { id: true, name: true, image: true, seatingCapacity: true, acType: true, exampleVehicles: true, isPopular: true },
      },
    },
    orderBy: [
      { chauffeur_vehicle_categories: { displayOrder: 'asc' } },
      { hours: 'asc' },
    ],
  }) : [];

  // Group by hours → { hours: number, kms: number, vehicles: [...] }[]
  const packagesByHour = new Map<number, { hours: number; kms: number; vehicles: typeof localPackages }>();
  for (const pkg of localPackages) {
    const existing = packagesByHour.get(pkg.hours);
    if (!existing) {
      packagesByHour.set(pkg.hours, { hours: pkg.hours, kms: pkg.kms, vehicles: [pkg] });
    } else {
      existing.vehicles.push(pkg);
    }
  }
  const hourGroups = Array.from(packagesByHour.values()).sort((a, b) => a.hours - b.hours);

  const pageFaqs = [
    { question: 'What is the difference between a local taxi and an outstation cab?', answer: 'Local taxi is for city travel — short rides, hourly packages, and same-day use. Outstation cabs are for travel between cities with multi-day options.' },
    { question: 'Is there a fixed rate for local taxi booking?', answer: 'Yes, we offer fixed-rate local taxi packages starting from ₹149/hr for 2 hours. No surge pricing — you pay the package rate.' },
    { question: 'Can I book a local taxi for airport transfer at odd hours?', answer: 'Yes, 24/7 airport transfers are available. Pre-book at least 2 hours in advance for guaranteed availability at any hour.' },
    { question: 'What cars are available for local taxi service?', answer: 'We offer Dzire (Sedan), Swift/WagonR (Hatchback), Ertiga (MUV), and Innova (SUV) for local city taxi packages.' },
  ];

  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/local-taxi" className="hover:text-primary">Local Taxi</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      {/* Booking Hero - Same as Car Rental */}
      <CarRentalBookingHero
        city={locationName}
        citySlug={params.location}
        serviceSlug="car-rental"
        serviceTitle="Local Taxi"
      />

      {/* Why Local Taxi */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Why Choose Local Taxi in {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '💰', title: 'Affordable', desc: 'Starting @₹399' },
              { icon: '⏰', title: 'Flexible Packages', desc: '4hr, 8hr, 12hr' },
              { icon: '🚗', title: 'Multiple Stops', desc: `Around ${locationName}` },
              { icon: '👨‍✈️', title: 'Local Drivers', desc: `Know ${locationName} well` },
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

      {/* Local Packages — dynamic from DB */}
      {hourGroups.length > 0 && (
        <LocalTaxiPackages hourGroups={hourGroups} locationName={locationName} />
      )}

      {/* Perfect Occasions */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Perfect for Activities in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Shopping', icon: '🛍️', desc: `${locationName} malls & markets` },
              { occasion: 'Sightseeing', icon: '📸', desc: 'City tours' },
              { occasion: 'Business Meetings', icon: '💼', desc: 'Office visits' },
              { occasion: 'Running Errands', icon: '📋', desc: 'Multiple stops' },
            ].map((item) => (
              <div key={item.occasion} className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{item.occasion}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Local Taxi Features in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-green-700">Package Includes</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-700 mt-1">✓</span>
                  <span>Professional driver</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-700 mt-1">✓</span>
                  <span>Fuel charges included</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-700 mt-1">✓</span>
                  <span>AC car (Sedan/SUV)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-700 mt-1">✓</span>
                  <span>Multiple pickup/drops in {locationName}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-700 mt-1">✓</span>
                  <span>Full insurance</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-emerald-900">Service Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>Doorstep pickup</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>Clean & sanitized</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>Flexible timings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>24/7 availability</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>Easy online booking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How to Book */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            How to Book Local Taxi in {locationName}
          </h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Choose Package', desc: 'Select 4hr, 8hr or 12hr' },
              { step: '2', title: 'Select Car', desc: 'Sedan or SUV' },
              { step: '3', title: 'Book Online', desc: `Enter pickup location in ${locationName}` },
              { step: '4', title: 'Driver Arrives', desc: 'At your doorstep' },
              { step: '5', title: 'Travel Around', desc: `Visit multiple places in ${locationName}` },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-gray-50 p-4 rounded-lg shadow-md">
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
              citySlug={params.location}
              serviceSlug="local-taxi"
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
            name: `Local Taxi in ${locationName}`,
            description: `Book local hourly taxi in ${locationName}. 4hr, 8hr, 12hr packages available.`,
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: 399,
              highPrice: 1799,
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
        locationSlug={params.location}
        parentSlug="car-rental"
        parentName="Car Rental with Driver"
        currentSlug="local-taxi"
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
