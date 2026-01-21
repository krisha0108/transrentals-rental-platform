import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: 'Self Drive SUV Rental India | Rent SUV Without Driver @₹1999/Day | TransRentals',
  description: 'Rent SUV without driver across India. Creta, Seltos, Scorpio, XUV700, Fortuner available. Self-drive SUV rental for road trips, family travel. Book online!',
  keywords: [
    'self drive suv rental',
    'suv on rent without driver',
    'rent suv india',
    'self drive creta',
    'suv rental for road trip',
    'family suv rental',
  ],
  openGraph: {
    title: 'Self Drive SUV Rental India @₹1999/Day | TransRentals',
    description: 'Rent SUVs without driver. Creta, Seltos, Scorpio, Fortuner available.',
    type: 'website',
    url: 'https://transrentals.in/self-drive-suv-rental',
  },
  alternates: {
    canonical: 'https://transrentals.in/self-drive-suv-rental',
  },
};

const suvModels = [
  { name: 'Hyundai Creta', price: 1999, category: 'Compact SUV', seats: 5, fuel: 'Petrol/Diesel', features: 'Sunroof, Connected Car' },
  { name: 'Kia Seltos', price: 1999, category: 'Compact SUV', seats: 5, fuel: 'Petrol/Diesel', features: 'Ventilated Seats, ADAS' },
  { name: 'Mahindra Scorpio N', price: 2299, category: 'Mid-Size SUV', seats: 7, fuel: 'Diesel', features: '4x4 Available, Powerful' },
  { name: 'Mahindra XUV700', price: 2499, category: 'Premium SUV', seats: 7, fuel: 'Petrol/Diesel', features: 'ADAS, Panoramic Sunroof' },
  { name: 'Toyota Fortuner', price: 3999, category: 'Full-Size SUV', seats: 7, fuel: 'Diesel', features: '4x4 Available, Premium' },
  { name: 'Tata Harrier', price: 2199, category: 'Mid-Size SUV', seats: 5, fuel: 'Diesel', features: 'Panoramic Sunroof, JBL Audio' },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function SelfDriveSUVRentalPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Self Drive SUV Rental"
        title="Rent SUV Without Driver"
        titleHighlight="Starting @₹1999/Day"
        description="Self-drive SUV rental for road trips, family travel, and adventure. Spacious, powerful, and comfortable. Drive yourself with complete freedom."
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Unlimited KM Options', color: 'text-blue-600' },
        ]}
        gradientFrom="slate-50"
        gradientTo="blue-50"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-800 to-blue-900 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Self Drive SUV Rental Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Creta • Seltos • Scorpio • XUV700 • Fortuner • Harrier
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#suvs" className="bg-white text-slate-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                View SUV Models
              </a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-slate-800 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why SUV */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent an SUV?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '👨‍👩‍👧‍👦', title: 'Family Friendly', desc: '5-7 seater options for families' },
              { icon: '🧳', title: 'Boot Space', desc: 'Large luggage capacity' },
              { icon: '🏔️', title: 'Road Trips', desc: 'Perfect for highways & hills' },
              { icon: '💪', title: 'Powerful', desc: 'Handle any terrain with ease' },
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

      {/* SUV Models */}
      <section id="suvs" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-4">Available SUV Models</h2>
          <p className="text-center text-gray-600 mb-12">All SUVs are well-maintained, insured, and sanitized</p>
          <div className="grid md:grid-cols-3 gap-6">
            {suvModels.map((suv) => (
              <div key={suv.name} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="bg-slate-800 text-white p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm opacity-75">{suv.category}</p>
                      <h3 className="text-xl font-bold">{suv.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">₹{suv.price}</p>
                      <p className="text-xs opacity-75">/day</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex gap-4 text-sm text-gray-600 mb-3">
                    <span>👥 {suv.seats} Seats</span>
                    <span>⛽ {suv.fuel}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{suv.features}</p>
                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Self Drive SUV Rental in 200+ Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/self-drive-suv-rental/${city.slug}`}
                className="p-3 bg-gray-50 rounded-lg text-center hover:bg-blue-50 hover:border-blue-300 border border-gray-200 transition"
              >
                <span className="font-medium text-gray-800">{city.name}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <p className="text-gray-600">+ 190 more cities available</p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Perfect For
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏖️', title: 'Family Vacations', desc: 'Goa, Kerala, Rajasthan trips' },
              { icon: '🏔️', title: 'Hill Station Trips', desc: 'Manali, Ooty, Munnar drives' },
              { icon: '💼', title: 'Business Travel', desc: 'Airport transfers, client visits' },
              { icon: '🎉', title: 'Weekend Getaways', desc: 'Nearby destinations, quick trips' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-lg text-center shadow-md">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Services */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Other Self Drive Options
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/self-drive-sedan-rental" className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚗</div>
              <h3 className="font-bold text-lg group-hover:text-blue-600">Sedan Rental</h3>
              <p className="text-sm text-gray-600 mt-2">City, Verna, Ciaz from ₹1299/day</p>
            </Link>
            <Link href="/self-drive-hatchback-rental" className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚙</div>
              <h3 className="font-bold text-lg group-hover:text-blue-600">Hatchback Rental</h3>
              <p className="text-sm text-gray-600 mt-2">Swift, i20, Baleno from ₹899/day</p>
            </Link>
            <Link href="/outstation-car-rental" className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🛣️</div>
              <h3 className="font-bold text-lg group-hover:text-blue-600">Outstation Rental</h3>
              <p className="text-sm text-gray-600 mt-2">With driver from ₹14/km</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="self-drive-car-rental" />
    </>
  );
}
