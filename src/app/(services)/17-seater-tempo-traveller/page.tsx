import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: '17 Seater Tempo Traveller on Rent | Hire @₹20/km | TransRentals',
  description: 'Book 17 seater tempo traveller on rent for large group travel, weddings, corporate events. AC/Non-AC options. Driver included. Starting ₹20/km. Book now!',
  keywords: ['17 seater tempo traveller', '17 seater tempo traveller on rent', '17 seater bus rental', 'tempo traveller 17 seater price'],
  openGraph: {
    title: '17 Seater Tempo Traveller on Rent @₹20/km | TransRentals',
    description: 'Hire 17 seater tempo traveller with driver for large group travel.',
    url: 'https://transrentals.in/17-seater-tempo-traveller',
  },
  alternates: { canonical: 'https://transrentals.in/17-seater-tempo-traveller' },
};

const variants = [
  { name: '17 Seater Non-AC', price: 20, features: 'Push-back seats, Music System, Luggage Carrier' },
  { name: '17 Seater AC', price: 25, features: 'Air Conditioned, Push-back Seats, LCD Screen' },
  { name: '17 Seater Deluxe', price: 30, features: 'Premium Interiors, Reclining Seats, LED TV' },
  { name: '17 Seater Maharaja', price: 38, features: '2x1 Seating, Luxury Interiors, Premium Sound' },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function SeventeenSeaterTempoTravellerPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Perfect for 15-17 People"
        title="17 Seater Tempo Traveller"
        titleHighlight="Starting @₹20/km"
        description="Spacious 17 seater tempo traveller for large group travel, weddings, corporate events & pilgrimages. AC & Non-AC options with professional driver."
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Driver Included', color: 'text-emerald-600' },
          { icon: 'zap', text: '17 Seats', color: 'text-purple-600' },
        ]}
        gradientFrom="purple-50"
        gradientTo="indigo-50"
      />

      <section className="relative bg-gradient-to-br from-purple-700 to-indigo-800 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">17 Seater Tempo Traveller on Rent</h1>
            <p className="text-xl opacity-90 mb-8">Non-AC • AC • Deluxe • Maharaja Variants</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-purple-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Variants & Prices</a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-700 transition">Find Near You</a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Choose 17 Seater Tempo Traveller?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '👥', title: 'Large Capacity', desc: 'Fits 15-17 people comfortably' },
              { icon: '💺', title: '2x1 Option', desc: 'Extra spacious Maharaja layout' },
              { icon: '🧳', title: 'More Luggage', desc: 'Bigger carrier & boot space' },
              { icon: '🎬', title: 'Entertainment', desc: 'LED TV & music system' },
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

      <section id="variants" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-4">17 Seater Variants & Pricing</h2>
          <p className="text-center text-gray-600 mb-12">Choose based on comfort level and budget</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {variants.map((variant) => (
              <div key={variant.name} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="bg-purple-700 text-white p-4">
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
                  <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">Book Now</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-purple-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Perfect For</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '💒', title: 'Weddings', desc: 'Baraat & guest pickup' },
              { icon: '🏢', title: 'Corporate Events', desc: 'Team outings & conferences' },
              { icon: '🛕', title: 'Religious Tours', desc: 'Char Dham, temple visits' },
              { icon: '🎓', title: 'School/College', desc: 'Educational trips' },
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">17 Seater Tempo Traveller in 200+ Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/17-seater-tempo-traveller/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-purple-50 border border-gray-200 transition">
                <span className="font-medium text-gray-800">{city.name}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6"><p className="text-gray-600">+ 190 more cities available</p></div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Other Tempo Traveller Options</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href="/12-seater-tempo-traveller" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚐</div>
              <h3 className="font-bold text-lg group-hover:text-purple-600">12 Seater</h3>
              <p className="text-sm text-gray-600 mt-2">Smaller groups from ₹18/km</p>
            </Link>
            <Link href="/20-seater-tempo-traveller" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚌</div>
              <h3 className="font-bold text-lg group-hover:text-purple-600">20 Seater</h3>
              <p className="text-sm text-gray-600 mt-2">Larger groups from ₹22/km</p>
            </Link>
            <Link href="/26-seater-bus" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚍</div>
              <h3 className="font-bold text-lg group-hover:text-purple-600">26 Seater Bus</h3>
              <p className="text-sm text-gray-600 mt-2">Full-size bus from ₹28/km</p>
            </Link>
            <Link href="/tempo-traveller" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚎</div>
              <h3 className="font-bold text-lg group-hover:text-purple-600">All Options</h3>
              <p className="text-sm text-gray-600 mt-2">View all tempo travellers</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="bus-rental" />
    </>
  );
}
