import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: 'Generator on Rent | DG Set Rental @₹3000/Day | TransRentals',
  description: 'Hire generator on rent for events, construction, industrial backup. 5KVA to 500KVA. Diesel generators with fuel. Book now!',
  keywords: ['generator on rent', 'dg set on rent', 'generator rental', 'diesel generator hire', 'power backup rental'],
  openGraph: { title: 'Generator on Rent @₹3000/Day | TransRentals', url: 'https://transrentals.in/generator-on-rent' },
  alternates: { canonical: 'https://transrentals.in/generator-on-rent' },
};

const topCities = ALL_CITIES.slice(0, 12);

export default function GeneratorOnRentPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Power Backup Solutions"
        title="Generator on Rent"
        titleHighlight="Starting @₹1500/Day"
        description="Hire diesel generators for events, construction sites, industrial backup. Silent DG sets from 5KVA to 500KVA with fuel option."
        features={[
          { icon: 'star', text: '5-500 KVA', color: 'text-amber-500' },
          { icon: 'shield', text: 'Silent Operation', color: 'text-emerald-600' },
          { icon: 'zap', text: 'With Fuel Option', color: 'text-blue-600' },
        ]}
        gradientFrom="blue-50"
        gradientTo="indigo-50"
      />

      <section className="relative bg-gradient-to-br from-blue-700 to-indigo-800 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Generator on Rent Across India</h1>
            <p className="text-xl opacity-90 mb-8">5 KVA • 15 KVA • 25 KVA • 62.5 KVA • 125 KVA • 250 KVA+</p>
            <a href="#types" className="inline-block bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Options & Prices</a>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Rent Generator?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🔇', title: 'Silent DG Sets', desc: 'Low noise operation' },
              { icon: '⛽', title: 'Fuel Included', desc: 'Optional fuel supply' },
              { icon: '🔧', title: 'Well Maintained', desc: 'Regular servicing' },
              { icon: '🚚', title: 'Delivery & Setup', desc: 'Doorstep service' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-blue-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Use Cases</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🎪', title: 'Events', desc: 'Weddings, exhibitions, concerts' },
              { icon: '🏗️', title: 'Construction', desc: 'Building sites, projects' },
              { icon: '🏭', title: 'Industrial', desc: 'Factory power backup' },
              { icon: '🏠', title: 'Residential', desc: 'Home & society backup' },
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Generator on Rent in 200+ Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/generator-on-rent/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-blue-50 border border-gray-200 transition">
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
