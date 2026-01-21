import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: 'Creta on Rent Without Driver | Self Drive Creta @₹1999/Day | TransRentals',
  description: 'Rent Hyundai Creta without driver across India. Self-drive Creta rental for family trips, outstation & weekend getaways. Most popular SUV. Book now!',
  keywords: [
    'creta on rent',
    'hyundai creta on rent',
    'creta self drive',
    'rent creta without driver',
    'creta rental near me',
    'creta car rental',
  ],
  openGraph: {
    title: 'Creta on Rent Without Driver @₹1999/Day | TransRentals',
    description: 'Self-drive Hyundai Creta rental. Most popular SUV for family trips.',
    type: 'website',
    url: 'https://transrentals.in/creta-on-rent',
  },
  alternates: {
    canonical: 'https://transrentals.in/creta-on-rent',
  },
};

const cretaVariants = [
  { name: 'Hyundai Creta E', price: 1999, fuel: 'Petrol', transmission: 'Manual', features: 'AC, Music System, Power Windows' },
  { name: 'Hyundai Creta EX', price: 2199, fuel: 'Petrol', transmission: 'Manual', features: 'Touchscreen, Reverse Camera' },
  { name: 'Hyundai Creta S', price: 2499, fuel: 'Petrol', transmission: 'Manual', features: 'Sunroof, Connected Car Features' },
  { name: 'Hyundai Creta SX', price: 2799, fuel: 'Diesel', transmission: 'Manual', features: 'Premium Features, ADAS' },
  { name: 'Hyundai Creta SX(O) AT', price: 3299, fuel: 'Diesel', transmission: 'Automatic', features: 'Top Variant, Panoramic Sunroof' },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function CretaOnRentPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Most Popular SUV"
        title="Creta on Rent Without Driver"
        titleHighlight="Starting @₹1999/Day"
        description="India's best-selling SUV for rent. Premium features, powerful performance, comfortable ride. Perfect for family trips and outstation travel."
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Premium SUV', color: 'text-blue-600' },
        ]}
        gradientFrom="blue-50"
        gradientTo="cyan-50"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-700 to-cyan-700 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Hyundai Creta on Rent Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Creta E • Creta EX • Creta S • Creta SX • Creta SX(O) AT
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                View Variants & Prices
              </a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-700 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Creta */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent a Hyundai Creta?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏆', title: 'Best-Selling SUV', desc: '#1 SUV in India' },
              { icon: '🛋️', title: 'Premium Comfort', desc: 'Spacious & comfortable' },
              { icon: '🔒', title: 'ADAS Safety', desc: 'Advanced safety features' },
              { icon: '🌟', title: 'Connected Car', desc: 'BlueLink technology' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Creta Variants */}
      <section id="variants" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-4">Creta Variants Available</h2>
          <p className="text-center text-gray-600 mb-12">Choose from multiple variants based on your needs</p>
          <div className="grid md:grid-cols-3 gap-6">
            {cretaVariants.map((variant) => (
              <div key={variant.name} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="bg-blue-700 text-white p-4">
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
                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
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
            Creta is Perfect For
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '👨‍👩‍👧‍👦', title: 'Family Trips', desc: 'Spacious for 5 people + luggage' },
              { icon: '🛣️', title: 'Road Trips', desc: 'Comfortable highway cruiser' },
              { icon: '💼', title: 'Business Travel', desc: 'Premium appearance' },
              { icon: '🏔️', title: 'Hill Stations', desc: 'Good ground clearance' },
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

      {/* Cities */}
      <section id="cities" className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Creta on Rent in 200+ Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/creta-on-rent/${city.slug}`}
                className="p-3 bg-white rounded-lg text-center hover:bg-blue-50 hover:border-blue-300 border border-gray-200 transition"
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
            Similar SUVs You May Like
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href="/self-drive-suv-rental" className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚙</div>
              <h3 className="font-bold text-lg group-hover:text-blue-600">All SUVs</h3>
              <p className="text-sm text-gray-600 mt-2">Seltos, Scorpio, XUV700</p>
            </Link>
            <Link href="/fortuner-on-rent" className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚘</div>
              <h3 className="font-bold text-lg group-hover:text-blue-600">Fortuner on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">Premium SUV from ₹4,999/day</p>
            </Link>
            <Link href="/innova-on-rent" className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚐</div>
              <h3 className="font-bold text-lg group-hover:text-blue-600">Innova on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">7-seater MPV from ₹2,499/day</p>
            </Link>
            <Link href="/outstation-car-rental" className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🛣️</div>
              <h3 className="font-bold text-lg group-hover:text-blue-600">Outstation Rental</h3>
              <p className="text-sm text-gray-600 mt-2">With driver from ₹14/km</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="self-drive-car-rental" />
    </>
  );
}
