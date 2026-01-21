import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: 'Hourly Car Rental | Rent Car by Hour @₹149/hr | TransRentals',
  description: 'Rent a car by the hour for meetings, errands, shopping. Self-drive hourly rental from ₹149/hr. Flexible 2-8 hour packages. Book now!',
  keywords: ['hourly car rental', 'rent car by hour', 'car rental per hour', 'short term car rental', 'car hire hourly'],
  openGraph: {
    title: 'Hourly Car Rental @₹149/hr | TransRentals',
    description: 'Rent a car by the hour. Flexible packages for short trips.',
    url: 'https://transrentals.in/hourly-car-rental',
  },
  alternates: { canonical: 'https://transrentals.in/hourly-car-rental' },
};

const packages = [
  { hours: 2, km: 20, price: 299, perHour: 149, popular: false },
  { hours: 4, km: 40, price: 499, perHour: 125, popular: true },
  { hours: 8, km: 80, price: 899, perHour: 112, popular: false },
];

const carTypes = [
  { name: 'Hatchback', cars: 'Swift, i20, Baleno', price: 149 },
  { name: 'Sedan', cars: 'City, Verna, Ciaz', price: 199 },
  { name: 'SUV', cars: 'Creta, Seltos', price: 299 },
  { name: 'Premium', cars: 'Innova, Fortuner', price: 399 },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function HourlyCarRentalPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Flexible Short-Term Rental"
        title="Hourly Car Rental"
        titleHighlight="From ₹149/hour"
        description="Rent a car by the hour for meetings, shopping, errands, or short trips. Self-drive flexibility with no full-day commitment."
        features={[
          { icon: 'star', text: 'Pay Per Hour', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Instant Booking', color: 'text-blue-600' },
        ]}
        gradientFrom="cyan-50"
        gradientTo="blue-50"
      />

      <section className="relative bg-gradient-to-br from-cyan-600 to-blue-700 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Rent a Car by the Hour</h1>
            <p className="text-xl opacity-90 mb-8">No full-day commitment. Pay only for hours you need.</p>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <p className="text-xs opacity-75">Starting from</p>
                <p className="text-2xl font-bold">₹149/hour</p>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <p className="text-xs opacity-75">Minimum</p>
                <p className="text-2xl font-bold">2 Hours</p>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <p className="text-xs opacity-75">Fuel</p>
                <p className="text-2xl font-bold">Included</p>
              </div>
            </div>
            <a href="#packages" className="inline-block bg-white text-cyan-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Hourly Packages</a>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Hourly Rental?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '⏰', title: 'Pay Per Hour', desc: 'No full-day charges' },
              { icon: '🚗', title: 'Self Drive', desc: 'Drive yourself, no driver' },
              { icon: '⛽', title: 'Fuel Included', desc: 'No extra fuel costs' },
              { icon: '📱', title: 'Quick Booking', desc: 'Book in 2 minutes' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-cyan-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="packages" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-4">Hourly Packages</h2>
          <p className="text-center text-gray-600 mb-12">Choose a package that fits your needs</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {packages.map((pkg) => (
              <div key={pkg.hours} className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition ${pkg.popular ? 'ring-2 ring-cyan-500' : ''}`}>
                {pkg.popular && <div className="bg-cyan-500 text-white text-center py-1 text-sm font-semibold">MOST POPULAR</div>}
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-center mb-2">{pkg.hours} Hours</h3>
                  <p className="text-center text-gray-500 mb-4">{pkg.km} km included</p>
                  <div className="text-center mb-4">
                    <span className="text-4xl font-bold text-cyan-600">₹{pkg.price}</span>
                    <p className="text-sm text-gray-500">₹{pkg.perHour}/hour effective</p>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-2 mb-6">
                    <li>✓ Fuel included</li>
                    <li>✓ Insurance covered</li>
                    <li>✓ No hidden charges</li>
                    <li>✓ Extra km @ ₹12/km</li>
                  </ul>
                  <button className={`w-full py-2 rounded-lg font-semibold transition ${pkg.popular ? 'bg-cyan-600 text-white hover:bg-cyan-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>Book Now</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Cars Available for Hourly Rental</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {carTypes.map((car) => (
              <div key={car.name} className="bg-gray-50 p-6 rounded-lg text-center">
                <h3 className="font-bold text-lg mb-1">{car.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{car.cars}</p>
                <p className="text-2xl font-bold text-cyan-600">₹{car.price}<span className="text-sm text-gray-500">/hr</span></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-cyan-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Perfect For</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '💼', title: 'Business Meetings', desc: 'Quick client visits' },
              { icon: '🛒', title: 'Shopping Trips', desc: 'Mall runs & errands' },
              { icon: '🏥', title: 'Hospital Visits', desc: 'Medical appointments' },
              { icon: '✈️', title: 'Airport Runs', desc: 'Drop & pick' },
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Hourly Car Rental in 200+ Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/hourly-car-rental/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-cyan-50 border border-gray-200 transition">
                <span className="font-medium text-gray-800">{city.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Other Rental Options</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href="/self-drive-car-rentals" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-cyan-600">Daily Rental</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹799/day</p>
            </Link>
            <Link href="/airport-self-drive" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-cyan-600">Airport Self-Drive</h3>
              <p className="text-sm text-gray-600 mt-2">Pickup at airport</p>
            </Link>
            <Link href="/local-taxi" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-cyan-600">With Driver</h3>
              <p className="text-sm text-gray-600 mt-2">If you prefer a driver</p>
            </Link>
            <Link href="/outstation-car-rental" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <h3 className="font-bold text-lg group-hover:text-cyan-600">Outstation</h3>
              <p className="text-sm text-gray-600 mt-2">Long distance trips</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="self-drive-car-rental" />
    </>
  );
}
