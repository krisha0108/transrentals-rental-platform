import { Metadata } from 'next';
import Link from 'next/link';
import { getCitiesByPriority } from '@/data/indian-cities';
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('One Way Car Rental - Drop at Different City @₹1299 | TransRentals'),
  description: formatPriceHighlight('One-way car rental service across India. Rent a car and drop it at a different city. No return trip needed. Convenient one-way travel. Book online instantly.'),
  keywords: ['one way car rental', 'one way car hire', 'drop car different city', 'one way cab', 'intercity car rental', 'city to city car rental'],
  openGraph: {
    title: formatPriceHighlight('One Way Car Rental India - Starting @₹1299 | TransRentals'),
    description: formatPriceHighlight('Rent a car and drop it at a different city. No return trip required. One-way car rental across 250+ Indian cities.'),
  },
};

export default function OneWayCarRentalPage() {
  const popularCities = getCitiesByPriority(8);

  return (
    <>
      {/* Hero with booking form */}
      <SpecialtyCarBookingHero service="one-way" />

      {/* Why One Way Car Rental */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose One Way Car Rental?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '🎯', title: 'Convenient', desc: 'Drop car at destination city' },
              { icon: '💵', title: 'Cost Effective', desc: 'No empty return charges' },
              { icon: '⏱️', title: 'Time Saving', desc: 'No need to return to pickup city' },
              { icon: '🛣️', title: 'Flexible Routes', desc: 'Travel your way, drop anywhere' },
              { icon: '🚙', title: 'All Car Types', desc: 'Hatchbacks to SUVs available' },
              { icon: '📱', title: 'Easy Booking', desc: 'Book online in minutes' },
              { icon: '🔧', title: 'Well Maintained', desc: 'Regular serviced vehicles' },
              { icon: '🆘', title: '24/7 Support', desc: 'Round the clock assistance' },
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

      {/* Popular Cities Grid */}
      <section id="locations" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            One Way Car Rental in Popular Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularCities.map((city) => (
              <Link
                key={city.slug}
                href={`/one-way-car-rental/${city.slug}`}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group"
              >
                <h3 className="font-semibold text-lg group-hover:text-green-600 transition">
                  {city.name}
                </h3>
                <p className="text-sm text-gray-600">{city.state}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* One Way Car Options */}
      {/* How It Works */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            How One Way Car Rental Works
          </h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Select Route', desc: 'Choose your pickup city and drop city for your one-way trip' },
              { step: '2', title: 'Choose Car', desc: 'Select from our wide range of cars based on your needs' },
              { step: '3', title: 'Book Online', desc: 'Book instantly on our website or app with basic details' },
              { step: '4', title: 'Pick Up Car', desc: 'Pick up the car from your starting city at scheduled time' },
              { step: '5', title: 'Drop at Destination', desc: 'Drive to your destination and drop the car there - no return needed' },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 bg-white p-6 rounded-lg shadow-md">
                <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Details */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            One Way Car Rental Pricing
          </h2>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="font-bold text-xl mb-6">What&apos;s Included</h3>
            <ul className="space-y-3 text-gray-700 mb-8">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Base fare for one-way journey</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Driver charges included (if with driver)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>All tolls and permits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>No return trip charges</span>
              </li>
            </ul>
            <h3 className="font-bold text-xl mb-6">Additional Charges</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>Fuel charges extra (actual consumption)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>State tax if applicable</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>Driver night charges (if overnight stay)</span>
              </li>
            </ul>
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
                q: 'What is one way car rental?',
                a: 'One way car rental allows you to pick up a car in one city and drop it off in another city. You don\'t need to return the car to the pickup location, making it perfect for one-way trips.',
              },
              {
                q: 'How much does one way car rental cost?',
                a: 'One way car rental starts from ₹1299 depending on the route, distance, and car type. Prices vary based on pickup and drop cities.',
              },
              {
                q: 'Do I have to pay return charges?',
                a: 'No, there are no return charges. You only pay for the one-way journey from your pickup city to drop city.',
              },
              {
                q: 'Is fuel included in the one way rental price?',
                a: 'Fuel charges are typically extra and based on actual consumption. Some packages may include a certain fuel limit.',
              },
              {
                q: 'Can I book one way car rental between any two cities?',
                a: 'Yes, we offer one way car rental service between most major cities in India. Some remote routes may have limited availability.',
              },
              {
                q: 'How do I book a one way car rental?',
                a: 'You can book online through our website or app. Select your pickup city, drop city, date, and choose your preferred car.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
