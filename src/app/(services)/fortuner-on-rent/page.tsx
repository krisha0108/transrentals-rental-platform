import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: 'Fortuner on Rent Without Driver | Self Drive Fortuner @₹4999/Day | TransRentals',
  description: 'Rent Toyota Fortuner without driver across India. Self-drive Fortuner rental for premium travel, weddings & VIP transport. 7-seater luxury SUV. Book now!',
  keywords: [
    'fortuner on rent',
    'toyota fortuner on rent',
    'fortuner self drive',
    'rent fortuner without driver',
    'fortuner rental near me',
    'luxury suv rental',
  ],
  openGraph: {
    title: 'Fortuner on Rent Without Driver @₹4999/Day | TransRentals',
    description: 'Self-drive Toyota Fortuner rental. Premium 7-seater SUV for luxury travel.',
    type: 'website',
    url: 'https://transrentals.in/fortuner-on-rent',
  },
  alternates: {
    canonical: 'https://transrentals.in/fortuner-on-rent',
  },
};

const fortunerVariants = [
  { name: 'Toyota Fortuner 4x2', price: 4999, fuel: 'Diesel', transmission: 'Manual', seats: 7, features: 'AC, Touchscreen, Reverse Camera' },
  { name: 'Toyota Fortuner 4x2 AT', price: 5499, fuel: 'Diesel', transmission: 'Automatic', seats: 7, features: 'Auto, Premium Audio, Sunroof' },
  { name: 'Toyota Fortuner 4x4', price: 5999, fuel: 'Diesel', transmission: 'Manual', seats: 7, features: '4WD, Off-Road Ready' },
  { name: 'Toyota Fortuner 4x4 AT', price: 6499, fuel: 'Diesel', transmission: 'Automatic', seats: 7, features: 'Top Variant, All Features' },
  { name: 'Toyota Fortuner Legender', price: 7499, fuel: 'Diesel', transmission: 'Automatic', seats: 7, features: 'Premium Edition, Unique Styling' },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function FortunerOnRentPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Premium Luxury SUV"
        title="Fortuner on Rent Without Driver"
        titleHighlight="Starting @₹4999/Day"
        description="India's most aspirational SUV for rent. Commanding presence, powerful performance, premium luxury. Perfect for VIP travel, weddings & special occasions."
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Luxury SUV', color: 'text-yellow-600' },
        ]}
        gradientFrom="yellow-50"
        gradientTo="amber-50"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Toyota Fortuner on Rent Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Fortuner 4x2 • Fortuner 4x4 • Fortuner Legender
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition">
                View Variants & Prices
              </a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Fortuner */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent a Toyota Fortuner?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '👑', title: 'Premium Status', desc: 'Make a statement' },
              { icon: '💪', title: 'Powerful Engine', desc: '2.8L Diesel, 204 HP' },
              { icon: '🏔️', title: '4x4 Capability', desc: 'Go anywhere' },
              { icon: '🛡️', title: '7 Airbags', desc: 'Maximum safety' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fortuner Variants */}
      <section id="variants" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-4">Fortuner Variants Available</h2>
          <p className="text-center text-gray-600 mb-12">Premium SUV variants for every need</p>
          <div className="grid md:grid-cols-3 gap-6">
            {fortunerVariants.map((variant) => (
              <div key={variant.name} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="bg-gray-900 text-white p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm opacity-75">{variant.transmission}</p>
                      <h3 className="text-xl font-bold">{variant.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-400">₹{variant.price}</p>
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
                  <button className="w-full bg-yellow-500 text-black py-2 rounded-lg font-semibold hover:bg-yellow-400 transition">
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
            Fortuner is Perfect For
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '💒', title: 'Weddings', desc: 'Grand entry for the couple' },
              { icon: '💼', title: 'VIP Travel', desc: 'Executive & corporate' },
              { icon: '🏔️', title: 'Adventure Trips', desc: 'Ladakh, mountains, off-road' },
              { icon: '🎬', title: 'Special Events', desc: 'Film shoots, events' },
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

      {/* 4x2 vs 4x4 */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Fortuner 4x2 vs 4x4 - Which One?
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-yellow-400 mb-4">4x2 (Two-Wheel Drive)</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>✓ City driving & highways</li>
                  <li>✓ Better fuel economy</li>
                  <li>✓ Lower rental cost</li>
                  <li>✓ Perfect for regular trips</li>
                </ul>
                <p className="mt-4 text-yellow-400 font-semibold">From ₹4,999/day</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl border-2 border-yellow-500">
                <h3 className="text-xl font-bold text-yellow-400 mb-4">4x4 (Four-Wheel Drive)</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>✓ Off-road capability</li>
                  <li>✓ Mountain & rough terrain</li>
                  <li>✓ All-weather confidence</li>
                  <li>✓ Adventure & exploration</li>
                </ul>
                <p className="mt-4 text-yellow-400 font-semibold">From ₹5,999/day</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Fortuner on Rent in 200+ Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/fortuner-on-rent/${city.slug}`}
                className="p-3 bg-gray-50 rounded-lg text-center hover:bg-yellow-50 hover:border-yellow-300 border border-gray-200 transition"
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
            Other Premium Options
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href="/innova-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚐</div>
              <h3 className="font-bold text-lg group-hover:text-yellow-600">Innova on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">7-seater MPV from ₹2,499/day</p>
            </Link>
            <Link href="/creta-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚙</div>
              <h3 className="font-bold text-lg group-hover:text-yellow-600">Creta on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">Popular SUV from ₹1,999/day</p>
            </Link>
            <Link href="/self-drive-suv-rental" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚘</div>
              <h3 className="font-bold text-lg group-hover:text-yellow-600">All SUVs</h3>
              <p className="text-sm text-gray-600 mt-2">Seltos, Scorpio, XUV700</p>
            </Link>
            <Link href="/outstation-car-rental" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🛣️</div>
              <h3 className="font-bold text-lg group-hover:text-yellow-600">Outstation Rental</h3>
              <p className="text-sm text-gray-600 mt-2">With driver from ₹22/km</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="self-drive-car-rental" />
    </>
  );
}
