import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: '20 Seater Tempo Traveller on Rent | Hire @₹22/km | TransRentals',
  description: 'Book 20 seater tempo traveller on rent for large groups, weddings, pilgrimages. AC/Non-AC with driver. Starting ₹22/km. Book now!',
  keywords: ['20 seater tempo traveller', '20 seater bus on rent', '20 seater tempo traveller price'],
  openGraph: {
    title: '20 Seater Tempo Traveller on Rent @₹22/km | TransRentals',
    url: 'https://transrentals.in/20-seater-tempo-traveller',
  },
  alternates: { canonical: 'https://transrentals.in/20-seater-tempo-traveller' },
};

const variants = [
  { name: '20 Seater Non-AC', price: 22, features: 'Push-back seats, Music System, Large Luggage Carrier' },
  { name: '20 Seater AC', price: 28, features: 'Air Conditioned, Comfortable Seats, LCD Screen' },
  { name: '20 Seater Deluxe', price: 34, features: 'Premium Interiors, Reclining Seats, LED TV' },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function TwentySeaterTempoTravellerPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Perfect for 18-20 People"
        title="20 Seater Tempo Traveller"
        titleHighlight="Starting @₹22/km"
        description="Large 20 seater tempo traveller for big groups, weddings, corporate events & pilgrimages. AC & Non-AC options with professional driver."
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Driver Included', color: 'text-emerald-600' },
          { icon: 'zap', text: '20 Seats', color: 'text-orange-600' },
        ]}
        gradientFrom="orange-50"
        gradientTo="red-50"
      />

      <section className="relative bg-gradient-to-br from-orange-600 to-red-700 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">20 Seater Tempo Traveller on Rent</h1>
            <p className="text-xl opacity-90 mb-8">Non-AC • AC • Deluxe Variants</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-orange-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Variants & Prices</a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-700 transition">Find Near You</a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Choose 20 Seater?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '👥', title: 'Big Capacity', desc: 'Fits 18-20 people' },
              { icon: '🧳', title: 'Extra Luggage', desc: 'Large carrier space' },
              { icon: '💰', title: 'Cost Effective', desc: 'Lower per-person cost' },
              { icon: '🛣️', title: 'Long Distance', desc: 'Comfortable for tours' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="variants" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">20 Seater Variants & Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {variants.map((variant) => (
              <div key={variant.name} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="bg-orange-600 text-white p-4">
                  <h3 className="text-lg font-bold">{variant.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">₹{variant.price}</span>
                    <span className="text-sm opacity-75">/km</span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-4">{variant.features}</p>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>✓ Professional driver</li>
                    <li>✓ Fuel included</li>
                    <li>✓ All permits & tolls</li>
                  </ul>
                  <button className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition">Book Now</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">20 Seater Tempo Traveller in 200+ Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/20-seater-tempo-traveller/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-orange-50 border border-gray-200 transition">
                <span className="font-medium text-gray-800">{city.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Other Options</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href="/12-seater-tempo-traveller" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-orange-600">12 Seater</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹18/km</p>
            </Link>
            <Link href="/17-seater-tempo-traveller" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-orange-600">17 Seater</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹20/km</p>
            </Link>
            <Link href="/26-seater-bus" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-orange-600">26 Seater Bus</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹28/km</p>
            </Link>
            <Link href="/bus-rental" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-orange-600">All Buses</h3>
              <p className="text-sm text-gray-600 mt-2">View all options</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="bus-rental" />
    </>
  );
}
