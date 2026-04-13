import { Metadata } from 'next';
import Link from 'next/link';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Scorpio on Rent Without Driver | Self Drive @₹2499/Day | TransRentals'),
  description: formatPriceHighlight('Rent Mahindra Scorpio-N without driver across India. Rugged SUV for adventure trips, outstation. 6 & 7 seater. Book now!'),
  keywords: ['scorpio on rent', 'mahindra scorpio on rent', 'scorpio n self drive', 'rent scorpio without driver'],
  openGraph: { title: formatPriceHighlight('Scorpio on Rent Without Driver @₹2499/Day'), url: 'https://transrentals.in/scorpio-on-rent' },
  alternates: { canonical: 'https://transrentals.in/scorpio-on-rent' },
};

const topCities = ALL_CITIES.slice(0, 60);

export default function ScorpioOnRentPage() {
  return (
    <>
      <SwiftRentalTypeHero
        vehicleName="Mahindra Scorpio"
        selfDrivePrice="₹2,499/day"
      />

      <section className="relative bg-gradient-to-br from-amber-700 to-orange-800 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Mahindra Scorpio on Rent</h1>
            <p className="text-xl opacity-90 mb-8">Scorpio-N Z4 • Z6 • Z8 • Z8 L • Scorpio Classic</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-amber-700 transition">Find Near You</a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Rent Scorpio?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '💪', title: 'Powerful Engine', desc: '2.2L mHawk Diesel' },
              { icon: '🏔️', title: '4x4 Option', desc: 'Go anywhere capability' },
              { icon: '👥', title: '6/7 Seater', desc: 'Family-friendly space' },
              { icon: '🛡️', title: 'Rugged Build', desc: 'Built for tough roads' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-amber-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Perfect For</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏔️', title: 'Mountain Trips', desc: 'Ladakh, Spiti, Himalayas' },
              { icon: '🏕️', title: 'Adventure Travel', desc: 'Off-road capable' },
              { icon: '👨‍👩‍👧‍👦', title: 'Family Outstation', desc: 'Space for 7 + luggage' },
              { icon: '💒', title: 'Weddings', desc: 'Grand entry vehicle' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-lg text-center shadow-sm">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Scorpio on Rent Across India</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/scorpio-on-rent/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-amber-50 border border-gray-200 transition">
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
