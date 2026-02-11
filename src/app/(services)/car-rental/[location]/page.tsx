import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_CITIES, STATIC_CITIES, getCityBySlug } from '@/data/indian-cities';
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { PackagesGrid } from '@/components/location/PackagesGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { ServiceComingSoon } from '@/components/location/ServiceComingSoon';
import { prisma } from '@/lib/db/prisma';
import { isServiceAvailableInLocation, getNearbyAvailableLocations } from '@/lib/services/service-availability';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only enabled locations
export async function generateStaticParams() {
  try {
    // Skip database calls during CI/CD build
    if (process.env.SKIP_DATABASE_CALLS === '1') {
      console.log('[car-rental] Skipping database calls during build');
      return [];
    }

    // Fetch enabled locations from database
    const service = await prisma.services.findUnique({
      where: { slug: 'car-rental' },
      include: {
        service_locations: {
          where: { isActive: true },
          include: {
            locations: {
              select: { slug: true, name: true }
            }
          }
        }
      }
    });

    if (!service) {
      console.log('[car-rental] Service not found in database');
      return [];
    }

    const locations = service.service_locations.map((sl) => ({
      location: sl.locations.slug,
    }));

    console.log(`[car-rental] Generating ${locations.length} location pages from database`);
    return locations;
  } catch (error) {
    console.error('[car-rental] Error fetching locations:', error);
    // Fallback to empty array if database error
    return [];
  }
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

  return {
    title: `Car Rental in ${locationName} | Self Drive Cars @₹999/Day | TransRentals`,
    description: `Rent cars in ${locationName}. Self-drive cars, SUVs, sedans, hatchbacks available. Book online. Best prices guaranteed. 24/7 support. Verified vendors.`,
    keywords: [
      `car rental ${locationName.toLowerCase()}`,
      `car on rent in ${locationName.toLowerCase()}`,
      `self drive car ${locationName.toLowerCase()}`,
      `rent a car ${locationName.toLowerCase()}`,
      `car hire ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `car rental ${k}`),
    ],
    openGraph: {
      title: `Car Rental in ${locationName} - Starting @₹999/Day`,
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
    // Get car-rental service
    const carService = await prisma.services.findFirst({
      where: { slug: 'car-rental' },
      select: { id: true },
    });

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
  const city = getCityBySlug(params.location);

  if (!city) {
    notFound();
  }

  const locationName = city.name;

  // Check if car-rental service is available in this location
  const isAvailable = await isServiceAvailableInLocation('car-rental', params.location);

  // If service not available, show coming soon page
  if (!isAvailable) {
    const nearbyLocations = await getNearbyAvailableLocations('car-rental', params.location, 6);
    return (
      <ServiceComingSoon
        serviceName="Car Rental"
        serviceSlug="car-rental"
        locationName={locationName}
        locationSlug={params.location}
        nearbyLocations={nearbyLocations}
      />
    );
  }

  // Fetch packages from database
  const categories = await getPackagesForLocation(params.location);

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

      <FAQSection service="car-rental" location={locationName} />

      <NearbyLocations
        locationSlug={params.location}
        service="car-rental"
      />

      {/* Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: `Car Rental in ${locationName}`,
            description: `Rent cars in ${locationName}. Self-drive and with driver options available.`,
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: categories.length > 0
                ? Math.min(...categories.flatMap(c => c.packages.map(p => p.basePrice))).toString()
                : '999',
              highPrice: categories.length > 0
                ? Math.max(...categories.flatMap(c => c.packages.map(p => p.basePrice))).toString()
                : '9999',
              offerCount: categories.flatMap(c => c.packages).length > 0
                ? `${categories.flatMap(c => c.packages).length}+`
                : '50+',
            },
            provider: {
              '@type': 'Organization',
              name: 'TransRentals',
              url: 'https://transrentals.in',
            },
          }),
        }}
      />
    </div>
  );
}
