import { Metadata } from 'next';
import { stripPriceFromTitle, stripPricesFromText } from '@/lib/content/strip-prices';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
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
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';
import { getServiceLocationRating } from '@/lib/services/cached-service-lookups';
import { StateServicePage } from '@/components/location/StateServicePage';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { ServiceExpandingHero } from '@/components/services/ServiceExpandingHero';
import { ServiceLaunchBenefits } from '@/components/services/ServiceLaunchBenefits';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { CITY_SEO } from '@/data/city-seo-content';
import { RelatedServices } from '@/components/services/RelatedServices';
import { ServiceAreasSection } from '@/components/location/ServiceAreasSection';
import { CrossServiceLinks } from '@/components/location/CrossServiceLinks';
import { AutoRentalSchema } from '@/components/seo/schemas';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections, hasSectionMatching } from '@/components/seo/ServiceCitySections';

const CAR_RENTAL_FALLBACK_FAQS = [
  { question: 'How is car rental priced?', answer: 'Self-drive is quoted per day, chauffeur-driven per day or per package, and outstation trips per kilometre. What you pay depends on the vehicle type, city and duration — share your trip on TransRentals and verified vendors send you their quotes.' },
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

// Generate static params for ALL active cities (not just service-enabled ones)
export async function generateStaticParams() {
  if (process.env.SKIP_DATABASE_CALLS === '1') return [];
  try {
    const locations = await prisma.locations.findMany({
      where: { type: { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] }, isActive: true },
      select: { slug: true },
    });
    return locations.map((loc) => ({ location: loc.slug }));
  } catch {
    return getServiceLocations('car-rental');
  }
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  // Fall back to a humanized slug for cities not in the curated list — otherwise
  // metadata is left without a description and inherits the generic site-wide
  // one from the root layout, producing mass duplicate meta descriptions.
  const locationName = city?.name ?? params.location.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`car-rental:${params.location.toLowerCase()}`),
    getServiceCityContent('car-rental', params.location),
  ]);
  return {
    title: stripPriceFromTitle(scContent?.metaTitle) || stripPriceFromTitle(_seoDb?.metaTitle) || `Car Rental in ${locationName} | Chauffeur-Driven Cars | TransRentals`,
    description: stripPricesFromText(scContent?.metaDescription) || stripPricesFromText(_seoDb?.metaDescription) || `Hire a car with driver in ${locationName}. Swift, Innova, Creta, Ertiga & more. Local, outstation & airport transfers available. Chauffeur-driven cars with doorstep pickup. Book car rental in ${locationName} now!`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `car rental ${locationName.toLowerCase()}`,
      `car rental in ${locationName.toLowerCase()}`,
      `car on rent in ${locationName.toLowerCase()}`,
      `rent a car ${locationName.toLowerCase()}`,
      `car hire ${locationName.toLowerCase()}`,
      `cab service ${locationName.toLowerCase()}`,
      `taxi rental ${locationName.toLowerCase()}`,
      `outstation cab ${locationName.toLowerCase()}`,
      `innova on rent ${locationName.toLowerCase()}`,
      `creta on rent ${locationName.toLowerCase()}`,
      `swift on rent ${locationName.toLowerCase()}`,
      `cab rental ${locationName.toLowerCase()}`,
      ...(city?.keywords || []).map(k => `car rental ${k}`),
    ],
    openGraph: {
      title: `Car Rental in ${locationName} - With Driver | TransRentals`,
      description: `Hire cars with driver in ${locationName}. Swift, Innova, Creta, Ertiga & more. Local, outstation & airport transfers. Best prices guaranteed.`,
      type: 'website',
      url: `https://transrentals.in/car-rental/${params.location.toLowerCase()}`,
      images: [
        {
          url: 'https://transrentals.in/images/og/car-rental.jpg',
          width: 1200,
          height: 630,
          alt: `Car Rental in ${locationName} - TransRentals`,
        },
      ],
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Car Rental in ${locationName} - TransRentals`,
      description: `Rent cars in ${locationName}. Swift, Innova, Creta & more. Best prices guaranteed.`,
      images: ['https://transrentals.in/images/og/car-rental.jpg'],
    },
    alternates: {
      canonical: `https://transrentals.in/car-rental/${params.location.toLowerCase()}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
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
        locationId: true,
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

    // Group packages by category. A category can have both a location-specific
    // and a global (locationId: null) package for the same hours/km combo — keep
    // only the location-specific one when both exist, instead of showing duplicates.
    const categoriesWithPackages = categories.map((category) => {
      const categoryPackages = packagesData.filter((p) => p.vehicleCategoryId === category.id);
      const byHoursKms = new Map<string, (typeof categoryPackages)[number]>();
      for (const pkg of categoryPackages) {
        const key = `${pkg.hours}-${pkg.kms}`;
        const existing = byHoursKms.get(key);
        if (!existing || (existing.locationId === null && pkg.locationId !== null)) {
          byHoursKms.set(key, pkg);
        }
      }
      return {
        ...category,
        packages: Array.from(byHoursKms.values()).map(({ locationId, ...pkg }) => pkg),
      };
    }).filter((category) => category.packages.length > 0); // Only include categories with packages

    return categoriesWithPackages;
  } catch (error) {
    console.error('Error fetching packages:', error);
    return [];
  }
}

const EXPANDING_FAQS = [
  { question: 'What kind of cars can I book?', answer: 'Hatchbacks, sedans, SUVs and MUVs â Swift, Dzire, Innova, Creta, Ertiga and more, with a verified chauffeur.' },
  { question: 'When will car rental open in my city?', answer: 'We onboard operators city by city and a city goes live as soon as verified operators are ready there. Until then you can book in the nearby cities listed above.' },
  { question: 'Is a driver included?', answer: 'Yes. Every chauffeur-driven booking on TransRentals comes with a background-checked professional driver.' },
];

