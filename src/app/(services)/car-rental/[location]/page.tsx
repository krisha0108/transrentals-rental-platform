import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { PackagesGrid } from '@/components/location/PackagesGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { CityContentSection } from '@/components/location/CityContentSection';
import { prisma } from '@/lib/db/prisma';
import { resolveServicePage } from '@/lib/services/service-availability';
import { getCachedServiceBySlug } from '@/lib/services/cached-service-lookups';
import { getServiceLocations } from '@/lib/services/service-locations';
import { StateServicePage } from '@/components/location/StateServicePage';
import { ComingSoonHero } from '@/components/services/ComingSoonHero';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { CITY_SEO } from '@/data/city-seo-content';

const CAR_RENTAL_FALLBACK_FAQS = [
  { question: 'What is the cost of car rental per day?', answer: 'Self-drive hatchback rentals start from ₹999/day. Chauffeur-driven sedans start from ₹1,500/day. SUVs start from ₹2,500/day. Outstation trips are charged per km (₹12–18/km). Rates vary by vehicle type and city — get a free quote on TransRentals for exact pricing.' },
  { question: 'What documents are required to rent a car?', answer: 'For self-drive: valid driving licence (minimum 1 year old), Aadhaar Card or Passport, and a refundable security deposit. For chauffeur-driven: any valid government ID — no DL required from the passenger. International tourists need an IDP (International Driving Permit).' },
  { question: 'Is self-drive or chauffeur-driven better for outstation trips?', answer: 'Chauffeur-driven is better for outstation trips — the driver handles toll collection, navigation, and fatigue, especially on long routes. Self-drive is ideal if you want maximum flexibility and privacy. Both options are available on TransRentals.' },
  { question: 'Can I cancel or modify my car rental booking?', answer: 'Yes, free cancellation is available up to 24 hours before the scheduled pickup time. For modifications (date/time changes), contact the vendor directly via TransRentals. Cancellations within 24 hours may attract a partial charge depending on the vendor\'s policy.' },
  { question: 'Are outstation trips allowed with rental cars?', answer: 'Yes, most TransRentals vendors permit outstation travel. Confirm the specific outstation policy and any additional interstate permit charges at the time of booking. One-way outstation rentals (pay only for the distance to destination, not the return) are available on most routes.' },
];

const COMING_SOON_SLUGS = new Set([
  'burhanpur',
]);

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only enabled locations
export async function generateStaticParams() {
  return getServiceLocations('car-rental');
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);

  if (!city) {
    return {
      title: 'Car Rental | TransRentals',
    };
  }

  const locationName = city.name;

  const _seoDb = await resolvePageMeta(`car-rental:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Car Rental in ${locationName} | Starting ₹999/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Rent cars in ${locationName}. Self-drive cars, SUVs, sedans, hatchbacks available. Book online. Best prices guaranteed. 24/7 support. Verified vendors.`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `car rental ${locationName.toLowerCase()}`,
      `car on rent in ${locationName.toLowerCase()}`,
      `self drive car ${locationName.toLowerCase()}`,
      `rent a car ${locationName.toLowerCase()}`,
      `car hire ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `car rental ${k}`),
    ],
    openGraph: {
      title: `Car Rental in ${locationName} - Starting ₹999/Day`,
      description: `Book self-drive cars in ${locationName}. Wide range of hatchbacks, sedans, SUVs, and luxury cars. Instant booking.`,
      url: `https://transrentals.in/car-rental/${params.location}`,
    },
    alternates: {
      canonical: `https://transrentals.in/car-rental/${params.location}`,
    },
  };
}

