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

      <FAQSection service="equipment-rental" />
    </>
  );
}
