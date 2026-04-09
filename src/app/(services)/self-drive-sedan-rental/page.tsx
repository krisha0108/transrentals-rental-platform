import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Self Drive Sedan Rental India | Rent Sedan Without Driver @₹1299/Day | TransRentals'),
  description: formatPriceHighlight('Rent sedan without driver across India. Honda City, Hyundai Verna, Maruti Ciaz, Skoda Slavia available. Self-drive sedan rental for business & leisure.'),
  keywords: [
    'self drive sedan rental',
    'sedan on rent without driver',
    'rent sedan india',
    'honda city on rent',
    'verna self drive',
    'sedan rental for outstation',
  ],
  openGraph: {
    title: formatPriceHighlight('Self Drive Sedan Rental India @₹1299/Day | TransRentals'),
    description: formatPriceHighlight('Rent sedans without driver. City, Verna, Ciaz available.'),
    type: 'website',
    url: 'https://transrentals.in/self-drive-sedan-rental',
  },
  alternates: {
    canonical: 'https://transrentals.in/self-drive-sedan-rental',
  },
};

const topCities = ALL_CITIES.slice(0, 12);

export default function SelfDriveSedanRentalPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Self Drive Sedan Rental"
        title="Rent Sedan Without Driver"
        titleHighlight="Starting @₹1299/Day"
        description="Self-drive sedan rental for business travel, outstation trips, and comfortable commuting. Stylish, comfortable, and fuel-efficient."
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Great Mileage', color: 'text-blue-600' },
        ]}
        gradientFrom="gray-50"
        gradientTo="blue-50"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-800 to-blue-900 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Self Drive Sedan Rental Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              City • Verna • Ciaz • Dzire • Slavia • Amaze
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#sedans" className="bg-white text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                View Sedan Models
              </a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-800 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Sedan */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent a Sedan?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '💼', title: 'Business Ready', desc: 'Professional appearance' },
              { icon: '⛽', title: 'Fuel Efficient', desc: '15-20+ km/l mileage' },
              { icon: '🛋️', title: 'Comfortable', desc: 'Plush seating, smooth ride' },
              { icon: '🛣️', title: 'Highway Ready', desc: 'Perfect for long drives' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sedan Models */}
      {/* Cities */}
      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Self Drive Sedan Rental in 200+ Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/self-drive-sedan-rental/${city.slug}`}
                className="p-3 bg-gray-50 rounded-lg text-center hover:bg-blue-50 hover:border-blue-300 border border-gray-200 transition"
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
