import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: '12 Seater Tempo Traveller on Rent | Hire @₹18/km | TransRentals',
  description: 'Book 12 seater tempo traveller on rent for family trips, weddings, pilgrimages. AC/Non-AC options. Professional driver included. Starting ₹18/km. Book now!',
  keywords: [
    '12 seater tempo traveller',
    '12 seater tempo traveller on rent',
    '12 seater tempo traveller hire',
    'tempo traveller 12 seater price',
    '12 seater van rental',
  ],
  openGraph: {
    title: '12 Seater Tempo Traveller on Rent @₹18/km | TransRentals',
    description: 'Hire 12 seater tempo traveller with driver for group travel. AC/Non-AC available.',
    type: 'website',
    url: 'https://transrentals.in/12-seater-tempo-traveller',
  },
  alternates: {
    canonical: 'https://transrentals.in/12-seater-tempo-traveller',
  },
};

const topCities = ALL_CITIES.slice(0, 12);

export default function TwelveSeaterTempoTravellerPage() {
  return (
    <>
      <HowToSchema
        name="How to Book a 12-Seater Tempo Traveller on TransRentals"
        description="Book a 12-seater tempo traveller for group travel in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Enter Group Details', text: 'Select pickup city, travel date, and confirm group size of 10–12 passengers.' },
          { name: 'Choose AC or Non-AC', text: 'Select AC Tempo Traveller for summer or long-distance trips, non-AC for short hill station routes.' },
          { name: 'Compare Vendor Quotes', text: 'Get per-km quotes from verified operators. Review toll, state permit, and driver allowance inclusions.' },
          { name: 'Confirm & Travel', text: 'Pay advance to lock in the booking. Driver arrives at your pickup point with a clean, well-maintained vehicle.' },
        ]}
      />
      <ServiceHeroWithChat
        badge="Perfect for 10-12 People"
        title="12 Seater Tempo Traveller"
        titleHighlight="Starting @₹18/km"
        description="Comfortable 12 seater tempo traveller for family trips, weddings, corporate outings & pilgrimages. AC & Non-AC options with professional driver."
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Driver Included', color: 'text-emerald-600' },
          { icon: 'zap', text: '12 Seats', color: 'text-blue-600' },
        ]}
        gradientFrom="blue-50"
        gradientTo="indigo-50"
      />

      <section className="relative bg-gradient-to-br from-blue-700 to-indigo-800 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              12 Seater Tempo Traveller on Rent
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Non-AC • AC • Deluxe • Maharaja Variants
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

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Choose 12 Seater Tempo Traveller?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '👨‍👩‍👧‍👦', title: 'Ideal Group Size', desc: 'Perfect for 10-12 people' },
              { icon: '💺', title: 'Comfortable Seats', desc: 'Push-back & reclining options' },
              { icon: '🧳', title: 'Luggage Space', desc: 'Carrier + boot space' },
              { icon: '❄️', title: 'AC Available', desc: 'Beat the heat in comfort' },
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

      <section className="py-12 bg-blue-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Perfect For
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '👨‍👩‍👧‍👦', title: 'Family Trips', desc: 'Outstation vacations' },
              { icon: '💒', title: 'Weddings', desc: 'Guest transportation' },
              { icon: '🛕', title: 'Pilgrimages', desc: 'Temple & religious tours' },
              { icon: '🏢', title: 'Corporate', desc: 'Team outings & events' },
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            12 Seater Tempo Traveller in 200+ Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/12-seater-tempo-traveller/${city.slug}`}
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

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Other Tempo Traveller Options
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href="/tempo-traveller" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚐</div>
              <h3 className="font-bold text-lg group-hover:text-blue-600">All Tempo Travellers</h3>
              <p className="text-sm text-gray-600 mt-2">View all seating options</p>
            </Link>
            <Link href="/17-seater-tempo-traveller" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚌</div>
              <h3 className="font-bold text-lg group-hover:text-blue-600">17 Seater</h3>
              <p className="text-sm text-gray-600 mt-2">For larger groups</p>
            </Link>
            <Link href="/20-seater-tempo-traveller" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚍</div>
              <h3 className="font-bold text-lg group-hover:text-blue-600">20 Seater</h3>
              <p className="text-sm text-gray-600 mt-2">Big family groups</p>
            </Link>
            <Link href="/bus-rental" className="bg-white p-6 rounded-lg hover:shadow-lg transition group">
              <div className="text-3xl mb-3">🚎</div>
              <h3 className="font-bold text-lg group-hover:text-blue-600">Bus Rental</h3>
              <p className="text-sm text-gray-600 mt-2">26+ seater buses</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="bus-rental" />
    </>
  );
}
