import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: 'Swift on Rent Without Driver | Self Drive Swift @₹899/Day | TransRentals',
  description: 'Rent Maruti Swift without driver across India. Self-drive Swift rental for city commute & short trips. Most popular hatchback with great mileage. Book now!',
  keywords: [
    'swift on rent',
    'maruti swift on rent',
    'swift self drive',
    'rent swift without driver',
    'swift rental near me',
    'swift car rental',
  ],
  openGraph: {
    title: 'Swift on Rent Without Driver @₹899/Day | TransRentals',
    description: 'Self-drive Maruti Swift rental. Most popular hatchback for city commute.',
    type: 'website',
    url: 'https://transrentals.in/swift-on-rent',
  },
  alternates: {
    canonical: 'https://transrentals.in/swift-on-rent',
  },
};

const swiftVariants = [
  { name: 'Maruti Swift LXi', price: 899, fuel: 'Petrol', transmission: 'Manual', features: 'AC, Power Steering, Music System' },
  { name: 'Maruti Swift VXi', price: 999, fuel: 'Petrol', transmission: 'Manual', features: 'Touchscreen, Reverse Camera, Alloys' },
  { name: 'Maruti Swift ZXi', price: 1099, fuel: 'Petrol', transmission: 'Manual', features: 'Top Variant, All Features' },
  { name: 'Maruti Swift VXi AMT', price: 1199, fuel: 'Petrol', transmission: 'Automatic', features: 'Auto Gear Shift, Easy Drive' },
  { name: 'Maruti Swift CNG', price: 849, fuel: 'CNG', transmission: 'Manual', features: 'Factory Fitted CNG, Best Mileage' },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function SwiftOnRentPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Most Popular Hatchback"
        title="Swift on Rent Without Driver"
        titleHighlight="Starting @₹899/Day"
        description="India's most popular hatchback for rent. Sporty design, peppy performance, excellent mileage. Perfect for city commute and short trips."
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: '22 km/l Mileage', color: 'text-green-600' },
        ]}
        gradientFrom="red-50"
        gradientTo="orange-50"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-red-600 to-orange-600 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Maruti Swift on Rent Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Swift LXi • Swift VXi • Swift ZXi • Swift AMT • Swift CNG
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                View Variants & Prices
              </a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Swift */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent a Maruti Swift?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏎️', title: 'Sporty Design', desc: 'Head-turning looks & style' },
              { icon: '⛽', title: '22 km/l Mileage', desc: 'Best in class fuel efficiency' },
              { icon: '🔧', title: 'Low Maintenance', desc: 'Maruti reliability & service' },
              { icon: '🅿️', title: 'Easy Parking', desc: 'Compact size, perfect for city' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Swift Variants */}
      <section id="variants" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-4">Swift Variants Available</h2>
          <p className="text-center text-gray-600 mb-12">Choose from multiple variants based on your needs</p>
          <div className="grid md:grid-cols-3 gap-6">
            {swiftVariants.map((variant) => (
              <div key={variant.name} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="bg-red-600 text-white p-4">
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
                    <span>👥 5 Seats</span>
                    <span>⛽ {variant.fuel}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{variant.features}</p>
                  <button className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Swift Rental Pricing
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="py-3 px-4 text-left">Duration</th>
                    <th className="py-3 px-4 text-right">Price/Day</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-3 px-4">1 Day</td>
                    <td className="py-3 px-4 text-right">₹899</td>
                    <td className="py-3 px-4 text-right font-semibold">₹899</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-3 px-4">Weekend (2 Days)</td>
                    <td className="py-3 px-4 text-right">₹849</td>
                    <td className="py-3 px-4 text-right font-semibold">₹1,698</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Weekly (7 Days)</td>
                    <td className="py-3 px-4 text-right">₹799</td>
                    <td className="py-3 px-4 text-right font-semibold">₹5,593</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-3 px-4">Monthly (30 Days)</td>
                    <td className="py-3 px-4 text-right">₹699</td>
                    <td className="py-3 px-4 text-right font-semibold">₹20,970</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 text-center mt-4">* Prices are indicative. Final price depends on variant and availability.</p>
          </div>
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Swift on Rent in 200+ Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/swift-on-rent/${city.slug}`}
                className="p-3 bg-white rounded-lg text-center hover:bg-red-50 hover:border-red-300 border border-gray-200 transition"
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
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Similar Cars You May Like
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href="/self-drive-hatchback-rental" className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚗</div>
              <h3 className="font-bold text-lg group-hover:text-red-600">All Hatchbacks</h3>
              <p className="text-sm text-gray-600 mt-2">i20, Baleno, Tiago from ₹799/day</p>
            </Link>
            <Link href="/creta-on-rent" className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚙</div>
              <h3 className="font-bold text-lg group-hover:text-red-600">Creta on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">Popular SUV from ₹1,999/day</p>
            </Link>
            <Link href="/innova-on-rent" className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚐</div>
              <h3 className="font-bold text-lg group-hover:text-red-600">Innova on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">7-seater MPV from ₹2,499/day</p>
            </Link>
            <Link href="/outstation-car-rental" className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🛣️</div>
              <h3 className="font-bold text-lg group-hover:text-red-600">Outstation Rental</h3>
              <p className="text-sm text-gray-600 mt-2">With driver from ₹12/km</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="self-drive-car-rental" />
    </>
  );
}
