import { Metadata } from 'next';
import Link from 'next/link';
import { getCitiesByPriority } from '@/data/indian-cities';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { FAQSection } from '@/components/services/FAQSection';
import { BikeServiceSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Electric Scooter Rental | EV Bike on Rent @₹399/Day | Ola, Ather, TVS iQube | TransRentals',
  description: 'Rent electric scooters - Ola S1, Ather 450X, TVS iQube, Bajaj Chetak. Zero fuel cost, eco-friendly. Daily & monthly EV rental from ₹399/day. Book now!',
  keywords: [
    'electric scooter rental',
    'ev scooter on rent',
    'ola scooter on rent',
    'ather on rent',
    'electric bike rental',
    'tvs iqube on rent',
    'bajaj chetak rental',
    'ev rental india',
    'electric two wheeler rental',
    'green commute rental',
    'zero emission scooter',
    'electric vehicle rental',
  ],
  openGraph: {
    title: 'Electric Scooter Rental India | EV Bike @₹399/Day | TransRentals',
    description: 'Rent Ola S1, Ather 450X, TVS iQube. Zero fuel cost, eco-friendly. Daily & monthly options.',
    type: 'website',
    url: 'https://transrentals.in/electric-scooter-rental',
    images: [
      {
        url: 'https://transrentals.in/images/og/electric-scooter-rental.jpg',
        width: 1200,
        height: 630,
        alt: 'Electric Scooter Rental - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Electric Scooter Rental | Starting @₹399/Day | TransRentals',
    description: 'Rent Ola, Ather, TVS iQube electric scooters. Zero fuel cost!',
    images: ['https://transrentals.in/images/og/electric-scooter-rental.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/electric-scooter-rental',
  },
};

// Schema data
const schemaFaqs = [
  { question: 'How much does electric scooter rental cost?', answer: 'Electric scooter rental starts from ₹399/day. Monthly rentals start from ₹4,999/month. Premium EVs like Ather 450X cost ₹599/day or ₹7,999/month.' },
  { question: 'Do I need to pay for charging?', answer: 'Charging cost depends on plan. Some include free charging at partner stations. Home charging uses your electricity (₹15-20 per full charge). Much cheaper than petrol!' },
  { question: 'What is the range of electric scooters?', answer: 'Most EVs offer 80-120 km per charge. Ather 450X: 105 km, Ola S1 Pro: 135 km, TVS iQube: 100 km. Sufficient for daily city commute.' },
  { question: 'Where can I charge the electric scooter?', answer: 'You can charge at home (regular socket), public charging stations, or partner charging points. We provide charging cable with the scooter.' },
  { question: 'What documents are needed for EV rental?', answer: 'Same as regular bike: valid driving license, Aadhar card, and refundable security deposit (₹3,000-8,000 depending on model).' },
];

const schemaVehicles = [
  { name: 'Ola S1 Pro', brand: 'Ola Electric', price: 499 },
  { name: 'Ather 450X', brand: 'Ather Energy', price: 599 },
  { name: 'TVS iQube', brand: 'TVS', price: 449 },
  { name: 'Bajaj Chetak', brand: 'Bajaj', price: 549 },
  { name: 'Hero Vida V1', brand: 'Hero', price: 399 },
];

export default function ElectricScooterRentalPage() {
  const popularCities = getCitiesByPriority(8);

  return (
    <>
      {/* Schema Markup */}
      <BikeServiceSchema
        serviceName="Electric Scooter Rental"
        serviceSlug="electric-scooter-rental"
        description="Rent electric scooters across India. Ola S1, Ather 450X, TVS iQube, Bajaj Chetak available. Zero fuel cost, eco-friendly. Starting @₹399/day."
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 399, max: 599 }}
        rating={4.6}
        reviewCount={1234}
      />

      <ServiceHeroWithChat
        badge="Go Green with EV Rental"
        title="Electric Scooter Rental"
        titleHighlight="Zero Fuel Cost @₹399/Day"
        description="Rent Ola S1, Ather 450X, TVS iQube electric scooters. Eco-friendly, silent, smart. Save money on fuel, save the planet."
        gradientFrom="green-50"
        gradientTo="emerald-50"
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 to-emerald-700 text-white py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-semibold mb-4">
              ⚡ The Future of Mobility
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Electric Scooter & EV Bike Rental
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Zero Petrol Cost • Silent Ride • Eco-Friendly • Smart Features
            </p>
            <div className="grid md:grid-cols-4 gap-4 mb-8 text-left">
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="font-semibold">₹0 Fuel</h3>
                <p className="text-xs opacity-90">Only ₹15-20 per charge</p>
              </div>
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">🔇</div>
                <h3 className="font-semibold">Silent Ride</h3>
                <p className="text-xs opacity-90">No noise pollution</p>
              </div>
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">🌍</div>
                <h3 className="font-semibold">Eco-Friendly</h3>
                <p className="text-xs opacity-90">Zero emissions</p>
              </div>
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">📱</div>
                <h3 className="font-semibold">Smart</h3>
                <p className="text-xs opacity-90">App connected</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="#scooters"
                className="bg-yellow-400 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition"
              >
                View EV Models
              </Link>
              <Link
                href="#locations"
                className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-700 transition"
              >
                Check Availability
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why EV */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why Rent Electric Scooter?
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Save ₹3000+ per month on fuel. Experience the future of commuting today.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '💰', title: 'Save ₹3000+/Month', desc: 'Only ₹15-20 per full charge vs ₹150+ petrol' },
              { icon: '🔧', title: 'Low Maintenance', desc: 'No oil changes, fewer parts to service' },
              { icon: '🌱', title: 'Zero Emissions', desc: 'No pollution, contribute to cleaner air' },
              { icon: '🔇', title: 'Silent Operation', desc: 'No engine noise, peaceful commute' },
              { icon: '⚡', title: 'Instant Torque', desc: 'Quick acceleration, fun to ride' },
              { icon: '📱', title: 'Smart Features', desc: 'App control, GPS, digital dashboard' },
              { icon: '🏠', title: 'Home Charging', desc: 'Charge overnight at your home' },
              { icon: '🅿️', title: 'Free Parking', desc: 'Many cities offer free EV parking' },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Comparison */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            EV vs Petrol: Monthly Cost Comparison
          </h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 bg-red-50">
                <h3 className="text-xl font-bold text-red-800 mb-4">⛽ Petrol Scooter</h3>
                <ul className="space-y-3">
                  <li className="flex justify-between">
                    <span>Fuel (30km/day)</span>
                    <span className="font-semibold">₹3,000/month</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Oil change</span>
                    <span className="font-semibold">₹500/month</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Maintenance</span>
                    <span className="font-semibold">₹300/month</span>
                  </li>
                  <li className="flex justify-between border-t pt-3 text-red-800">
                    <span className="font-bold">Total Running Cost</span>
                    <span className="font-bold">₹3,800/month</span>
                  </li>
                </ul>
              </div>
              <div className="p-8 bg-green-50">
                <h3 className="text-xl font-bold text-green-800 mb-4">⚡ Electric Scooter</h3>
                <ul className="space-y-3">
                  <li className="flex justify-between">
                    <span>Charging (30km/day)</span>
                    <span className="font-semibold">₹450/month</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Oil change</span>
                    <span className="font-semibold">₹0</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Maintenance</span>
                    <span className="font-semibold">₹100/month</span>
                  </li>
                  <li className="flex justify-between border-t pt-3 text-green-800">
                    <span className="font-bold">Total Running Cost</span>
                    <span className="font-bold">₹550/month</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="bg-green-600 text-white p-4 text-center">
              <p className="text-xl font-bold">You Save: ₹3,250/month with EV! 🎉</p>
            </div>
          </div>
        </div>
      </section>

      {/* EV Models */}
      <section id="scooters" className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Electric Scooters Available for Rent
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: 'Ola S1 Pro',
                brand: 'Ola Electric',
                price: '499',
                monthly: '5,999',
                range: '135 km',
                topSpeed: '116 kmph',
                features: ['MoveOS 3', '7" Touchscreen', 'Music Speaker', 'Fast Charging'],
                highlight: 'Best Range',
              },
              {
                name: 'Ather 450X',
                brand: 'Ather Energy',
                price: '599',
                monthly: '7,999',
                range: '105 km',
                topSpeed: '90 kmph',
                features: ['AtherStack', 'Google Maps', 'OTA Updates', 'Fast Charging'],
                highlight: 'Premium Choice',
              },
              {
                name: 'TVS iQube',
                brand: 'TVS Motor',
                price: '449',
                monthly: '5,499',
                range: '100 km',
                topSpeed: '78 kmph',
                features: ['TVS SmartXonnect', 'Digital Console', 'Geo-fencing', 'Reliable'],
                highlight: 'Best Value',
              },
              {
                name: 'Bajaj Chetak',
                brand: 'Bajaj Auto',
                price: '549',
                monthly: '6,999',
                range: '90 km',
                topSpeed: '70 kmph',
                features: ['Classic Design', 'Metal Body', 'Feather Touch', 'Premium Feel'],
                highlight: 'Iconic Design',
              },
            ].map((ev) => (
              <div key={ev.name} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition border-t-4 border-green-500">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold">{ev.name}</h3>
                    <p className="text-sm text-gray-500">{ev.brand}</p>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">{ev.highlight}</span>
                </div>
                <div className="my-4">
                  <p className="text-2xl font-bold text-green-700">₹{ev.price}/day</p>
                  <p className="text-sm text-gray-500">Monthly: ₹{ev.monthly}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500 text-xs">Range</p>
                    <p className="font-semibold">{ev.range}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500 text-xs">Top Speed</p>
                    <p className="font-semibold">{ev.topSpeed}</p>
                  </div>
                </div>
                <ul className="space-y-1 text-sm mb-4">
                  {ev.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-green-600">⚡</span> {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
                  Rent Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Cities */}
      <section id="locations" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Electric Scooter Rental in Popular Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularCities.map((city) => (
              <Link
                key={city.slug}
                href={`/electric-scooter-rental/${city.slug}`}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group border-l-4 border-green-500"
              >
                <h3 className="font-semibold text-lg group-hover:text-green-700 transition">
                  {city.name}
                </h3>
                <p className="text-sm text-gray-600">{city.state}</p>
                <p className="text-sm text-green-700 mt-2 font-medium">From ₹399/day →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <LocationsGrid service="electric-scooter-rental" />

      {/* Charging Info */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Charging Made Easy
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="font-semibold text-lg mb-2">Home Charging</h3>
              <p className="text-gray-600 text-sm">Plug into any regular socket. Full charge in 4-6 hours overnight.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-semibold text-lg mb-2">Fast Charging</h3>
              <p className="text-gray-600 text-sm">Use public fast chargers. 0-80% in just 45-60 minutes.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-4">🔌</div>
              <h3 className="font-semibold text-lg mb-2">Partner Stations</h3>
              <p className="text-gray-600 text-sm">Access to Ather Grid, Ola Hypercharger network. Some plans include free charging!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Perfect For */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">
            Perfect For
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🎓', title: 'Students', desc: 'Low running cost, perfect for campus' },
              { icon: '💼', title: 'Professionals', desc: 'Silent commute, smart features' },
              { icon: '🌱', title: 'Eco-Conscious', desc: 'Reduce your carbon footprint' },
              { icon: '🔍', title: 'Try Before Buy', desc: 'Test EVs before purchasing' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQSection service="bike-on-rent" />
    </>
  );
}
