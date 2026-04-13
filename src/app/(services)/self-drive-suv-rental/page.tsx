import { Metadata } from 'next';
import Link from 'next/link';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Self Drive SUV Rental India | Rent SUV Without Driver @₹1999/Day | TransRentals'),
  description: formatPriceHighlight('Rent SUV without driver across India. Creta, Seltos, Scorpio, XUV700, Fortuner available. Self-drive SUV rental for road trips, family travel. Book online!'),
  keywords: [
    'self drive suv rental',
    'suv on rent without driver',
    'rent suv india',
    'self drive creta',
    'suv rental for road trip',
    'family suv rental',
  ],
  openGraph: {
    title: formatPriceHighlight('Self Drive SUV Rental India @₹1999/Day | TransRentals'),
    description: formatPriceHighlight('Rent SUVs without driver. Creta, Seltos, Scorpio, Fortuner available.'),
    type: 'website',
    url: 'https://transrentals.in/self-drive-suv-rental',
  },
  alternates: {
    canonical: 'https://transrentals.in/self-drive-suv-rental',
  },
};

const topCities = ALL_CITIES.slice(0, 60);

export default function SelfDriveSUVRentalPage() {
  return (
    <>
      <SwiftRentalTypeHero
        vehicleName="Self Drive SUV"
        selfDrivePrice="₹1,999/day"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-800 to-blue-900 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Self Drive SUV Rental Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Creta • Seltos • Scorpio • XUV700 • Fortuner • Harrier
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-slate-800 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why SUV */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent an SUV?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '👨‍👩‍👧‍👦', title: 'Family Friendly', desc: '5-7 seater options for families' },
              { icon: '🧳', title: 'Boot Space', desc: 'Large luggage capacity' },
              { icon: '🏔️', title: 'Road Trips', desc: 'Perfect for highways & hills' },
              { icon: '💪', title: 'Powerful', desc: 'Handle any terrain with ease' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUV Models */}
      {/* Cities */}
      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Self Drive SUV Rental Across India
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/self-drive-suv-rental/${city.slug}`}
                className="p-3 bg-gray-50 rounded-lg text-center hover:bg-blue-50 hover:border-blue-300 border border-gray-200 transition"
              >
                <span className="font-medium text-gray-800">{city.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Perfect For
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏖️', title: 'Family Vacations', desc: 'Goa, Kerala, Rajasthan trips' },
              { icon: '🏔️', title: 'Hill Station Trips', desc: 'Manali, Ooty, Munnar drives' },
              { icon: '💼', title: 'Business Travel', desc: 'Airport transfers, client visits' },
              { icon: '🎉', title: 'Weekend Getaways', desc: 'Nearby destinations, quick trips' },
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

      <FAQSection service="self-drive-car-rental" />
    </>
  );
}
