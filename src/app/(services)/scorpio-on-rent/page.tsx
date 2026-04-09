import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
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

const topCities = ALL_CITIES.slice(0, 12);

export default function ScorpioOnRentPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Big Daddy of SUVs"
        title="Scorpio on Rent Without Driver"
        titleHighlight="Starting @₹2499/Day"
        description="Mahindra Scorpio-N - The rugged, powerful SUV for adventure trips and outstation travel. 6 & 7 seater options with 4x4."
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: '4x4 Available', color: 'text-amber-600' },
        ]}
        gradientFrom="amber-50"
        gradientTo="orange-50"
      />

      <section className="relative bg-gradient-to-br from-amber-700 to-orange-800 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Mahindra Scorpio on Rent</h1>
            <p className="text-xl opacity-90 mb-8">Scorpio-N Z4 • Z6 • Z8 • Z8 L • Scorpio Classic</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-amber-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Variants</a>
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Scorpio on Rent in 200+ Cities</h2>
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
