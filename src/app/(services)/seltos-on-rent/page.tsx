import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: 'Seltos on Rent Without Driver | Self Drive Seltos @₹1899/Day | TransRentals',
  description: 'Rent Kia Seltos without driver across India. Self-drive Seltos rental for family trips & outstation. HTK, HTX, GTX variants. Book now!',
  keywords: ['seltos on rent', 'kia seltos on rent', 'seltos self drive', 'rent seltos without driver'],
  openGraph: {
    title: 'Seltos on Rent Without Driver @₹1899/Day | TransRentals',
    url: 'https://transrentals.in/seltos-on-rent',
  },
  alternates: { canonical: 'https://transrentals.in/seltos-on-rent' },
};

const variants = [
  { name: 'Kia Seltos HTK', price: 1899, fuel: 'Petrol', transmission: 'Manual' },
  { name: 'Kia Seltos HTX', price: 2199, fuel: 'Petrol', transmission: 'Manual' },
  { name: 'Kia Seltos HTX+ IVT', price: 2499, fuel: 'Petrol', transmission: 'Automatic' },
  { name: 'Kia Seltos GTX Diesel', price: 2699, fuel: 'Diesel', transmission: 'Manual' },
  { name: 'Kia Seltos GTX+ AT', price: 2999, fuel: 'Diesel', transmission: 'Automatic' },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function SeltosOnRentPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Connected Car SUV"
        title="Seltos on Rent Without Driver"
        titleHighlight="Starting @₹1899/Day"
        description="Kia Seltos - Feature-loaded compact SUV with connected car tech, sunroof, and premium interiors. Perfect for family trips and weekend getaways."
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Connected Car', color: 'text-red-600' },
        ]}
        gradientFrom="red-50"
        gradientTo="orange-50"
      />

      <section className="relative bg-gradient-to-br from-red-600 to-orange-600 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Kia Seltos on Rent Across India</h1>
            <p className="text-xl opacity-90 mb-8">HTK • HTX • HTX+ • GTX • GTX+ Variants</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Variants & Prices</a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition">Find Near You</a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Rent a Kia Seltos?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '📱', title: 'Connected Car', desc: 'UVO connected features' },
              { icon: '☀️', title: 'Sunroof', desc: 'Panoramic sunroof option' },
              { icon: '🎵', title: 'Bose Audio', desc: '8-speaker premium sound' },
              { icon: '🛡️', title: '6 Airbags', desc: 'Top safety rating' },
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
          <h2 className="text-3xl font-bold text-center mb-12">Seltos Variants & Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {variants.map((v) => (
              <div key={v.name} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="bg-red-600 text-white p-4">
                  <p className="text-sm opacity-75">{v.transmission}</p>
                  <h3 className="text-xl font-bold">{v.name}</h3>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">₹{v.price}</span>
                    <span className="text-sm opacity-75">/day</span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-4">👥 5 Seats • ⛽ {v.fuel}</p>
                  <button className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">Book Now</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Seltos on Rent in 200+ Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/seltos-on-rent/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-red-50 border border-gray-200 transition">
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
            <Link href="/creta-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-red-600">Creta on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹1,999/day</p>
            </Link>
            <Link href="/xuv700-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-red-600">XUV700 on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹2,999/day</p>
            </Link>
            <Link href="/scorpio-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-red-600">Scorpio on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹2,499/day</p>
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