/**
 * What a city sees while no operator is live there yet: no booking form and no
 * quoted rate, just the nearest cities that are bookable today.
 */
function ExpandingCityPage({ cityName, citySlug }: { cityName: string; citySlug: string }) {
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
      <ServiceExpandingHero cityName={cityName} serviceLabel="car rentals" />
      <div id="nearby-cities" className="scroll-mt-4">
        <NearbyActiveCities
          currentCitySlug={citySlug}
          serviceSlug="car-rental"
          serviceName="Car Rental"
        />
      </div>
      <ServiceLaunchBenefits
        cityName={cityName}
        vehicleNoun="car"
        selectionDesc="Hatchbacks, sedans, SUVs and MUVs â with a verified chauffeur."
      />
      <FAQSection service="car-rental" location={cityName} customFaqs={EXPANDING_FAQS} />
    </>
  );
}

export default async function CarRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('car-rental', params.location, { comingSoonIfUnavailable: true });
  if (pageContext.type === 'redirect') {
    if (COMING_SOON_SLUGS.has(params.location)) {
      const cityName = getCityBySlug(params.location)?.name ??
        params.location.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return <ExpandingCityPage cityName={cityName} citySlug={params.location.toLowerCase()} />;
    }
    permanentRedirect(pageContext.to);
  }
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="car-rental" serviceName="Car Rental" />;
  if (pageContext.type === 'coming-soon') {
    return <ExpandingCityPage cityName={pageContext.city.name} citySlug={params.location.toLowerCase()} />;
  }
  const city = pageContext.city;
  const locationName = city.name;

  // Fetch packages, vendor rating, and DB-managed SEO content
  const [categories, liveRating, scContent] = await Promise.all([
    getPackagesForLocation(params.location),
    getServiceLocationRating('car-rental', params.location),
    getServiceCityContent('car-rental', params.location),
  ]);
  // FAQs: prefer DB-managed content, fall back to static city data
  const cityFAQs = scContent?.faqs.length
    ? scContent.faqs
    : (CITY_SEO[params.location]?.serviceFAQs?.['car-rental'] || []);
  // The admin block editor renders its own Why Us / Other Services / FAQ
  // blocks. Where the city has one, the hardcoded section below is skipped
  // so the page doesn't say the same thing twice.
  const adminCoversWhyUs = hasSectionMatching(scContent?.sectionsConfig, /why[-\s_]?(choose|rent|us)/i);
  const adminCoversOtherServices = hasSectionMatching(scContent?.sectionsConfig, /services?[-\s_]?(offered|available)|other[-\s_]?services/i);
  const adminCoversFaqs = hasSectionMatching(scContent?.sectionsConfig, /faq/i);

  const displayFAQs = cityFAQs.length > 0
    ? cityFAQs
        .map((faq) => ({ question: faq.q, answer: stripPricesFromText(faq.a) }))
        .filter((faq) => faq.answer)
    : CAR_RENTAL_FALLBACK_FAQS;

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
        citySlug={params.location.toLowerCase()}
        serviceSlug="car-rental"
        serviceTitle="Car Rental"
        h1Text={stripPricesFromText(scContent?.h1Heading) || undefined}
        headingLine1="Car Rental in"
        headingLine2={locationName}
        heroVariant="aurora"
        heroImage="/images/sections/car-rental-hero-bg.png"
      />

      {/* Packages Grid - Fetched from Database */}
      <PackagesGrid
        hidePrices
        categories={categories}
        title={`Car Rental Packages in ${locationName}`}
        locationName={locationName}
        locationSlug={params.location.toLowerCase()}
        serviceSlug="car-rental"
      />

      {!adminCoversWhyUs && (
        <WhyRentHere locationName={locationName} />
      )}

      <NearbyLocations
        locationSlug={params.location.toLowerCase()}
        service="car-rental"
      />

      <ServiceAreasSection
        hidePrices
        serviceSlug="car-rental"
        citySlug={params.location.toLowerCase()}
        cityName={locationName}
        serviceName="Car Rental"
      />

      {!adminCoversOtherServices && (
        <CrossServiceLinks
          citySlug={params.location.toLowerCase()}
          cityName={locationName}
          currentServiceSlug="car-rental"
        />
      )}

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} hidePrices />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="car-rental"
        parentName="Car Rental"
        currentSlug="car-rental"
        siblings={[
          { slug: 'self-drive-car-rentals', name: 'Self Drive' },
          { slug: 'luxury-car-rental', name: 'Luxury Cars' },
          { slug: 'hourly-car-rental', name: 'Hourly Rental' },
          { slug: 'one-way-cab', name: 'One Way Cab' },
        ]}
      />

      {/* AutoRental Schema — schema.org/AutoRental subtype; no Indian competitor uses this */}
      <AutoRentalSchema
        hidePrices
        name={`Car Rental in ${locationName} — TransRentals`}
        description={`Rent cars in ${locationName}. Self-drive and chauffeur-driven options for local, outstation, and corporate travel.`}
        city={locationName}
        citySlug={params.location.toLowerCase()}
        serviceSlug="car-rental"
        rating={liveRating?.ratingValue}
        reviewCount={liveRating?.reviewCount}
      />
      {!adminCoversFaqs && (
        <FAQSection service="car-rental" location={locationName} customFaqs={displayFAQs} />
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: displayFAQs.map((faq) => ({
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
