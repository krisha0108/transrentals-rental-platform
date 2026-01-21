import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: 'Self Drive Sedan Rental India | Rent Sedan Without Driver @₹1299/Day | TransRentals',
  description: 'Rent sedan without driver across India. Honda City, Hyundai Verna, Maruti Ciaz, Skoda Slavia available. Self-drive sedan rental for business & leisure.',
  keywords: [
    'self drive sedan rental',
    'sedan on rent without driver',
    'rent sedan india',
    'honda city on rent',
    'verna self drive',
    'sedan rental for outstation',
  ],
  openGraph: {
    title: 'Self Drive Sedan Rental India @₹1299/Day | TransRentals',
    description: 'Rent sedans without driver. City, Verna, Ciaz available.',
    type: 'website',
    url: 'https://transrentals.in/self-drive-sedan-rental',
  },
  alternates: {
    canonical: 'https://transrentals.in/self-drive-sedan-rental',
  },
};

const sedanModels = [
  { name: 'Maruti Dzire', price: 1299, category: 'Compact Sedan', seats: 5, fuel: 'Petrol/CNG', features: 'Best Mileage, Comfortable' },
  { name: 'Honda Amaze', price: 1399, category: 'Compact Sedan', seats: 5, fuel: 'Petrol/Diesel', features: 'Spacious Boot, Reliable' },
  { name: 'Hyundai Verna', price: 1699, category: 'Mid-Size Sedan', seats: 5, fuel: 'Petrol/Diesel', features: 'Premium Features, Turbo' },
  { name: 'Honda City', price: 1799, category: 'Mid-Size Sedan', seats: 5, fuel: 'Petrol/Hybrid', features: 'ADAS, Connected Car' },
  { name: 'Skoda Slavia', price: 1899, category: 'Mid-Size Sedan', seats: 5, fuel: 'Petrol', features: 'TSI Engine, Premium' },
  { name: 'Maruti Ciaz', price: 1599, category: 'Mid-Size Sedan', seats: 5, fuel: 'Petrol/CNG', features: 'Spacious, Fuel Efficient' },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function SelfDriveSedanRentalPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Self Drive Sedan Rental"
        title="Rent Sedan Without Driver"
        titleHighlight="Starting @₹1299/Day"
        description="Self-drive sedan rental for business travel, outstation trips, and comfortable commuting. Stylish, comfortable, and fuel-efficient."
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Great Mileage', color: 'text-blue-600' },
        ]}
        gradientFrom="gray-50"
        gradientTo="blue-50"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-800 to-blue-900 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Self Drive Sedan Rental Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              City • Verna • Ciaz • Dzire • Slavia • Amaze
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#sedans" className="bg-white text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                View Sedan Models
              </a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-800 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Sedan */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent a Sedan?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '💼', title: 'Business Ready', desc: 'Professional appearance' },
              { icon: '⛽', title: 'Fuel Efficient', desc: '15-20+ km/l mileage' },
              { icon: '🛋️', title: 'Comfortable', desc: 'Plush seating, smooth ride' },
              { icon: '🛣️', title: 'Highway Ready', desc: 'Perfect for long drives' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sedan Models */}
      <section id="sedans" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-4">Available Sedan Models</h2>
          <p className="text-center text-gray-600 mb-12">All sedans are well-maintained, insured, and sanitized</p>
          <div className="grid md:grid-cols-3 gap-6">
            {sedanModels.map((sedan) => (
              <div key={sedan.name} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="bg-gray-800 text-white p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm opacity-75">{sedan.category}</p>
                      <h3 className="text-xl font-bold">{sedan.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">₹{sedan.price}</p>
                      <p className="text-xs opacity-75">/day</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex gap-4 text-sm text-gray-600 mb-3">
                    <span>👥 {sedan.seats} Seats</span>
                    <span>⛽ {sedan.fuel}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{sedan.features}</p>
                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Self Drive Sedan Rental in 200+ Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/self-drive-sedan-rental/${city.slug}`}
                className="p-3 bg-gray-50 rounded-lg text-center hover:bg-blue-50 hover:border-blue-300 border border-gray-200 transition"
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
            Other Self Drive Options
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/self-drive-suv-rental" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚙</div>
              <h3 className="font-bold text-lg group-hover:text-blue-600">SUV Rental</h3>
              <p className="text-sm text-gray-600 mt-2">Creta, Seltos from ₹1999/day</p>
            </Link>
            <Link href="/self-drive-hatchback-rental" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚗</div>
              <h3 className="font-bold text-lg group-hover:text-blue-600">Hatchback Rental</h3>
              <p className="text-sm text-gray-600 mt-2">Swift, i20 from ₹899/day</p>
            </Link>
            <Link href="/outstation-car-rental" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🛣️</div>
              <h3 className="font-bold text-lg group-hover:text-blue-600">Outstation Rental</h3>
              <p className="text-sm text-gray-600 mt-2">With driver from ₹13/km</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="self-drive-car-rental" />
    </>
  );
}
