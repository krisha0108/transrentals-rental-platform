import { Metadata } from 'next';
import Link from 'next/link';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
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

const topCities = ALL_CITIES.slice(0, 12);

export default function XUV700OnRentPage() {
  return (
    <>
      <SwiftRentalTypeHero vehicleName="Mahindra XUV700" selfDrivePrice="₹2999" />

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

      <FAQSection service="self-drive-car-rental" />
    </>
  );
}
