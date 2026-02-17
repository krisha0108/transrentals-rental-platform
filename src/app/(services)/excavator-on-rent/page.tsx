import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Excavator on Rent | Excavator Hire @₹5000/Day | TransRentals'),
  description: formatPriceHighlight('Hire excavator on rent for digging, trenching, construction. Mini to large excavators. Operator included. Starting ₹5000/day. Book now!'),
  keywords: ['excavator on rent', 'excavator rental', 'excavator hire', 'poclain on rent', 'hitachi excavator rental'],
  openGraph: { title: formatPriceHighlight('Excavator on Rent @₹5000/Day | TransRentals'), url: 'https://transrentals.in/excavator-on-rent' },
  alternates: { canonical: 'https://transrentals.in/excavator-on-rent' },
};

const excavatorTypes = [
  { name: 'Mini Excavator (3T)', price: 5000, bucket: '0.1 m³', useCase: 'Small trenching, landscaping' },
  { name: 'Excavator 75 (7.5T)', price: 7000, bucket: '0.3 m³', useCase: 'Medium construction' },
  { name: 'Excavator 110 (11T)', price: 9000, bucket: '0.5 m³', useCase: 'Heavy digging, foundation' },
  { name: 'Excavator 200 (20T)', price: 12000, bucket: '0.8 m³', useCase: 'Major construction, mining' },
  { name: 'Excavator 350 (35T)', price: 18000, bucket: '1.4 m³', useCase: 'Large infrastructure' },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function ExcavatorOnRentPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Digging & Earthmoving"
        title="Excavator on Rent"
        titleHighlight="Starting @₹5000/Day"
        description="Hire excavator for digging, trenching, earthmoving, and demolition. Mini to large excavators with trained operators."
        features={[
          { icon: 'star', text: '3T-35T Range', color: 'text-amber-500' },
          { icon: 'shield', text: 'Operator Included', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Pan India', color: 'text-amber-600' },
        ]}
        gradientFrom="amber-50"
        gradientTo="yellow-50"
      />

      <section className="relative bg-gradient-to-br from-amber-600 to-yellow-600 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Excavator on Rent Across India</h1>
            <p className="text-xl opacity-90 mb-8">Mini Excavator • Poclain • Hitachi • Komatsu • JCB</p>
            <a href="#types" className="inline-block bg-white text-amber-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Options & Prices</a>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Rent Excavator?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '⛏️', title: 'Heavy Digging', desc: 'Deep excavation capability' },
              { icon: '🔄', title: '360° Rotation', desc: 'Full swing flexibility' },
              { icon: '🪨', title: 'Versatile', desc: 'Multiple attachments' },
              { icon: '💪', title: 'High Power', desc: 'Tough terrain capable' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-amber-50 rounded-lg">
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
          <h2 className="text-3xl font-bold text-center mb-12">Excavator Types & Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {excavatorTypes.map((e) => (
              <div key={e.name} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="bg-amber-600 text-white p-4">
                  <p className="text-sm opacity-75">Bucket: {e.bucket}</p>
                  <h3 className="text-lg font-bold">{e.name}</h3>
                  <p className="text-2xl font-bold mt-2">₹{e.price.toLocaleString()}<span className="text-sm opacity-75">/day</span></p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-4">{e.useCase}</p>
                  <button className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition">Get Quote</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Excavator on Rent in 200+ Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/excavator-on-rent/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-amber-50 border border-gray-200 transition">
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
            <Link href="/jcb-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-amber-600">JCB on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">Backhoe loader</p>
            </Link>
            <Link href="/crane-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-amber-600">Crane on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹8,000/day</p>
            </Link>
            <Link href="/hydra-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-amber-600">Hydra on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹6,000/day</p>
            </Link>
            <Link href="/equipment-rental" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-amber-600">All Equipment</h3>
              <p className="text-sm text-gray-600 mt-2">View all options</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="equipment-rental" />
    </>
  );
}
