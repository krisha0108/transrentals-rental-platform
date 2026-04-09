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

      <FAQSection service="equipment-rental" />
    </>
  );
}
