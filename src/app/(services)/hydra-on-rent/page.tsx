import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: 'Hydra on Rent | Hydra Crane Rental @₹6000/Day | TransRentals',
  description: 'Hire hydra crane on rent for loading, unloading, construction. 8T-14T capacity. Operator included. Starting ₹6000/day. Book now!',
  keywords: ['hydra on rent', 'hydra crane rental', 'hydra crane hire', 'pick and carry crane'],
  openGraph: { title: 'Hydra on Rent @₹6000/Day | TransRentals', url: 'https://transrentals.in/hydra-on-rent' },
  alternates: { canonical: 'https://transrentals.in/hydra-on-rent' },
};

const hydraTypes = [
  { name: 'Hydra 8 Ton', price: 6000, boom: '9m', useCase: 'Light loading/unloading' },
  { name: 'Hydra 10 Ton', price: 7000, boom: '12m', useCase: 'Medium construction work' },
  { name: 'Hydra 12 Ton', price: 8000, boom: '15m', useCase: 'Heavy material handling' },
  { name: 'Hydra 14 Ton', price: 9000, boom: '18m', useCase: 'Industrial applications' },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function HydraOnRentPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Pick & Carry Crane"
        title="Hydra on Rent"
        titleHighlight="Starting @₹6000/Day"
        description="Hire hydra crane for loading, unloading, and material handling. Versatile pick & carry crane for construction sites and warehouses."
        features={[
          { icon: 'star', text: '8T-14T Capacity', color: 'text-amber-500' },
          { icon: 'shield', text: 'Operator Included', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Quick Deployment', color: 'text-yellow-600' },
        ]}
        gradientFrom="yellow-50"
        gradientTo="amber-50"
      />

      <section className="relative bg-gradient-to-br from-yellow-600 to-amber-700 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Hydra Crane on Rent</h1>
            <p className="text-xl opacity-90 mb-8">8 Ton • 10 Ton • 12 Ton • 14 Ton</p>
            <a href="#types" className="inline-block bg-white text-yellow-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Options & Prices</a>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Hydra Crane?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🔄', title: 'Pick & Carry', desc: 'Lift and move in one go' },
              { icon: '🚗', title: 'Self-Propelled', desc: 'No additional transport' },
              { icon: '📐', title: 'Compact Size', desc: 'Works in tight spaces' },
              { icon: '⚡', title: 'Quick Setup', desc: 'Minimal deployment time' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-yellow-50 rounded-lg">
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
          <h2 className="text-3xl font-bold text-center mb-12">Hydra Types & Pricing</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {hydraTypes.map((h) => (
              <div key={h.name} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="bg-yellow-600 text-white p-4">
                  <p className="text-sm opacity-75">Boom: {h.boom}</p>
                  <h3 className="text-lg font-bold">{h.name}</h3>
                  <p className="text-2xl font-bold mt-2">₹{h.price.toLocaleString()}<span className="text-sm opacity-75">/day</span></p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-4">{h.useCase}</p>
                  <button className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition">Get Quote</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Hydra on Rent in 200+ Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/hydra-on-rent/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-yellow-50 border border-gray-200 transition">
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
            <Link href="/crane-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-yellow-600">Crane on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">Mobile & tower cranes</p>
            </Link>
            <Link href="/jcb-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-yellow-600">JCB on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹4,000/day</p>
            </Link>
            <Link href="/excavator-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-yellow-600">Excavator on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹5,000/day</p>
            </Link>
            <Link href="/equipment-rental" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-yellow-600">All Equipment</h3>
              <p className="text-sm text-gray-600 mt-2">View all options</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="equipment-rental" />
    </>
  );
}
