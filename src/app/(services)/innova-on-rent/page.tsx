import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: 'Innova on Rent Without Driver | Self Drive Innova @₹2499/Day | TransRentals',
  description: 'Rent Toyota Innova without driver across India. Self-drive Innova Crysta rental for family trips, weddings & outstation. 7+1 seater MPV. Book now!',
  keywords: [
    'innova on rent',
    'toyota innova on rent',
    'innova crysta self drive',
    'rent innova without driver',
    'innova rental near me',
    '7 seater car rental',
  ],
  openGraph: {
    title: 'Innova on Rent Without Driver @₹2499/Day | TransRentals',
    description: 'Self-drive Toyota Innova Crysta rental. Best 7-seater MPV for family trips.',
    type: 'website',
    url: 'https://transrentals.in/innova-on-rent',
  },
  alternates: {
    canonical: 'https://transrentals.in/innova-on-rent',
  },
};

const innovaVariants = [
  { name: 'Toyota Innova Crysta GX', price: 2499, fuel: 'Diesel', transmission: 'Manual', seats: 7, features: 'AC, Music System, Power Steering' },
  { name: 'Toyota Innova Crysta GX AT', price: 2799, fuel: 'Diesel', transmission: 'Automatic', seats: 7, features: 'Automatic, Touchscreen, Cruise Control' },
  { name: 'Toyota Innova Crysta VX', price: 2999, fuel: 'Diesel', transmission: 'Manual', seats: 7, features: 'Captain Seats, Leather Interior' },
  { name: 'Toyota Innova Crysta ZX AT', price: 3499, fuel: 'Diesel', transmission: 'Automatic', seats: 7, features: 'Top Variant, All Features' },
  { name: 'Toyota Innova HyCross', price: 3999, fuel: 'Hybrid', transmission: 'Automatic', seats: 7, features: 'Hybrid, Premium, Best Mileage' },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function InnovaOnRentPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Best 7-Seater MPV"
        title="Innova on Rent Without Driver"
        titleHighlight="Starting @₹2499/Day"
        description="India's most trusted MPV for rent. Spacious 7+1 seating, captain seats, legendary reliability. Perfect for family trips, weddings & group travel."
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: '7+1 Seater', color: 'text-purple-600' },
        ]}
        gradientFrom="purple-50"
        gradientTo="indigo-50"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-purple-700 to-indigo-800 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Toyota Innova Crysta on Rent Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Crysta GX • Crysta VX • Crysta ZX • Innova HyCross
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-purple-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                View Variants & Prices
              </a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-700 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Innova */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent a Toyota Innova?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '👥', title: '7+1 Seating', desc: 'Perfect for large families' },
              { icon: '💺', title: 'Captain Seats', desc: 'Premium comfort for all' },
              { icon: '🔧', title: 'Toyota Reliability', desc: 'Most trusted MPV' },
              { icon: '🧳', title: 'Huge Boot', desc: 'Plenty of luggage space' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Innova Variants */}
      <section id="variants" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-4">Innova Variants Available</h2>
          <p className="text-center text-gray-600 mb-12">Choose from multiple variants based on your needs</p>
          <div className="grid md:grid-cols-3 gap-6">
            {innovaVariants.map((variant) => (
              <div key={variant.name} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="bg-purple-700 text-white p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm opacity-75">{variant.transmission}</p>
                      <h3 className="text-xl font-bold">{variant.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">₹{variant.price}</p>
                      <p className="text-xs opacity-75">/day</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex gap-4 text-sm text-gray-600 mb-3">
                    <span>👥 {variant.seats} Seats</span>
                    <span>⛽ {variant.fuel}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{variant.features}</p>
                  <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perfect For */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Innova is Perfect For
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '👨‍👩‍👧‍👦', title: 'Family Trips', desc: '7 people + luggage comfortably' },
              { icon: '💒', title: 'Weddings', desc: 'Perfect for wedding functions' },
              { icon: '🛕', title: 'Pilgrimages', desc: 'Comfortable long journeys' },
              { icon: '✈️', title: 'Airport Pickup', desc: 'Group airport transfers' },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Innova vs HyCross */}
      <section className="py-12 bg-purple-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Innova Crysta vs HyCross
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-purple-700 text-white">
                  <tr>
                    <th className="py-3 px-4 text-left">Feature</th>
                    <th className="py-3 px-4 text-center">Crysta</th>
                    <th className="py-3 px-4 text-center">HyCross</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-3 px-4">Engine</td>
                    <td className="py-3 px-4 text-center">2.4L Diesel</td>
                    <td className="py-3 px-4 text-center">2.0L Hybrid</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-3 px-4">Mileage</td>
                    <td className="py-3 px-4 text-center">14-16 km/l</td>
                    <td className="py-3 px-4 text-center">21-23 km/l</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Seating</td>
                    <td className="py-3 px-4 text-center">7+1 Seats</td>
                    <td className="py-3 px-4 text-center">7 Seats</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-3 px-4">Price/Day</td>
                    <td className="py-3 px-4 text-center font-semibold">₹2,499</td>
                    <td className="py-3 px-4 text-center font-semibold">₹3,999</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Innova on Rent in 200+ Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/innova-on-rent/${city.slug}`}
                className="p-3 bg-gray-50 rounded-lg text-center hover:bg-purple-50 hover:border-purple-300 border border-gray-200 transition"
              >
                <span className="font-medium text-gray-800">{city.name}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <p className="text-gray-600">+ 190 more cities available</p>
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Similar Cars You May Like
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href="/fortuner-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚙</div>
              <h3 className="font-bold text-lg group-hover:text-purple-600">Fortuner on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">Premium 7-seater SUV from ₹4,999/day</p>
            </Link>
            <Link href="/creta-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚘</div>
              <h3 className="font-bold text-lg group-hover:text-purple-600">Creta on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">5-seater SUV from ₹1,999/day</p>
            </Link>
            <Link href="/self-drive-suv-rental" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚐</div>
              <h3 className="font-bold text-lg group-hover:text-purple-600">All SUVs</h3>
              <p className="text-sm text-gray-600 mt-2">Seltos, Scorpio, XUV700</p>
            </Link>
            <Link href="/outstation-car-rental" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🛣️</div>
              <h3 className="font-bold text-lg group-hover:text-purple-600">Outstation Rental</h3>
              <p className="text-sm text-gray-600 mt-2">With driver from ₹16/km</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="self-drive-car-rental" />
    </>
  );
}
