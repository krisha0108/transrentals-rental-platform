import { Metadata } from 'next';
import Link from 'next/link';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { HourlyCitySearch } from '@/components/hourly-car-rental/HourlyCitySearch';
import { HourlyPopularPackages } from '@/components/hourly-car-rental/HourlyPopularPackages';
import { Timer, Shield, Star, Fuel, Clock } from 'lucide-react';

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

const topCities = ALL_CITIES.slice(0, 12);

export default function HourlyCarRentalPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div className="relative container-custom py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Timer className="w-4 h-4 text-blue-300" />
              <span className="text-sm font-medium">Hourly Car Rental — Driver Included</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Rent a Car by the Hour<br />
              <span className="text-blue-300">With Driver, Any City</span>
            </h1>
            <p className="text-blue-100 text-lg mb-4">
              Book a chauffeur-driven car for 2–12 hours. Perfect for meetings, errands, shopping & city travel.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-4 mb-10 text-sm">
              {[
                { label: 'Starting from', value: '₹499' },
                { label: 'Driver + Fuel', value: 'Included' },
                { label: 'Available in', value: '200+ Cities' },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center">
                  <p className="text-blue-200 text-xs mb-0.5">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>

            {/* City search */}
            <div className="flex justify-center mb-8">
              <HourlyCitySearch />
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { icon: Shield, text: 'Verified Drivers' },
                { icon: Star, text: '4.8★ Rated' },
                { icon: Fuel, text: 'Fuel Included' },
                { icon: Clock, text: '12-hr Advance' },
              ].map((b) => (
                <div key={b.text} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
                  <b.icon className="w-3.5 h-3.5 text-blue-300" />
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
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

      <HourlyPopularPackages />

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
