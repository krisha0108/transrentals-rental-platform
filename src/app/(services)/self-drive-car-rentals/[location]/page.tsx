import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_CITIES, STATIC_CITIES } from '@/data/indian-cities';
import { CarSearchHero } from '@/components/car';
import { ServiceComingSoon } from '@/components/location/ServiceComingSoon';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';
import { isServiceAvailableInLocation, getNearbyAvailableLocations } from '@/lib/services/service-availability';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL cities - GOD LEVEL SEO
export async function generateStaticParams() {
  // Generate pages for ALL 206 cities across India
  return STATIC_CITIES.map((city) => ({
    location: city.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = ALL_CITIES.find(c => c.slug === params.location);

  if (!city) {
    return { title: 'Self Drive Car Rental | TransRentals' };
  }

  const locationName = city.name;

  return {
    title: `Self Drive Car Rental in ${locationName} | No Driver @₹899/Day | TransRentals`,
    description: `Rent self-drive cars in ${locationName}, ${city.state}. Drive yourself without driver. Hatchbacks, sedans, SUVs available. Book online. Flexible hours. 24/7 support.`,
    keywords: [
      `self drive car rental ${locationName.toLowerCase()}`,
      `self drive cars ${locationName.toLowerCase()}`,
      `car rental without driver ${locationName.toLowerCase()}`,
      `self drive car hire ${locationName.toLowerCase()}`,
      `drive yourself car ${locationName.toLowerCase()}`,
      ...city.keywords.map(k => `self drive car ${k}`),
    ],
    openGraph: {
      title: `Self Drive Car Rental in ${locationName} - Starting @₹899/Day`,
      description: `Book self-drive cars in ${locationName}. No driver needed. Complete freedom to drive yourself.`,
      url: `https://transrentals.in/self-drive-car-rentals/${params.location}`,
    },
    alternates: {
      canonical: `https://transrentals.in/self-drive-car-rentals/${params.location}`,
    },
  };
}

export default async function SelfDriveCarRentalLocationPage({ params }: PageProps) {
  const city = ALL_CITIES.find(c => c.slug === params.location);

  if (!city) {
    notFound();
  }

  const locationName = city.name;

  // Check if self-drive-car-rentals service is available in this location
  const isAvailable = await isServiceAvailableInLocation('self-drive-car-rentals', params.location);

  // If service not available, show coming soon page
  if (!isAvailable) {
    const nearbyLocations = await getNearbyAvailableLocations('self-drive-car-rentals', params.location, 6);
    return (
      <ServiceComingSoon
        serviceName="Self Drive Car Rental"
        serviceSlug="self-drive-car-rentals"
        locationName={locationName}
        locationSlug={params.location}
        nearbyLocations={nearbyLocations}
      />
    );
  }

  return (
    <>
      <CarSearchHero city={locationName} citySlug={params.location} />

      {/* Why Self Drive in This City */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Why Choose Self Drive Cars in {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '🔐', title: 'Complete Privacy', desc: 'Drive alone without a driver' },
              { icon: '⏰', title: 'Your Schedule', desc: 'No time restrictions' },
              { icon: '💰', title: 'No Driver Cost', desc: 'Save on driver charges' },
              { icon: '🗺️', title: 'Explore Freely', desc: `Discover ${locationName} at your pace` },
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

      {/* Available Cars - Dynamic from Database */}
      <ServiceFleetDisplay
        serviceSlug="self-drive-car-rentals"
        title={`Self Drive Cars Available in ${locationName}`}
        showCategories={true}
        limit={12}
        priceUnit="/day"
        showViewAll={false}
      />

      {/* Popular Self Drive Routes */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Popular Self Drive Routes from {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {city.tier <= 2 && [
              { route: `${locationName} City Tour`, distance: 'Full Day', desc: 'Explore the city at your own pace' },
              { route: `${locationName} to Nearby Attractions`, distance: '100-200 km', desc: 'Weekend getaway trips' },
              { route: `Airport Transfers`, distance: 'As needed', desc: 'Pick up and drop flexibility' },
              { route: `Outstation Trips`, distance: '200+ km', desc: 'Long distance self-drive' },
            ].map((route, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="font-semibold">{route.route}</p>
                  <p className="text-sm text-gray-600">{route.desc}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blue-600">{route.distance}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rental Packages */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Self Drive Car Rental Packages in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { duration: 'Hourly', price: '150-300', desc: '4 hours minimum' },
              { duration: 'Daily', price: '899-2999', desc: '24 hours package' },
              { duration: 'Weekly', price: '6000-18000', desc: '7 days - 10% off' },
              { duration: 'Monthly', price: '20000-60000', desc: '30 days - 30% off' },
            ].map((plan, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="font-semibold text-lg mb-2">{plan.duration}</h3>
                <p className="text-2xl font-bold text-blue-600 mb-2">₹{plan.price}</p>
                <p className="text-sm text-gray-600">{plan.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: `How much does self-drive car rental cost in ${locationName}?`,
                a: `Self-drive car rental in ${locationName} starts from ₹899/day for hatchbacks. Sedans cost around ₹1299/day and SUVs from ₹2199/day.`,
              },
              {
                q: `What documents are required for self-drive car rental in ${locationName}?`,
                a: `You need a valid driving license (minimum 1 year old), Aadhar card/PAN card for ID proof, and a refundable security deposit.`,
              },
              {
                q: `Is fuel included in self-drive car rental?`,
                a: `No, fuel charges are separate. The car will have some fuel when you pick it up, and you should return it with the same fuel level.`,
              },
              {
                q: `Can I take a self-drive car for outstation trips from ${locationName}?`,
                a: `Yes, you can take self-drive cars for outstation trips from ${locationName}. Additional charges may apply for inter-state travel.`,
              },
              {
                q: `How do I book a self-drive car in ${locationName}?`,
                a: `You can book online through our website or app. Select your car, provide required documents, pay the security deposit, and pick up your car.`,
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
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
            name: `Self Drive Car Rental in ${locationName}`,
            description: `Rent self-drive cars in ${locationName}. No driver needed. Complete freedom.`,
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: '899',
              highPrice: '4999',
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
