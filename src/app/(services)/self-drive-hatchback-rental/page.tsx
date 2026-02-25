import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Self Drive Hatchback Rental India | Rent Hatchback @₹899/Day | TransRentals'),
  description: formatPriceHighlight('Rent hatchback without driver across India. Swift, i20, Baleno, Tiago available. Self-drive hatchback rental for city commute. Most affordable option.'),
  keywords: [
    'self drive hatchback rental',
    'hatchback on rent without driver',
    'rent hatchback india',
    'swift on rent',
    'i20 self drive',
    'baleno rental',
  ],
  openGraph: {
    title: formatPriceHighlight('Self Drive Hatchback Rental India @₹899/Day | TransRentals'),
    description: formatPriceHighlight('Rent hatchbacks without driver. Swift, i20, Baleno available.'),
    type: 'website',
    url: 'https://transrentals.in/self-drive-hatchback-rental',
  },
  alternates: {
    canonical: 'https://transrentals.in/self-drive-hatchback-rental',
  },
};

const hatchbackModels = [
  { name: 'Maruti Swift', price: 899, category: 'Premium Hatchback', fuel: 'Petrol/CNG', features: 'Sporty, Fun to Drive' },
  { name: 'Hyundai i20', price: 999, category: 'Premium Hatchback', fuel: 'Petrol', features: 'Feature Rich, Connected' },
  { name: 'Maruti Baleno', price: 949, category: 'Premium Hatchback', fuel: 'Petrol/CNG', features: 'Spacious, Fuel Efficient' },
  { name: 'Tata Tiago', price: 799, category: 'Compact Hatchback', fuel: 'Petrol/CNG', features: 'Safe, Value for Money' },
  { name: 'Hyundai Grand i10', price: 849, category: 'Compact Hatchback', fuel: 'Petrol', features: 'City Friendly, Reliable' },
  { name: 'Maruti Wagon R', price: 799, category: 'Tall Boy Hatchback', fuel: 'Petrol/CNG', features: 'Spacious, Best Mileage' },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function SelfDriveHatchbackRentalPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Self Drive Hatchback Rental"
        title="Rent Hatchback Without Driver"
        titleHighlight="Starting @₹899/Day"
        description="Most affordable self-drive option. Perfect for city commute, short trips, and budget-conscious travelers. Easy to drive and park."
        features={[
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Best Mileage', color: 'text-green-600' },
        ]}
        gradientFrom="green-50"
        gradientTo="blue-50"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-green-700 to-blue-800 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Self Drive Hatchback Rental Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Swift • i20 • Baleno • Tiago • Wagon R • Grand i10
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#hatchbacks" className="bg-white text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                View Hatchback Models
              </a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-700 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Hatchback */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent a Hatchback?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '💰', title: 'Most Affordable', desc: 'Lowest rental rates' },
              { icon: '⛽', title: 'Best Mileage', desc: '18-22 km/l efficiency' },
              { icon: '🅿️', title: 'Easy Parking', desc: 'Compact size, fits anywhere' },
              { icon: '🏙️', title: 'City Perfect', desc: 'Ideal for traffic & narrow roads' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hatchback Models */}
      <section id="hatchbacks" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-4">Available Hatchback Models</h2>
          <p className="text-center text-gray-600 mb-12">All cars are well-maintained, insured, and sanitized</p>
          <div className="grid md:grid-cols-3 gap-6">
            {hatchbackModels.map((car) => (
              <div key={car.name} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="bg-green-700 text-white p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm opacity-75">{car.category}</p>
                      <h3 className="text-xl font-bold">{car.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">₹{car.price}</p>
                      <p className="text-xs opacity-75">/day</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex gap-4 text-sm text-gray-600 mb-3">
                    <span>👥 5 Seats</span>
                    <span>⛽ {car.fuel}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{car.features}</p>
                  <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
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
            Self Drive Hatchback Rental in 200+ Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/self-drive-hatchback-rental/${city.slug}`}
                className="p-3 bg-gray-50 rounded-lg text-center hover:bg-green-50 hover:border-green-300 border border-gray-200 transition"
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

      {/* Perfect For */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Perfect For
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏢', title: 'Daily Commute', desc: 'Office travel, errands' },
              { icon: '🎓', title: 'Students', desc: 'Budget-friendly option' },
              { icon: '🚗', title: 'New Drivers', desc: 'Easy to handle & park' },
              { icon: '🏖️', title: 'Weekend Trips', desc: 'Short getaways' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-lg text-center shadow-md">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Need More Space?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/self-drive-sedan-rental" className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚗</div>
              <h3 className="font-bold text-lg group-hover:text-green-600">Sedan Rental</h3>
              <p className="text-sm text-gray-600 mt-2">City, Verna from ₹1299/day</p>
            </Link>
            <Link href="/self-drive-suv-rental" className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚙</div>
              <h3 className="font-bold text-lg group-hover:text-green-600">SUV Rental</h3>
              <p className="text-sm text-gray-600 mt-2">Creta, Seltos from ₹1999/day</p>
            </Link>
            <Link href="/outstation-car-rental" className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🛣️</div>
              <h3 className="font-bold text-lg group-hover:text-green-600">Outstation Rental</h3>
              <p className="text-sm text-gray-600 mt-2">With driver from ₹12/km</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="self-drive-car-rental" />
    </>
  );
}
