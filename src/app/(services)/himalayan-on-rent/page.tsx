import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: 'Himalayan on Rent | Royal Enfield Himalayan @₹1499/Day | TransRentals',
  description: 'Rent Royal Enfield Himalayan for Ladakh, Spiti, Himalayan tours. Adventure touring bike with 411cc engine. Starting ₹1499/day. Book now!',
  keywords: ['himalayan on rent', 'royal enfield himalayan rent', 'himalayan bike rental', 'adventure bike rental'],
  openGraph: { title: 'Himalayan on Rent @₹1499/Day | TransRentals', url: 'https://transrentals.in/himalayan-on-rent' },
  alternates: { canonical: 'https://transrentals.in/himalayan-on-rent' },
};

const variants = [
  { name: 'Himalayan 411cc', price: 1499, features: 'Classic adventure tourer, proven reliability' },
  { name: 'Himalayan 450', price: 1799, features: 'New gen, more power, better suspension' },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function HimalayanOnRentPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Adventure Touring Bike"
        title="Royal Enfield Himalayan on Rent"
        titleHighlight="Starting @₹1499/Day"
        description="The ultimate adventure touring motorcycle for Ladakh, Spiti, and Himalayan expeditions. Purpose-built for tough terrains."
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Adventure Ready', color: 'text-blue-600' },
        ]}
        gradientFrom="slate-50"
        gradientTo="blue-50"
      />

      <section className="relative bg-gradient-to-br from-slate-800 to-blue-900 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Royal Enfield Himalayan on Rent</h1>
            <p className="text-xl opacity-90 mb-8">Himalayan 411cc • Himalayan 450 (New)</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-slate-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Options</a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-slate-800 transition">Find Near You</a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Rent Himalayan?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏔️', title: 'Built for Mountains', desc: 'High altitude proven' },
              { icon: '🛡️', title: 'Tough & Reliable', desc: 'Handles rough roads' },
              { icon: '🧳', title: 'Luggage Ready', desc: 'Panniers & top box' },
              { icon: '⛽', title: 'Great Mileage', desc: '30+ km/l economy' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-slate-50 rounded-lg">
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
          <h2 className="text-3xl font-bold text-center mb-12">Himalayan Variants</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {variants.map((v) => (
              <div key={v.name} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="bg-slate-800 text-white p-6">
                  <h3 className="text-xl font-bold">{v.name}</h3>
                  <p className="text-3xl font-bold mt-2">₹{v.price}<span className="text-sm opacity-75">/day</span></p>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{v.features}</p>
                  <ul className="text-sm text-gray-600 space-y-2 mb-6">
                    <li>✓ Helmet included</li>
                    <li>✓ Panniers available</li>
                    <li>✓ Insurance covered</li>
                    <li>✓ Roadside assistance</li>
                  </ul>
                  <button className="w-full bg-slate-800 text-white py-3 rounded-lg hover:bg-slate-900 transition">Book Now</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-800 text-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Popular Routes for Himalayan</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { route: 'Manali to Leh', days: '5-7 days', km: '490 km' },
              { route: 'Srinagar to Leh', days: '2-3 days', km: '420 km' },
              { route: 'Spiti Circuit', days: '7-8 days', km: '600 km' },
              { route: 'Kinnaur Valley', days: '4-5 days', km: '350 km' },
            ].map((item) => (
              <div key={item.route} className="bg-slate-700 p-6 rounded-lg text-center">
                <h3 className="font-bold text-lg mb-2">{item.route}</h3>
                <p className="text-sm opacity-75">{item.days} • {item.km}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Himalayan on Rent in 200+ Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/himalayan-on-rent/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-slate-100 border border-gray-200 transition">
                <span className="font-medium text-gray-800">{city.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Other Bikes</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href="/royal-enfield-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-slate-600">Royal Enfield</h3>
              <p className="text-sm text-gray-600 mt-2">Classic, Bullet, Meteor</p>
            </Link>
            <Link href="/ktm-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-slate-600">KTM on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">Duke, RC series</p>
            </Link>
            <Link href="/bike-tours/leh-ladakh" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-slate-600">Ladakh Bike Tour</h3>
              <p className="text-sm text-gray-600 mt-2">Guided tours</p>
            </Link>
            <Link href="/bike-on-rent" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-slate-600">All Bikes</h3>
              <p className="text-sm text-gray-600 mt-2">View all options</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="bike-rental" />
    </>
  );
}
