import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db/prisma';

interface PageProps {
  params: {
    vehicle: string;
  };
  searchParams: {
    location?: string;
  };
}

// Unified vehicle data structure
interface VehicleData {
  id: string;
  name: string;
  slug: string;
  brand: string;
  brandLogo?: string | null;
  vehicleType: string;
  basePrice: number;
  shortDesc?: string | null;
  description?: string | null;
  specs: Record<string, any>;
  features: string[];
  images: string[];
  primaryImage?: string | null;
  seatingCapacity?: number | null;
  fuelType?: string | null;
  transmission?: string | null;
  rating: number;
  availableLocations: Array<{
    id: string;
    name: string;
    slug: string;
    state?: string | null;
    dailyRate?: number;
  }>;
  source: 'legacy' | 'vendor';
  vendorName?: string;
}

// Get vehicle data - tries legacy fleet first, then vendor_fleets
async function getVehicleData(identifier: string, locationSlug?: string): Promise<VehicleData | null> {
  // First try legacy fleet table by slug
  const legacyFleet = await prisma.fleet.findFirst({
    where: { slug: identifier, isActive: true },
    include: {
      fleet_categories: true,
      fleet_location_rates: {
        where: { isActive: true },
        include: { fleet_locations: true },
        orderBy: { dailyRate: 'asc' },
      },
      fleet_availability: {
        where: { isAvailable: true },
        include: { fleet_locations: true },
      },
    },
  });

  if (legacyFleet) {
    const features = Array.isArray(legacyFleet.features) ? (legacyFleet.features as string[]) : [];
    const specs = (legacyFleet.specs as unknown as Record<string, any>) || {};

    return {
      id: legacyFleet.id,
      name: legacyFleet.name,
      slug: legacyFleet.slug,
      brand: legacyFleet.brand,
      vehicleType: legacyFleet.vehicleType,
      basePrice: legacyFleet.basePrice,
      shortDesc: legacyFleet.shortDesc,
      description: legacyFleet.description,
      specs,
      features,
      images: legacyFleet.images ? JSON.parse(legacyFleet.images as string) : [],
      primaryImage: legacyFleet.primaryImage,
      rating: 4.8,
      availableLocations: legacyFleet.availabilityType === 'ALL_INDIA'
        ? (await prisma.fleet_locations.findMany({
            where: { isActive: true },
            orderBy: [{ tier: 'asc' }, { displayOrder: 'asc' }],
            take: 20,
          })).map(loc => ({
            id: loc.id,
            name: loc.name,
            slug: loc.slug,
            state: loc.state,
            dailyRate: legacyFleet.fleet_location_rates.find(r => r.fleet_locations.id === loc.id)?.dailyRate || legacyFleet.basePrice,
          }))
        : legacyFleet.fleet_availability
            .filter(a => a.isAvailable)
            .map(a => ({
              id: a.fleet_locations.id,
              name: a.fleet_locations.name,
              slug: a.fleet_locations.slug,
              state: a.fleet_locations.state,
              dailyRate: legacyFleet.fleet_location_rates.find(r => r.fleet_locations.id === a.fleet_locations.id)?.dailyRate || legacyFleet.basePrice,
            })),
      source: 'legacy',
    };
  }

  // Try vendor_fleets by ID
  const vendorFleet = await prisma.vendor_fleets.findFirst({
    where: {
      OR: [
        { id: identifier },
        { vehicle_models: { slug: identifier } },
      ],
      isActive: true,
      isAvailable: true,
    },
    include: {
      brands: { select: { name: true, logo: true } },
      vehicle_models: { select: { name: true, slug: true, sideImage: true, seatingCapacity: true, fuelType: true, transmission: true, basePricePerDay: true } },
      chauffeur_vehicle_categories: { select: { name: true, slug: true } },
      services: { select: { name: true, slug: true } },
      vendors: { select: { businessName: true } },
      vendor_fleet_locations: {
        where: { isActive: true },
        include: {
          locations: {
            select: { id: true, name: true, slug: true, parentId: true },
          },
        },
      },
      fleet_pricing: {
        where: { isActive: true },
        include: {
          locations: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });

  if (vendorFleet) {
    // Parse images
    let images: string[] = [];
    try {
      if (vendorFleet.images) {
        images = JSON.parse(vendorFleet.images);
      }
    } catch (e) {
      images = [];
    }

    // Parse amenities/features
    let features: string[] = [];
    try {
      if (vendorFleet.amenities) {
        features = JSON.parse(vendorFleet.amenities);
      }
    } catch (e) {
      features = [];
    }

    // Get model base price as fallback
    const modelBasePrice = vendorFleet.vehicle_models?.basePricePerDay || 2499;

    // Get location-specific pricing
    const availableLocations = vendorFleet.vendor_fleet_locations.map((vfl: any) => {
      const pricing = vendorFleet.fleet_pricing.find((p: any) => p.locationId === vfl.locationId);
      return {
        id: vfl.locations.id,
        name: vfl.locations.name,
        slug: vfl.locations.slug,
        state: null, // Parent state fetched separately if needed
        dailyRate: pricing?.basePrice || modelBasePrice,
      };
    });

    // Get default price: fleet_pricing > vehicle_models.basePricePerDay > fallback
    const defaultPricing = locationSlug
      ? vendorFleet.fleet_pricing.find((p: any) => p.locations?.slug === locationSlug)
      : vendorFleet.fleet_pricing[0];
    const basePrice = (defaultPricing as any)?.basePrice || modelBasePrice;

    return {
      id: vendorFleet.id,
      name: vendorFleet.vehicleName || vendorFleet.vehicle_models?.name || 'Vehicle',
      slug: vendorFleet.vehicle_models?.slug || vendorFleet.id,
      brand: vendorFleet.brands?.name || 'Unknown',
      brandLogo: vendorFleet.brands?.logo,
      vehicleType: vendorFleet.services?.name || 'Vehicle',
      basePrice,
      shortDesc: vendorFleet.vehicleDescription || null,
      description: vendorFleet.vehicleDescription,
      specs: {
        seating: vendorFleet.seatingCapacity || vendorFleet.vehicle_models?.seatingCapacity,
        fuelType: vendorFleet.fuelType || vendorFleet.vehicle_models?.fuelType,
        transmission: vendorFleet.transmission || vendorFleet.vehicle_models?.transmission,
        color: vendorFleet.color,
        year: vendorFleet.yearOfManufacture,
        luggage: vendorFleet.luggageCapacity,
      },
      features,
      images,
      primaryImage: images[0] || vendorFleet.vehicle_models?.sideImage,
      seatingCapacity: vendorFleet.seatingCapacity || vendorFleet.vehicle_models?.seatingCapacity,
      fuelType: vendorFleet.fuelType || vendorFleet.vehicle_models?.fuelType,
      transmission: vendorFleet.transmission || vendorFleet.vehicle_models?.transmission,
      rating: vendorFleet.avgRating || 4.5,
      availableLocations,
      source: 'vendor',
      vendorName: vendorFleet.vendors?.businessName,
    };
  }

  return null;
}

// Generate metadata for SEO
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const vehicle = await getVehicleData(params.vehicle, searchParams.location);

  if (!vehicle) {
    return { title: 'Vehicle Not Found | TransRentals' };
  }

  return {
    title: `${vehicle.name} on Rent | Starting @₹${vehicle.basePrice}/Day | TransRentals`,
    description: `Rent ${vehicle.name} across India. ${vehicle.vehicleType} with ${vehicle.seatingCapacity ? `${vehicle.seatingCapacity} seats` : 'comfortable seating'}. Best prices. 24/7 support.`,
    keywords: [
      `${vehicle.name.toLowerCase()} on rent`,
      `${vehicle.name.toLowerCase()} rental`,
      `rent ${vehicle.name.toLowerCase()}`,
      `${vehicle.brand.toLowerCase()} rental`,
    ],
    openGraph: {
      title: `${vehicle.name} on Rent - Starting @₹${vehicle.basePrice}/Day`,
      description: `Rent ${vehicle.name}. ${vehicle.features.slice(0, 4).join(', ')}.`,
      url: `https://transrentals.in/fleet/${params.vehicle}`,
      images: vehicle.primaryImage ? [vehicle.primaryImage] : undefined,
    },
  };
}

export default async function FleetVehiclePage({ params, searchParams }: PageProps) {
  const vehicle = await getVehicleData(params.vehicle, searchParams.location);

  if (!vehicle) {
    notFound();
  }

  const locationName = searchParams.location
    ? vehicle.availableLocations.find(l => l.slug === searchParams.location)?.name
    : null;

  return (
    <>
      {/* Vehicle Hero */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="container-custom relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <span className="text-sm font-medium">{vehicle.brand}</span>
                <span className="text-white/60">•</span>
                <span className="text-sm font-medium">{vehicle.vehicleType}</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">{vehicle.name}</h1>
              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-sm text-white/80 uppercase tracking-wide">
                  {locationName ? `Price in ${locationName}` : 'Starting from'}
                </span>
                <span className="text-4xl md:text-5xl font-bold">₹{vehicle.basePrice}</span>
                <span className="text-xl text-white/80">/day</span>
              </div>
              {vehicle.shortDesc && (
                <p className="text-lg text-white/90 mb-6">{vehicle.shortDesc}</p>
              )}
              <div className="flex flex-wrap gap-3 mb-8">
                {vehicle.seatingCapacity && (
                  <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/30">
                    {vehicle.seatingCapacity} Seater
                  </span>
                )}
                {vehicle.fuelType && (
                  <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/30">
                    {vehicle.fuelType}
                  </span>
                )}
                {vehicle.transmission && (
                  <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/30">
                    {vehicle.transmission}
                  </span>
                )}
                {vehicle.features.slice(0, 2).map((feature: string) => (
                  <span key={feature} className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/30">
                    {feature}
                  </span>
                ))}
              </div>
              <Link
                href="#cities"
                className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
              >
                View Available Cities
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            <div className="relative">
              {vehicle.primaryImage ? (
                <div className="relative h-80 rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src={vehicle.primaryImage}
                    alt={vehicle.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/20 shadow-2xl">
                  <div className="text-9xl text-center mb-6">
                    {vehicle.vehicleType.toLowerCase().includes('bus') ? '🚌' : vehicle.vehicleType.toLowerCase().includes('bike') ? '🏍️' : '🚗'}
                  </div>
                  <div className="text-center">
                    <p className="text-white/90 text-lg">Available in</p>
                    <p className="text-3xl font-bold">{vehicle.availableLocations.length} Cities</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Specifications */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Specifications</h2>
            <p className="text-xl text-gray-600">Technical details you should know</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicle.specs.seating && (
              <div className="group bg-white p-8 rounded-2xl text-center shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-primary-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  👥
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Seating Capacity</h3>
                <p className="text-gray-700 font-medium">{vehicle.specs.seating} Persons</p>
              </div>
            )}
            {vehicle.specs.fuelType && (
              <div className="group bg-white p-8 rounded-2xl text-center shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-primary-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  ⛽
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Fuel Type</h3>
                <p className="text-gray-700 font-medium">{vehicle.specs.fuelType}</p>
              </div>
            )}
            {vehicle.specs.transmission && (
              <div className="group bg-white p-8 rounded-2xl text-center shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-primary-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  🔧
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Transmission</h3>
                <p className="text-gray-700 font-medium">{vehicle.specs.transmission}</p>
              </div>
            )}
            {vehicle.specs.year && (
              <div className="group bg-white p-8 rounded-2xl text-center shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-primary-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  📅
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Year of Manufacture</h3>
                <p className="text-gray-700 font-medium">{vehicle.specs.year}</p>
              </div>
            )}
            {vehicle.specs.luggage && (
              <div className="group bg-white p-8 rounded-2xl text-center shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-primary-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  🧳
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Luggage Capacity</h3>
                <p className="text-gray-700 font-medium">{vehicle.specs.luggage} bags</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      {vehicle.features.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container-custom max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Features & Amenities</h2>
              <p className="text-xl text-gray-600">What's included in your rental</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {vehicle.features.map((feature: string) => (
                <span
                  key={feature}
                  className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-6 py-3 rounded-full text-sm font-medium border border-primary-200"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Available Cities */}
      <section id="cities" className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Rent {vehicle.name} in Popular Cities
            </h2>
            <p className="text-xl text-gray-600">
              Available in {vehicle.availableLocations.length} {vehicle.availableLocations.length === 1 ? 'city' : 'cities'}
            </p>
          </div>
          {vehicle.availableLocations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <p className="text-gray-500 text-lg">No locations available currently.</p>
              <p className="text-gray-400 text-sm mt-2">Please check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {vehicle.availableLocations.slice(0, 20).map((city) => (
                <Link
                  key={city.id}
                  href={`/fleet/${vehicle.id}?location=${city.slug}`}
                  className="group bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-primary-400 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white text-xl shadow-md group-hover:scale-110 transition-transform">
                      📍
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-primary-600 transition">
                    {city.name}
                  </h3>
                  {city.state && <p className="text-sm text-gray-600 mb-3">{city.state}</p>}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Starting from</span>
                    <span className="font-bold text-primary-600">₹{city.dailyRate}/day</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose */}
      <section className="py-20 bg-white">
        <div className="container-custom max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Rent {vehicle.name} from TransRentals?
            </h2>
            <p className="text-xl text-gray-600">Experience the best vehicle rental service in India</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '✓', title: 'Verified Vehicles', desc: 'All vehicles are verified and well-maintained', color: 'from-green-500 to-emerald-600' },
              { icon: '💰', title: 'Best Prices', desc: 'Competitive rates with no hidden charges', color: 'from-blue-500 to-cyan-600' },
              { icon: '🔒', title: 'Trusted Service', desc: 'Safe and reliable rental experience', color: 'from-purple-500 to-violet-600' },
              { icon: '📞', title: '24/7 Support', desc: 'Round the clock customer support', color: 'from-orange-500 to-red-600' },
            ].map((item) => (
              <div key={item.title} className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-primary-300 hover:-translate-y-1">
                <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  {item.icon}
                </div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">Everything you need to know about renting</p>
          </div>
          <div className="space-y-4">
            {[
              {
                q: `What is the rental price of ${vehicle.name}?`,
                a: `${vehicle.name} is available for rent starting from ₹${vehicle.basePrice}/day. Prices may vary based on location, duration, and season.`,
              },
              {
                q: `What documents are required to rent ${vehicle.name}?`,
                a: `You need a valid driving license, Aadhar card/PAN card for ID proof, and a refundable security deposit.`,
              },
              {
                q: `Is ${vehicle.name} available for outstation trips?`,
                a: `Yes, ${vehicle.name} is available for both local and outstation trips, including one-way and round trips.`,
              },
              {
                q: `What is included in the rental price?`,
                a: `The rental price includes the vehicle, driver (if applicable), basic insurance, and roadside assistance. Fuel and toll charges are extra.`,
              },
            ].map((faq, idx) => (
              <div key={idx} className="group bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-primary-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                    Q
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg md:text-xl text-gray-900 mb-3">{faq.q}</h3>
                    <p className="text-gray-700 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: vehicle.name,
            brand: {
              '@type': 'Brand',
              name: vehicle.brand,
            },
            description: `${vehicle.name} for rent. ${vehicle.features.join(', ')}.`,
            offers: {
              '@type': 'Offer',
              price: vehicle.basePrice,
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
            },
          }),
        }}
      />
    </>
  );
}
