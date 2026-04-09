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

      <FAQSection service="self-drive-car-rental" />
    </>
  );
}