// Fetch packages for car-rental service in the given location
async function getPackagesForLocation(locationSlug: string) {
  try {
    // Get car-rental service (cached)
    const carService = await getCachedServiceBySlug('car-rental');

    if (!carService) {
      return [];
    }

    // Get location by slug
    const location = await prisma.locations.findFirst({
      where: { slug: locationSlug },
      select: { id: true },
    });

    // Get all vehicle categories for car-rental service
    const categories = await prisma.chauffeur_vehicle_categories.findMany({
      where: {
        serviceId: carService.id,
        isActive: true,
      },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        seatingCapacity: true,
        image: true,
        exampleVehicles: true,
        acType: true,
        luggageCapacity: true,
        fuelType: true,
      },
    });

    if (categories.length === 0) {
      return [];
    }

    // Fetch packages for each category
    // Packages can be either location-specific (locationId matches) or global (locationId is null)
    const packagesData = await prisma.chauffeur_local_packages.findMany({
      where: {
        vehicleCategoryId: { in: categories.map((c) => c.id) },
        isActive: true,
        OR: [
          { locationId: location?.id || 'no-match' }, // Location-specific packages
          { locationId: null }, // Global packages (available in all locations)
        ],
      },
      orderBy: [{ displayOrder: 'asc' }, { hours: 'asc' }],
      select: {
        id: true,
        vehicleCategoryId: true,
        name: true,
        hours: true,
        kms: true,
        basePrice: true,
        extraKmCharge: true,
        extraHourCharge: true,
        nightChargesApply: true,
        nightChargeAmount: true,
        isPopular: true,
      },
    });

    // Group packages by category
    const categoriesWithPackages = categories.map((category) => ({
      ...category,
      packages: packagesData.filter((p) => p.vehicleCategoryId === category.id),
    })).filter((category) => category.packages.length > 0); // Only include categories with packages

    return categoriesWithPackages;
  } catch (error) {
    console.error('Error fetching packages:', error);
    return [];
  }
}

export default async function CarRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('car-rental', params.location, { comingSoonIfUnavailable: true });
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
                <a href="/car-rental" className="hover:text-primary">Car Rental</a>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">{cityName}</span>
              </nav>
            </div>
          </div>
          <ComingSoonHero
            city={cityName}
            citySlug={params.location}
            serviceSlug="car-rental"
            serviceName="Car Rental"
            themeColor="blue"
          />
        </>
      );
    }
    notFound();
  }
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="car-rental" serviceName="Car Rental" />;
  if (pageContext.type === 'coming-soon') {
    const cityName = pageContext.city.name;
    return (
      <>
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/car-rental" className="hover:text-primary">Car Rental</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{cityName}</span>
            </nav>
          </div>
        </div>
        <ComingSoonHero
          city={cityName}
          citySlug={params.location}
          serviceSlug="car-rental"
          serviceName="Car Rental"
          themeColor="emerald"
        />
        <NearbyActiveCities
          currentCitySlug={params.location}
          serviceSlug="car-rental"
          serviceName="Car Rental"
        />
      </>
    );
  }
  const city = pageContext.city;
  const locationName = city.name;

  // Fetch packages from database
  const categories = await getPackagesForLocation(params.location);
  const cityFAQs = CITY_SEO[params.location]?.serviceFAQs?.['car-rental'] || [];

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/car-rental" className="hover:text-primary">Car Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <CarRentalBookingHero
        city={locationName}
        citySlug={params.location}
        serviceSlug="car-rental"
        serviceTitle="Car Rental"
      />

      {/* Packages Grid - Fetched from Database */}
      <PackagesGrid
        categories={categories}
        title={`Car Rental Packages in ${locationName}`}
        locationName={locationName}
        locationSlug={params.location}
        serviceSlug="car-rental"
      />

      <WhyRentHere locationName={locationName} />

      {/* Popular Routes */}
      <PopularRoutes
        location={locationName}
        locationSlug={params.location}
        serviceSlug="car-rental"
      />

      {cityFAQs.length === 0 && (
        <FAQSection
          service="car-rental"
          location={locationName}
          customFaqs={CAR_RENTAL_FALLBACK_FAQS}
        />
      )}

      <NearbyLocations
        locationSlug={params.location}
        service="car-rental"
      />

      <CityContentSection
        citySlug={params.location}
        serviceSlug="car-rental"
        cityName={locationName}
        stateCode={city.stateCode}
      />

      {/* LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: `Car Rental in ${locationName} — TransRentals`,
            description: `Rent cars in ${locationName}. Self-drive and chauffeur-driven options for local, outstation, and corporate travel.`,
            url: `https://transrentals.in/car-rental/${params.location}`,
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
              : CAR_RENTAL_FALLBACK_FAQS.map((faq) => ({
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
