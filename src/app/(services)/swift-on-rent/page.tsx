import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Swift on Rent Without Driver | Self Drive Swift @₹899/Day | TransRentals'),
  description: formatPriceHighlight('Rent Maruti Swift without driver across India. Self-drive Swift rental for city commute & short trips. Most popular hatchback with great mileage. Book now!'),
  keywords: [
    'swift on rent',
    'maruti swift on rent',
    'swift self drive',
    'rent swift without driver',
    'swift rental near me',
    'swift car rental',
  ],
  openGraph: {
    title: formatPriceHighlight('Swift on Rent Without Driver @₹899/Day | TransRentals'),
    description: formatPriceHighlight('Self-drive Maruti Swift rental. Most popular hatchback for city commute.'),
    type: 'website',
    url: 'https://transrentals.in/swift-on-rent',
  },
  alternates: {
    canonical: 'https://transrentals.in/swift-on-rent',
  },
};

const topCities = ALL_CITIES.slice(0, 12);

export default function SwiftOnRentPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Most Popular Hatchback"
        title="Swift on Rent Without Driver"
        titleHighlight="Starting @₹899/Day"
        description="India's most popular hatchback for rent. Sporty design, peppy performance, excellent mileage. Perfect for city commute and short trips."
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: '22 km/l Mileage', color: 'text-green-600' },
        ]}
        gradientFrom="red-50"
        gradientTo="orange-50"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-red-600 to-orange-600 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Maruti Swift on Rent Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Swift LXi • Swift VXi • Swift ZXi • Swift AMT • Swift CNG
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                View Variants & Prices
              </a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Swift */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent a Maruti Swift?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏎️', title: 'Sporty Design', desc: 'Head-turning looks & style' },
              { icon: '⛽', title: '22 km/l Mileage', desc: 'Best in class fuel efficiency' },
              { icon: '🔧', title: 'Low Maintenance', desc: 'Maruti reliability & service' },
              { icon: '🅿️', title: 'Easy Parking', desc: 'Compact size, perfect for city' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
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
            Swift on Rent in 200+ Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/swift-on-rent/${city.slug}`}
                className="p-3 bg-white rounded-lg text-center hover:bg-red-50 hover:border-red-300 border border-gray-200 transition"
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
