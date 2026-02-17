import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Crane on Rent | Mobile Crane Rental @₹8000/Day | TransRentals'),
  description: formatPriceHighlight('Hire crane on rent for construction, industrial projects. Mobile crane, tower crane, hydra crane available. 10-100 ton capacity. Book now!'),
  keywords: ['crane on rent', 'crane rental', 'mobile crane hire', 'tower crane rental', 'construction crane'],
  openGraph: { title: formatPriceHighlight('Crane on Rent @₹8000/Day | TransRentals'), url: 'https://transrentals.in/crane-on-rent' },
  alternates: { canonical: 'https://transrentals.in/crane-on-rent' },
};

const craneTypes = [
  { name: 'Hydra Crane (12T)', price: 8000, capacity: '12 Ton', useCase: 'Loading/unloading, small construction' },
  { name: 'Mobile Crane (20T)', price: 12000, capacity: '20 Ton', useCase: 'Medium construction, industrial' },
  { name: 'Mobile Crane (35T)', price: 18000, capacity: '35 Ton', useCase: 'Heavy construction, infrastructure' },
  { name: 'Mobile Crane (50T)', price: 25000, capacity: '50 Ton', useCase: 'Large projects, heavy lifting' },
  { name: 'Crawler Crane (100T)', price: 45000, capacity: '100 Ton', useCase: 'Major infrastructure, ports' },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function CraneOnRentPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Heavy Equipment Rental"
        title="Crane on Rent"
        titleHighlight="Starting @₹8000/Day"
        description="Hire cranes for construction, industrial, and infrastructure projects. Mobile cranes, tower cranes, hydra cranes. 10-100 ton capacity with operator."
        features={[
          { icon: 'star', text: 'All Capacities', color: 'text-amber-500' },
          { icon: 'shield', text: 'Operator Included', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Pan India', color: 'text-orange-600' },
        ]}
        gradientFrom="orange-50"
        gradientTo="yellow-50"
      />

      <section className="relative bg-gradient-to-br from-orange-600 to-yellow-600 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Crane on Rent Across India</h1>
            <p className="text-xl opacity-90 mb-8">Hydra • Mobile Crane • Crawler Crane • Tower Crane</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#types" className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Crane Types</a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition">Find Near You</a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Rent Crane from Us?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏗️', title: 'All Capacities', desc: '10T to 500T available' },
              { icon: '👷', title: 'Trained Operators', desc: 'Certified professionals' },
              { icon: '🔧', title: 'Well Maintained', desc: 'Regular servicing' },
              { icon: '📋', title: 'All Compliances', desc: 'Licensed & insured' },
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

      <section id="types" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">Crane Types & Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {craneTypes.map((crane) => (
              <div key={crane.name} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="bg-orange-600 text-white p-4">
                  <p className="text-sm opacity-75">{crane.capacity}</p>
                  <h3 className="text-lg font-bold">{crane.name}</h3>
                  <p className="text-2xl font-bold mt-2">₹{crane.price.toLocaleString()}<span className="text-sm opacity-75">/day</span></p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-4">{crane.useCase}</p>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>✓ Operator included</li>
                    <li>✓ Fuel extra</li>
                    <li>✓ Insurance covered</li>
                  </ul>
                  <button className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition">Get Quote</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-orange-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Applications</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏗️', title: 'Construction', desc: 'Building & infrastructure' },
              { icon: '🏭', title: 'Industrial', desc: 'Factory & plant work' },
              { icon: '🚢', title: 'Ports', desc: 'Container handling' },
              { icon: '🌉', title: 'Infrastructure', desc: 'Bridges, flyovers' },
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Crane Rental in 200+ Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/crane-on-rent/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-orange-50 border border-gray-200 transition">
                <span className="font-medium text-gray-800">{city.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Other Equipment</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href="/hydra-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-orange-600">Hydra on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹6,000/day</p>
            </Link>
            <Link href="/jcb-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-orange-600">JCB on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹4,000/day</p>
            </Link>
            <Link href="/excavator-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-orange-600">Excavator on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹5,000/day</p>
            </Link>
            <Link href="/equipment-rental" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-orange-600">All Equipment</h3>
              <p className="text-sm text-gray-600 mt-2">View all options</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="equipment-rental" />
    </>
  );
}
