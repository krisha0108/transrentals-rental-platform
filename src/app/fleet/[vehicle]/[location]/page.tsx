import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LocationHero } from '@/components/location/LocationHero';
import { DynamicChatBookingHero } from '@/components/booking/DynamicChatBookingHero';
import { prisma } from '@/lib/db/prisma';

interface PageProps {
  params: {
    vehicle: string;
    location: string;
  };
}

// Get vehicle with location-specific rate
async function getVehicleWithLocation(vehicleSlug: string, locationSlug: string) {
  const vehicle = await prisma.fleet.findFirst({
    where: { slug: vehicleSlug, isActive: true },
    include: {
      fleet_categories: true,
      fleet_location_rates: {
        where: {
          fleet_locations: { slug: locationSlug },
          isActive: true,
        },
        include: { fleet_locations: true },
      },
      fleet_availability: {
        where: {
          fleet_locations: { slug: locationSlug },
        },
        include: { fleet_locations: true },
      },
    },
  });

  if (!vehicle) return null;

  const location = await prisma.fleet_locations.findFirst({
    where: { slug: locationSlug, isActive: true },
  });

  if (!location) return null;

  // Check availability for SPECIFIC_LOCATIONS type
  if (vehicle.availabilityType === 'SPECIFIC_LOCATIONS') {
    const isAvailable = vehicle.fleet_availability.some(a => a.isAvailable);
    if (!isAvailable) return null;
  }

  return { vehicle, location };
}

// Generate metadata for MAXIMUM SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const result = await getVehicleWithLocation(params.vehicle, params.location);

  if (!result) {
    return { title: 'Not Found | TransRentals' };
  }

  const { vehicle, location } = result;
  const locationRate = vehicle.fleet_location_rates[0];
  const displayPrice = locationRate?.dailyRate || vehicle.basePrice;
  const features = Array.isArray(vehicle.features) ? (vehicle.features as string[]) : [];
  const seoKeywords = Array.isArray(vehicle.seoKeywords) ? (vehicle.seoKeywords as string[]) : [];

  return {
    title: `${vehicle.name} on Rent in ${location.name} | @₹${displayPrice}/Day | TransRentals`,
    description: `Rent ${vehicle.name} in ${location.name}, ${location.state}. ${vehicle.vehicleType} with ${features.join(', ')}. Book online. Best prices. Verified vendors. 24/7 support.`,
    keywords: [
      `${vehicle.name.toLowerCase()} on rent in ${location.name.toLowerCase()}`,
      `${vehicle.name.toLowerCase()} rental ${location.name.toLowerCase()}`,
      `rent ${vehicle.name.toLowerCase()} ${location.name.toLowerCase()}`,
      `${vehicle.brand.toLowerCase()} rental ${location.name.toLowerCase()}`,
      ...seoKeywords.map((k: string) => `${k} ${location.name.toLowerCase()}`),
    ],
    openGraph: {
      title: `${vehicle.name} on Rent in ${location.name} - @₹${displayPrice}/Day`,
      description: `Book ${vehicle.name} in ${location.name}. ${features.join(', ')}.`,
      url: `https://transrentals.in/fleet/${params.vehicle}/${params.location}`,
    },
    alternates: {
      canonical: `https://transrentals.in/fleet/${params.vehicle}/${params.location}`,
    },
  };
}

