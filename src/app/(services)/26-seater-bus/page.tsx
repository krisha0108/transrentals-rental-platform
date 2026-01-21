import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: '26 Seater Bus on Rent | Mini Bus Hire @₹28/km | TransRentals',
  description: 'Book 26 seater mini bus on rent for weddings, corporate events, school trips. AC/Non-AC with driver. Starting ₹28/km. Book now!',
  keywords: ['26 seater bus', '26 seater bus on rent', 'mini bus rental', '26 seater bus price'],
  openGraph: {
    title: '26 Seater Bus on Rent @₹28/km | TransRentals',
    url: 'https://transrentals.in/26-seater-bus',
  },
  alternates: { canonical: 'https://transrentals.in/26-seater-bus' },
};

const variants = [
  { name: '26 Seater Non-AC', price: 28, features: 'Standard seats, Music System, Luggage Space' },
  { name: '26 Seater AC', price: 35, features: 'Air Conditioned, Comfortable Seats, LCD Screen' },
  { name: '26 Seater Luxury', price: 45, features: 'Premium Interiors, Reclining Seats, LED TV, Washroom' },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function TwentySixSeaterBusPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Mini Bus for Large Groups"
        title="26 Seater Bus on Rent"
        titleHighlight="Starting @₹28/km"
        description="26 seater mini bus for weddings, corporate events, school trips & pilgrimages. AC & Non-AC options with professional driver."
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Driver Included', color: 'text-emerald-600' },
          { icon: 'zap', text: '26 Seats', color: 'text-green-600' },
        ]}
        gradientFrom="green-50"
        gradientTo="teal-50"
      />

      <section className="relative bg-gradient-to-br from-green-700 to-teal-700 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">26 Seater Bus on Rent</h1>
            <p className="text-xl opacity-90 mb-8">Non-AC • AC • Luxury Variants</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Variants & Prices</a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-700 transition">Find Near You</a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Choose 26 Seater Bus?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '👥', title: 'Large Capacity', desc: 'Fits 24-26 people' },
              { icon: '💰', title: 'Best Value', desc: 'Lowest per-person cost' },
              { icon: '🧳', title: 'Huge Luggage', desc: 'Separate luggage compartment' },
              { icon: '🚻', title: 'Washroom Option', desc: 'Available in luxury variant' },
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

      <section id="variants" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">26 Seater Bus Variants & Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {variants.map((variant) => (
              <div key={variant.name} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="bg-green-700 text-white p-4">
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
                  <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">Book Now</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-green-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Perfect For</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '💒', title: 'Weddings', desc: 'Baraat & guest transport' },
              { icon: '🏢', title: 'Corporate', desc: 'Office outings & events' },
              { icon: '🎓', title: 'School Trips', desc: 'Educational excursions' },
              { icon: '🛕', title: 'Pilgrimages', desc: 'Religious group tours' },
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">26 Seater Bus in 200+ Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/26-seater-bus/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-green-50 border border-gray-200 transition">
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
              <h3 className="font-bold text-lg group-hover:text-green-600">12 Seater</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹18/km</p>
            </Link>
            <Link href="/17-seater-tempo-traveller" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-green-600">17 Seater</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹20/km</p>
            </Link>
            <Link href="/20-seater-tempo-traveller" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-green-600">20 Seater</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹22/km</p>
            </Link>
            <Link href="/bus-rental" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-green-600">All Buses</h3>
              <p className="text-sm text-gray-600 mt-2">35+ seater options</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="bus-rental" />
    </>
  );
}
