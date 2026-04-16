import { Metadata } from 'next';
import Link from 'next/link';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
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

const topCities = ALL_CITIES.slice(0, 60);

export default function InnovaOnRentPage() {
  return (
    <>
      <SwiftRentalTypeHero
        vehicleName="Toyota Innova"
        selfDrivePrice="₹2,499"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-800 to-blue-950 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Toyota Innova Crysta on Rent Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Crysta GX • Crysta VX • Crysta ZX • Innova HyCross
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-800 transition">
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

      {/* Cities */}
      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Innova on Rent Across India
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
        </div>
      </section>

      <FAQSection service="self-drive-car-rental" />
    </>
  );
}