export default async function FleetVehicleLocationPage({ params }: PageProps) {
  const result = await getVehicleWithLocation(params.vehicle, params.location);

  if (!result) {
    notFound();
  }

  const { vehicle, location } = result;
  const locationRate = vehicle.fleet_location_rates[0];
  const features = Array.isArray(vehicle.features) ? (vehicle.features as string[]) : [];
  const specs = vehicle.specs as any || {};

  // Use location-specific rate or base price
  const displayPrice = locationRate?.dailyRate || vehicle.basePrice;
  const kmLimit = locationRate?.kmLimit || 100;
  const extraKmRate = locationRate?.extraKmRate || 5;
  const securityDeposit = locationRate?.securityDeposit || 2000;

  return (
    <>
      <DynamicChatBookingHero />

      <LocationHero
        title={`${vehicle.name} on Rent in ${location.name}`}
        subtitle={`${vehicle.brand} ${vehicle.vehicleType} | Starting @₹${displayPrice}/Day`}
        backgroundImage={`/images/cities/${params.location}.jpg`}
      />

      {/* Quick Specs */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header Section */}
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                      <span className="text-sm font-medium">{vehicle.brand}</span>
                      <span className="text-white/60">•</span>
                      <span className="text-sm font-medium">{vehicle.vehicleType}</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">{vehicle.name}</h2>
                    <p className="text-xl text-white/90">Available in {location.name}</p>
                    {vehicle.shortDesc && (
                      <p className="text-white/80 mt-4">{vehicle.shortDesc}</p>
                    )}
                  </div>
                  <div className="text-center md:text-right">
                    <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                      <p className="text-sm text-white/80 uppercase tracking-wide mb-2">Price in {location.name}</p>
                      <p className="text-5xl md:text-6xl font-bold mb-1">₹{displayPrice}</p>
                      <p className="text-white/80">per day</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="p-8 md:p-12">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Specifications</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                  {specs.engine && (
                    <div className="group bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all">
                      <div className="text-3xl mb-3">⚙️</div>
                      <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Engine</p>
                      <p className="font-bold text-gray-900">{specs.engine}</p>
                    </div>
                  )}
                  {specs.mileage && (
                    <div className="group bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all">
                      <div className="text-3xl mb-3">⛽</div>
                      <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Mileage</p>
                      <p className="font-bold text-gray-900">{specs.mileage}</p>
                    </div>
                  )}
                  {specs.seating && (
                    <div className="group bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all">
                      <div className="text-3xl mb-3">👥</div>
                      <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Seating</p>
                      <p className="font-bold text-gray-900">{specs.seating} Persons</p>
                    </div>
                  )}
                  {specs.transmission && (
                    <div className="group bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all">
                      <div className="text-3xl mb-3">🔧</div>
                      <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Transmission</p>
                      <p className="font-bold text-gray-900">{specs.transmission}</p>
                    </div>
                  )}
                </div>

                {/* Rental Details */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-10 border border-blue-200">
                  <h4 className="font-bold text-lg text-gray-900 mb-4">Rental Details for {location.name}</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-blue-200 md:border-0">
                      <span className="text-gray-600">Daily KM Limit</span>
                      <span className="font-semibold">{kmLimit} km</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-blue-200 md:border-0">
                      <span className="text-gray-600">Extra KM Charge</span>
                      <span className="font-semibold">₹{extraKmRate}/km</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Security Deposit</span>
                      <span className="font-semibold">₹{securityDeposit}</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <button className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                  Book {vehicle.name} in {location.name} Now →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container-custom max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Features & Benefits</h2>
            <p className="text-xl text-gray-600">Everything you need for a perfect ride</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature: string, index: number) => (
              <div
                key={feature}
                className="group bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 hover:border-primary-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 text-lg">{feature}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Rent Here */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Rent {vehicle.name} in {location.name}?
            </h2>
            <p className="text-xl text-gray-600">Discover the advantages of renting with us</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Perfect for Location */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                  📍
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Perfect for {location.name}</h3>
              </div>
              <ul className="space-y-4">
                {location.tier === 1 && (
                  <>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Navigate {location.name} traffic easily</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Explore nearby attractions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Weekend getaway trips</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Business travel convenience</span>
                    </li>
                  </>
                )}
                {(location.tier === 2 || location.tier === 3) && (
                  <>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Explore {location.name} and surroundings</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Visit nearby tourist spots</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Comfortable local commute</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Outstation trips</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Booking Benefits */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                  ✨
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Booking Benefits</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Instant online booking</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Verified vendors in {location.name}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Flexible rental durations</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">24/7 customer support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white">
        <div className="container-custom max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {vehicle.name} Rental Pricing in {location.name}
            </h2>
            <p className="text-xl text-gray-600">Flexible plans to suit your needs</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { duration: '1-3 Days', price: displayPrice, discount: '', popular: false },
              { duration: '4-7 Days', price: Math.floor(displayPrice * 0.9), discount: '10% OFF', popular: true },
              { duration: '1 Month', price: Math.floor(displayPrice * 0.7), discount: '30% OFF', popular: false },
            ].map((plan) => (
              <div
                key={plan.duration}
                className={`relative bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 ${
                  plan.popular ? 'border-primary-500 shadow-primary-500/20' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 mt-2">{plan.duration}</h3>
                  <div className="mb-6">
                    <div className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-2">
                      ₹{plan.price}
                    </div>
                    <p className="text-gray-600">per day</p>
                  </div>
                  {plan.discount && (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-4 py-2 rounded-full font-bold shadow-sm">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Save {plan.discount}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600 mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <svg className="w-5 h-5 inline-block mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Prices may vary based on season and availability
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">Got questions? We've got answers</p>
          </div>
          <div className="space-y-4">
            {[
              {
                q: `How much does it cost to rent ${vehicle.name} in ${location.name}?`,
                a: `${vehicle.name} rental in ${location.name} starts from ₹${displayPrice} per day. Weekly and monthly rentals get additional discounts.`,
              },
              {
                q: `What documents are required to rent ${vehicle.name} in ${location.name}?`,
                a: `You need a valid driving license, Aadhar card/PAN card for ID proof, and a refundable security deposit of ₹${securityDeposit}.`,
              },
              {
                q: `Can I rent ${vehicle.name} for outstation trips from ${location.name}?`,
                a: `Yes, ${vehicle.name} is available for outstation trips from ${location.name}. You can book for one-way or round trips.`,
              },
              {
                q: `What is the daily kilometer limit?`,
                a: `The daily kilometer limit is ${kmLimit} km. Extra kilometers are charged at ₹${extraKmRate}/km.`,
              },
              {
                q: `How do I book ${vehicle.name} in ${location.name}?`,
                a: `You can book online through our website or app. Select your dates, provide required documents, and make payment. Vehicle will be delivered to your location in ${location.name}.`,
              },
            ].map((faq, idx) => (
              <div key={idx} className="group bg-white rounded-xl p-6 md:p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-primary-300">
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
            name: `${vehicle.name} Rental in ${location.name}`,
            brand: {
              '@type': 'Brand',
              name: vehicle.brand,
            },
            description: `Rent ${vehicle.name} in ${location.name}, ${location.state}. ${features.join(', ')}.`,
            offers: {
              '@type': 'Offer',
              price: displayPrice,
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              areaServed: {
                '@type': 'City',
                name: location.name,
              },
            },
            provider: {
              '@type': 'Organization',
              name: 'TransRentals',
              url: 'https://transrentals.in',
            },
          }),
        }}
      />
    </>
  );
}
