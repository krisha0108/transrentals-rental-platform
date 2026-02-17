import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('XUV700 on Rent Without Driver | Self Drive @₹2999/Day | TransRentals'),
  description: 'Rent Mahindra XUV700 without driver across India. Self-drive XUV700 with ADAS, panoramic sunroof. 5 & 7 seater options. Book now!',
  keywords: ['xuv700 on rent', 'mahindra xuv700 on rent', 'xuv700 self drive', 'rent xuv700 without driver'],
  openGraph: { title: formatPriceHighlight('XUV700 on Rent Without Driver @₹2999/Day | TransRentals'), url: 'https://transrentals.in/xuv700-on-rent' },
  alternates: { canonical: 'https://transrentals.in/xuv700-on-rent' },
};

const variants = [
  { name: 'XUV700 MX Petrol', price: 2999, fuel: 'Petrol', seats: 5 },
  { name: 'XUV700 AX5 Diesel', price: 3499, fuel: 'Diesel', seats: 5 },
  { name: 'XUV700 AX7 Diesel', price: 3999, fuel: 'Diesel', seats: 7 },
  { name: 'XUV700 AX7 L AT', price: 4499, fuel: 'Diesel', seats: 7 },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function XUV700OnRentPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Flagship SUV with ADAS"
        title="XUV700 on Rent Without Driver"
        titleHighlight="Starting @₹2999/Day"
        description="Mahindra XUV700 - India's safest SUV with ADAS, panoramic sunroof, and powerful engines. 5 & 7 seater options available."
        features={[
          { icon: 'star', text: '5-Star Safety', color: 'text-amber-500' },
          { icon: 'shield', text: 'ADAS Equipped', color: 'text-emerald-600' },
          { icon: 'zap', text: '5 & 7 Seater', color: 'text-red-600' },
        ]}
        gradientFrom="red-50"
        gradientTo="rose-50"
      />

      <section className="relative bg-gradient-to-br from-red-700 to-rose-800 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Mahindra XUV700 on Rent</h1>
            <p className="text-xl opacity-90 mb-8">MX • AX5 • AX7 • AX7 L Variants</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-red-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Variants</a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-700 transition">Find Near You</a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Rent XUV700?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🛡️', title: 'ADAS Safety', desc: 'Level 2 autonomous features' },
              { icon: '☀️', title: 'Panoramic Sunroof', desc: 'Largest in segment' },
              { icon: '🔊', title: 'Sony 3D Sound', desc: '12-speaker system' },
              { icon: '⭐', title: '5-Star GNCAP', desc: 'Safest Indian SUV' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-red-50 rounded-lg">
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
          <h2 className="text-3xl font-bold text-center mb-12">XUV700 Variants & Pricing</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {variants.map((v) => (
              <div key={v.name} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="bg-red-700 text-white p-4">
                  <p className="text-sm opacity-75">{v.seats} Seater</p>
                  <h3 className="text-lg font-bold">{v.name}</h3>
                  <p className="text-2xl font-bold mt-2">₹{v.price}<span className="text-sm opacity-75">/day</span></p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-4">⛽ {v.fuel}</p>
                  <button className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">Book Now</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">XUV700 on Rent in 200+ Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/xuv700-on-rent/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-red-50 border border-gray-200 transition">
                <span className="font-medium text-gray-800">{city.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Similar SUVs</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href="/scorpio-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-red-600">Scorpio on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹2,499/day</p>
            </Link>
            <Link href="/fortuner-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-red-600">Fortuner on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹4,999/day</p>
            </Link>
            <Link href="/creta-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-red-600">Creta on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹1,999/day</p>
            </Link>
            <Link href="/self-drive-suv-rental" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-red-600">All SUVs</h3>
              <p className="text-sm text-gray-600 mt-2">View all options</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="self-drive-car-rental" />
    </>
  );
}
