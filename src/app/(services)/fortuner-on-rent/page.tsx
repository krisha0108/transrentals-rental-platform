import { Metadata } from 'next';
import Link from 'next/link';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
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

const topCities = ALL_CITIES.slice(0, 60);

export default function FortunerOnRentPage() {
  return (
    <>
      <SwiftRentalTypeHero
        vehicleName="Toyota Fortuner"
        selfDrivePrice="₹4,999"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-800 to-slate-900 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Toyota Fortuner on Rent Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Fortuner 4x2 • Fortuner 4x4 • Fortuner Legender
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-slate-900 transition">
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

      {/* Cities */}
      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Fortuner on Rent Across India
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
        </div>
      </section>

      <FAQSection service="self-drive-car-rental" />
    </>
  );
}
