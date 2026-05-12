import { Metadata } from 'next';
import Link from 'next/link';
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Creta on Rent Without Driver | Self Drive Creta @₹1999/Day | TransRentals',
  description: 'Rent Hyundai Creta without driver across India. Self-drive Creta rental for family trips, outstation & weekend getaways. Most popular SUV. Book now!',
  keywords: [
    'creta on rent',
    'hyundai creta on rent',
    'creta self drive',
    'rent creta without driver',
    'creta rental near me',
    'creta car rental',
  ],
  openGraph: {
    title: 'Creta on Rent Without Driver @₹1999/Day | TransRentals',
    description: 'Self-drive Hyundai Creta rental. Most popular SUV for family trips.',
    type: 'website',
    url: 'https://transrentals.in/creta-on-rent',
  },
  alternates: {
    canonical: 'https://transrentals.in/creta-on-rent',
  },
};

const topCities = ALL_CITIES.slice(0, 12);

export default function CretaOnRentPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Hyundai Creta on TransRentals"
        description="Book Creta self-drive rental in 4 simple steps."
        totalTime="PT8M"
        steps={[
          { name: 'Enter City & Dates', text: 'Choose pickup city, rental dates, and whether you need self-drive or a chauffeur-driven Creta.' },
          { name: 'Select Creta Variant', text: 'Choose between Creta petrol, diesel, or turbo. Check sunroof availability for a better travel experience.' },
          { name: 'Upload Documents', text: 'Submit DL and Aadhaar/Voter ID. Pay security deposit online. Booking confirmed after verification.' },
          { name: 'Drive Your Creta', text: 'Pick up Creta at vendor or get doorstep delivery. Inspect the car and enjoy your drive.' },
        ]}
      />
      <SpecialtyCarBookingHero service="creta" />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-700 to-cyan-700 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Hyundai Creta on Rent Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Creta E • Creta EX • Creta S • Creta SX • Creta SX(O) AT
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                View Variants & Prices
              </a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-700 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Creta */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent a Hyundai Creta?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏆', title: 'Best-Selling SUV', desc: '#1 SUV in India' },
              { icon: '🛋️', title: 'Premium Comfort', desc: 'Spacious & comfortable' },
              { icon: '🔒', title: 'ADAS Safety', desc: 'Advanced safety features' },
              { icon: '🌟', title: 'Connected Car', desc: 'BlueLink technology' },
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

      {/* Creta Variants */}
      {/* Perfect For */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Creta is Perfect For
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '👨‍👩‍👧‍👦', title: 'Family Trips', desc: 'Spacious for 5 people + luggage' },
              { icon: '🛣️', title: 'Road Trips', desc: 'Comfortable highway cruiser' },
              { icon: '💼', title: 'Business Travel', desc: 'Premium appearance' },
              { icon: '🏔️', title: 'Hill Stations', desc: 'Good ground clearance' },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Creta on Rent in 200+ Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/creta-on-rent/${city.slug}`}
                className="p-3 bg-white rounded-lg text-center hover:bg-blue-50 hover:border-blue-300 border border-gray-200 transition"
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

      <FAQSection service="self-drive-car-rental" />
    </>
  );
}
