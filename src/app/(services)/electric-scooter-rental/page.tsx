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
