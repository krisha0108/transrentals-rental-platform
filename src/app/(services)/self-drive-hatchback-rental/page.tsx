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

      <FAQSection service="self-drive-car-rental" />
    </>
  );
}
