import { Metadata } from 'next';
import Link from 'next/link';
import { getCitiesByPriority } from '@/data/indian-cities';
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Outstation Cab | Intercity Taxi @₹12/Km | Round Trip Car Rental India'),
  description: formatPriceHighlight('Book outstation taxi for intercity travel. Round trip & one-way cabs. Sedan, SUV, tempo available. Station taxi service across India. AC cars @₹12/km.'),
  keywords: [
    'outstation cab',
    'outstation taxi',
    'intercity cab',
    'round trip cab',
    'outstation car rental',
    'station taxi',
    'intercity travel',
    'outstation taxi service',
    'one way outstation cab',
    'round trip taxi',
    'intercity car rental',
    'station cab service',
  ],
  openGraph: {
    title: formatPriceHighlight('Outstation Cab India | Intercity Taxi @₹12/Km | Round Trip'),
    description: formatPriceHighlight('Book outstation cabs for intercity travel across India. Sedan, SUV available. Round trip & one-way options.'),
  },
};

export default function OutstationCabPage() {
  const popularCities = getCitiesByPriority(8);

  return (
    <>
      {/* Booking Hero - Same as Car Rental */}
      <CarRentalBookingHero
        city="Delhi"
        citySlug="delhi"
        serviceSlug="car-rental"
        serviceTitle="Outstation Cab"
      />

      {/* Why Outstation Cab */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Outstation Cab?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '💰', title: 'Affordable Rates', desc: 'Starting @₹12/km only' },
              { icon: '🚗', title: 'Clean AC Cars', desc: 'Well-maintained vehicles' },
              { icon: '👨‍✈️', title: 'Experienced Drivers', desc: 'Professional chauffeurs' },
              { icon: '🛣️', title: 'All Routes Covered', desc: 'Pan-India connectivity' },
              { icon: '🔄', title: 'Round Trip Option', desc: 'Save on return journey' },
              { icon: '⏰', title: 'Flexible Timing', desc: 'Travel at your convenience' },
              { icon: '🛡️', title: 'Fully Insured', desc: 'Safe & secure travel' },
              { icon: '📱', title: 'Easy Booking', desc: 'Book online in minutes' },
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
            Outstation Cab in Popular Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularCities.map((city) => (
              <Link
                key={city.slug}
                href={`/outstation-cab/${city.slug}`}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group"
              >
                <h3 className="font-semibold text-lg group-hover:text-blue-700 transition">
                  {city.name}
                </h3>
                <p className="text-sm text-gray-600">{city.state}</p>
                <p className="text-sm text-blue-700 mt-2">From @₹12/km →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Car Options */}
      <section id="packages" className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Outstation Cab Options
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sedan (Swift Dzire)', price: '12', features: 'AC, 4 Seater, Comfortable, Good luggage space', capacity: '4 Passengers', best: 'Couples, Small families' },
              { name: 'Sedan (Honda City)', price: '14', features: 'AC, Premium comfort, Spacious, Great mileage', capacity: '4 Passengers', best: 'Comfort seekers' },
              { name: 'SUV (Ertiga)', price: '16', features: 'AC, 6-7 Seater, Spacious, Family friendly', capacity: '6-7 Passengers', best: 'Families with kids' },
              { name: 'SUV (Innova)', price: '18', features: 'AC, 7 Seater, Premium comfort, Ample space', capacity: '7 Passengers', best: 'Large families' },
              { name: 'SUV (Innova Crysta)', price: '22', features: 'Premium AC, 7 Seater, Luxury comfort, Modern', capacity: '7 Passengers', best: 'Premium travelers' },
              { name: 'Tempo Traveller', price: '25', features: 'AC, 12-17 Seater, Group travel, Push-back seats', capacity: '12-17 Passengers', best: 'Large groups' },
            ].map((vehicle) => (
              <div key={vehicle.name} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition border-t-4 border-blue-600">
                <p className="text-sm text-blue-700 font-semibold mb-2">{vehicle.capacity}</p>
                <h3 className="text-xl font-bold mb-2">{vehicle.name}</h3>
                <p className="text-3xl font-bold text-blue-700 mb-2">₹{vehicle.price}/km</p>
                <p className="text-sm text-gray-600 mb-3">{vehicle.features}</p>
                <p className="text-xs text-gray-500 mb-4">Best for: {vehicle.best}</p>
                <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Popular Outstation Routes
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { route: 'Delhi to Agra', distance: '230 km', price: '2760' },
              { route: 'Delhi to Jaipur', distance: '280 km', price: '3360' },
              { route: 'Mumbai to Pune', distance: '150 km', price: '1800' },
              { route: 'Mumbai to Shirdi', distance: '240 km', price: '2880' },
              { route: 'Bangalore to Mysore', distance: '150 km', price: '1800' },
              { route: 'Bangalore to Ooty', distance: '270 km', price: '3240' },
              { route: 'Chennai to Pondicherry', distance: '160 km', price: '1920' },
              { route: 'Chennai to Tirupati', distance: '140 km', price: '1680' },
              { route: 'Delhi to Manali', distance: '550 km', price: '6600' },
            ].map((item) => (
              <div key={item.route} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
                <h3 className="font-semibold text-lg mb-2">{item.route}</h3>
                <p className="text-sm text-gray-600 mb-2">{item.distance} (one-way)</p>
                <p className="text-2xl font-bold text-blue-700">₹{item.price}+</p>
                <p className="text-xs text-gray-500 mt-1">*Sedan car, round trip</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features & Amenities */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Outstation Cab Features
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-blue-900">Included in Price</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-700 mt-1">✓</span>
                  <span>Experienced driver</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-700 mt-1">✓</span>
                  <span>Fuel charges (both ways)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-700 mt-1">✓</span>
                  <span>Driver allowance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-700 mt-1">✓</span>
                  <span>State taxes & tolls</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-700 mt-1">✓</span>
                  <span>GST included</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-700 mt-1">✓</span>
                  <span>Full vehicle insurance</span>
                </li>
              </ul>
            </div>
            <div className="bg-cyan-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-cyan-900">Service Features</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-700 mt-1">✓</span>
                  <span>Clean & sanitized cars</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-700 mt-1">✓</span>
                  <span>Doorstep pickup & drop</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-700 mt-1">✓</span>
                  <span>Flexible stop-overs allowed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-700 mt-1">✓</span>
                  <span>No hidden charges</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-700 mt-1">✓</span>
                  <span>24/7 customer support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-700 mt-1">✓</span>
                  <span>Easy cancellation policy</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Rental Packages */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Outstation Cab Packages
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { type: 'Round Trip', price: '₹12-22/km', desc: 'Return journey included', best: 'Most economical' },
              { type: 'One-Way Drop', price: '₹14-25/km', desc: 'No return charges', best: 'Single journey' },
              { type: 'Multi-City', price: 'Custom Quote', desc: 'Multiple destinations', best: 'Tour packages' },
            ].map((plan) => (
              <div key={plan.type} className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="font-semibold text-lg mb-2">{plan.type}</h3>
                <p className="text-2xl font-bold text-blue-700 mb-2">{plan.price}</p>
                <p className="text-sm text-gray-600 mb-2">{plan.desc}</p>
                <p className="text-xs text-blue-700 font-semibold">Best for: {plan.best}</p>
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
                q: 'How much does outstation cab cost?',
                a: 'Outstation cab starts from ₹12/km for sedan. SUVs cost ₹16-22/km. Price includes driver, fuel, tolls, and taxes. Round trip is more economical.',
              },
              {
                q: 'What is included in outstation cab fare?',
                a: 'Fare includes driver charges, fuel (both ways), driver allowance (bata), toll taxes, state taxes, parking, and GST. No hidden charges.',
              },
              {
                q: 'Can I book one-way outstation cab?',
                a: 'Yes! One-way drop is available at slightly higher per km rate (₹14-25/km). Round trip is more economical as return charges are included.',
              },
              {
                q: 'How is outstation cab fare calculated?',
                a: 'Fare = Distance (km) × Per km rate. For round trip, total distance (both ways) is calculated. Minimum 250km per day applies for multi-day trips.',
              },
              {
                q: 'Are toll charges included in outstation cab?',
                a: 'Yes, all toll charges, parking fees, state entry taxes are included in the fare. No extra charges.',
              },
              {
                q: 'Can I extend my outstation cab booking?',
                a: 'Yes, you can extend your booking. Additional charges will apply as per the per km rate and extra days. Inform driver or customer support.',
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
