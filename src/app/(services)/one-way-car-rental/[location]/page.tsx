import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL cities - GOD LEVEL SEO
// Generate static params from DATABASE - Only locations where car-rental is available
export async function generateStaticParams() {
  return getServiceLocations('car-rental');
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

  return {
    title: `One Way Car Rental from ${locationName} | Drop at Different City @₹1299 | TransRentals`,
    description: `One-way car rental from ${locationName}. Drop car at different city. No return trip needed. Convenient intercity travel. Book online instantly.`,
    keywords: [
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
      url: `https://transrentals.in/one-way-car-rental/${params.location}`,
    },
    alternates: {
      canonical: `https://transrentals.in/one-way-car-rental/${params.location}`,
    },
  };
}

export default function OneWayCarRentalLocationPage({ params }: PageProps) {
  const city = getCityBySlug(params.location);

  if (!city) {
    notFound();
  }

  const locationName = city.name;

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
        citySlug={params.location}
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

      {/* Available Cars */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            One Way Cars Available from {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { type: 'Hatchbacks', price: '1299', examples: 'Swift, i20, Baleno' },
              { type: 'Sedans', price: '1799', examples: 'City, Verna, Ciaz' },
              { type: 'Compact SUVs', price: '2199', examples: 'Venue, Nexon, Brezza' },
              { type: 'SUVs', price: '2999', examples: 'Creta, Seltos, XUV500' },
              { type: 'MUVs', price: '2699', examples: 'Ertiga, XL6, Innova' },
              { type: 'Premium', price: '3999', examples: 'Camry, Octavia, Fortuner' },
            ].map((category) => (
              <div key={category.type} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-2">{category.type}</h3>
                <p className="text-2xl font-bold text-green-600 mb-2">₹{category.price}+</p>
                <p className="text-sm text-gray-600 mb-4">{category.examples}</p>
                <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
                  Book One Way
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular One Way Routes from This City */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Popular One Way Routes from {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {city.tier <= 2 && [
              { destination: 'Nearby City 1', distance: '150-250 km', price: '2499' },
              { destination: 'Nearby City 2', distance: '250-350 km', price: '3499' },
              { destination: 'Nearby City 3', distance: '350-450 km', price: '4499' },
              { destination: 'Nearby City 4', distance: '450-550 km', price: '5499' },
            ].map((route, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="font-semibold">{locationName} to {route.destination}</p>
                  <p className="text-sm text-gray-600">{route.distance}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">₹{route.price}+</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      {/* FAQs */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: `How much does one way car rental from ${locationName} cost?`,
                a: `One way car rental from ${locationName} starts from ₹1299 depending on your destination city, distance, and car type.`,
              },
              {
                q: `Can I drop the car in any city from ${locationName}?`,
                a: `Yes, you can drop the car in most major cities across India. Some remote locations may have limited availability.`,
              },
              {
                q: `Is fuel included in one way rental from ${locationName}?`,
                a: `Fuel charges are typically extra and based on actual consumption during your journey.`,
              },
              {
                q: `Do I need to pay for the return journey?`,
                a: `No, there are no return charges. You only pay for the one-way trip from ${locationName} to your destination.`,
              },
              {
                q: `How do I book a one way car from ${locationName}?`,
                a: `You can book online through our website. Select ${locationName} as pickup, choose your drop city, select car type, and complete booking.`,
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg">
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
            name: `One Way Car Rental from ${locationName}`,
            description: `One-way car rental service from ${locationName}. Drop at different city.`,
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: '1299',
              highPrice: '9999',
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
