import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';

export const metadata: Metadata = {
  title: 'Leh Ladakh Bike Tour 2025 | Guided Motorcycle Tour from ₹32,999 | TransRentals',
  description: 'Book Leh Ladakh guided bike tour. 10 days Manali-Leh-Srinagar with ride captain, Royal Enfield, backup vehicle, accommodation & meals. Khardung La, Pangong Lake included.',
  keywords: [
    'leh ladakh bike tour',
    'ladakh motorcycle tour',
    'manali to leh bike tour',
    'guided ladakh tour',
    'ladakh bike trip package',
    'khardung la bike tour',
  ],
  openGraph: {
    title: 'Leh Ladakh Guided Bike Tour 2025 | ₹32,999 All-Inclusive | TransRentals',
    description: '10-day guided motorcycle tour with ride captain, backup vehicle, accommodation & meals.',
    type: 'website',
    url: 'https://transrentals.in/bike-tours/leh-ladakh',
    images: [
      {
        url: 'https://transrentals.in/images/og/ladakh-bike-tour.jpg',
        width: 1200,
        height: 630,
        alt: 'Leh Ladakh Bike Tour - TransRentals',
      },
    ],
  },
  alternates: {
    canonical: 'https://transrentals.in/bike-tours/leh-ladakh',
  },
};

const packages = [
  {
    name: 'Manali - Leh - Manali',
    duration: '10 Days / 9 Nights',
    distance: '1,000 km',
    price: 32999,
    highlights: ['Rohtang Pass', 'Keylong', 'Jispa', 'Sarchu', 'Leh', 'Khardung La', 'Nubra Valley', 'Pangong Lake'],
  },
  {
    name: 'Manali - Leh - Srinagar',
    duration: '12 Days / 11 Nights',
    distance: '1,400 km',
    price: 38999,
    highlights: ['Rohtang Pass', 'Leh', 'Khardung La', 'Nubra Valley', 'Pangong Lake', 'Tso Moriri', 'Kargil', 'Srinagar'],
    popular: true,
  },
  {
    name: 'Srinagar - Leh - Manali',
    duration: '12 Days / 11 Nights',
    distance: '1,400 km',
    price: 38999,
    highlights: ['Srinagar', 'Kargil', 'Leh', 'Khardung La', 'Pangong Lake', 'Tso Moriri', 'Sarchu', 'Manali'],
  },
];

const itinerary = [
  { day: 1, title: 'Arrival in Manali', desc: 'Arrive Manali, bike allocation, briefing. Acclimatization day.', stay: 'Hotel in Manali' },
  { day: 2, title: 'Manali to Jispa', desc: 'Cross Rohtang Pass (13,050 ft). Scenic ride through Lahaul Valley.', distance: '140 km', stay: 'Camp in Jispa' },
  { day: 3, title: 'Jispa to Sarchu', desc: 'Cross Baralacha La (16,040 ft). High altitude riding.', distance: '85 km', stay: 'Camp in Sarchu' },
  { day: 4, title: 'Sarchu to Leh', desc: 'Cross Tanglang La (17,480 ft). Arrive in Leh.', distance: '250 km', stay: 'Hotel in Leh' },
  { day: 5, title: 'Leh Sightseeing', desc: 'Visit Shanti Stupa, Leh Palace, local markets. Rest day.', stay: 'Hotel in Leh' },
  { day: 6, title: 'Leh to Nubra Valley', desc: 'Cross Khardung La (18,380 ft). Visit Diskit Monastery.', distance: '120 km', stay: 'Camp in Hunder' },
  { day: 7, title: 'Nubra to Pangong', desc: 'Ride to Pangong Lake via Shyok route. Sunset at lake.', distance: '150 km', stay: 'Camp at Pangong' },
  { day: 8, title: 'Pangong to Leh', desc: 'Morning at lake. Return via Chang La (17,590 ft).', distance: '140 km', stay: 'Hotel in Leh' },
  { day: 9, title: 'Leh to Sarchu', desc: 'Begin return journey. Cross Tanglang La again.', distance: '250 km', stay: 'Camp in Sarchu' },
  { day: 10, title: 'Sarchu to Manali', desc: 'Final ride through Rohtang. Farewell dinner.', distance: '225 km', stay: 'Tour ends' },
];

export default function LehLadakhTourPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Most Popular Tour"
        title="Leh Ladakh Bike Tour"
        titleHighlight="₹32,999 All-Inclusive"
        description="The ultimate Himalayan motorcycle adventure. Cross Khardung La, camp at Pangong Lake, ride through Nubra Valley. Everything included."
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: '500+ Tours', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Expert Guides', color: 'text-blue-600' },
        ]}
        gradientFrom="blue-50"
        gradientTo="indigo-50"
      />

      {/* Breadcrumb */}
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/bike-tours" className="hover:text-blue-700">Bike Tours</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Leh Ladakh</span>
          </nav>
        </div>
      </section>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl">
            <p className="text-yellow-400 font-semibold mb-2">GUIDED MOTORCYCLE TOUR</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Leh Ladakh Bike Tour 2025
            </h1>
            <p className="text-xl opacity-90 mb-6">
              10-12 Days • Manali/Srinagar • Khardung La • Pangong Lake • Nubra Valley
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <p className="text-xs opacity-75">Starting from</p>
                <p className="text-2xl font-bold">₹32,999</p>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <p className="text-xs opacity-75">Duration</p>
                <p className="text-2xl font-bold">10-12 Days</p>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <p className="text-xs opacity-75">Best Time</p>
                <p className="text-2xl font-bold">May - Sep</p>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <p className="text-xs opacity-75">Group Size</p>
                <p className="text-2xl font-bold">6-12 Riders</p>
              </div>
            </div>
            <a href="#packages" className="inline-block bg-yellow-400 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition">
              View Packages & Dates
            </a>
          </div>
        </div>
      </section>

      {/* Tour Packages */}
      <section id="packages" className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-4">Choose Your Route</h2>
          <p className="text-center text-gray-600 mb-12">All packages include bike, guide, backup vehicle, accommodation & meals</p>
          <div className="grid md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.name} className={`bg-white rounded-xl shadow-lg overflow-hidden ${pkg.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {pkg.popular && (
                  <div className="bg-blue-500 text-white text-center py-1 text-sm font-semibold">
                    MOST POPULAR
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                  <div className="flex gap-4 text-sm text-gray-600 mb-4">
                    <span>{pkg.duration}</span>
                    <span>•</span>
                    <span>{pkg.distance}</span>
                  </div>
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-blue-600">₹{pkg.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">per person (twin sharing)</p>
                  </div>
                  <div className="mb-6">
                    <p className="text-sm font-semibold mb-2">Highlights:</p>
                    <div className="flex flex-wrap gap-1">
                      {pkg.highlights.slice(0, 5).map((h) => (
                        <span key={h} className="text-xs bg-gray-100 px-2 py-1 rounded">{h}</span>
                      ))}
                    </div>
                  </div>
                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                    Book This Package
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">What&apos;s Included</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl">
              <h3 className="text-xl font-bold text-green-600 mb-4">✅ Inclusions</h3>
              <ul className="space-y-3">
                {[
                  'Royal Enfield Himalayan/Classic 350',
                  'Experienced Ride Captain',
                  'Backup vehicle with mechanic',
                  '9-11 nights accommodation (hotels + camps)',
                  'Breakfast & dinner daily',
                  'Riding gear (jacket, gloves, knee guards)',
                  'Inner Line Permit for Ladakh',
                  'First aid & oxygen cylinder',
                  'Fuel for the entire trip',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <h3 className="text-xl font-bold text-red-600 mb-4">❌ Exclusions</h3>
              <ul className="space-y-3">
                {[
                  'Travel to starting point (Manali/Srinagar)',
                  'Lunch during the tour',
                  'Personal expenses & tips',
                  'Any activity not mentioned',
                  'Travel insurance (recommended)',
                  'Anything not in inclusions',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Itinerary */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-4">Day-by-Day Itinerary</h2>
          <p className="text-center text-gray-600 mb-12">Manali - Leh - Manali Route (10 Days)</p>
          <div className="max-w-3xl mx-auto">
            {itinerary.map((day, index) => (
              <div key={day.day} className="flex gap-4 mb-6">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {day.day}
                  </div>
                  {index < itinerary.length - 1 && <div className="w-0.5 h-full bg-blue-200 mt-2" />}
                </div>
                <div className="flex-1 pb-6">
                  <h3 className="font-bold text-lg">{day.title}</h3>
                  <p className="text-gray-600 mb-2">{day.desc}</p>
                  <div className="flex gap-4 text-sm">
                    {day.distance && <span className="text-blue-600">📍 {day.distance}</span>}
                    <span className="text-gray-500">🏨 {day.stay}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Dates */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">Upcoming Tour Dates 2025</h2>
          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { date: 'May 15 - May 24', slots: 4 },
              { date: 'June 1 - June 10', slots: 6 },
              { date: 'June 15 - June 24', slots: 8 },
              { date: 'July 1 - July 10', slots: 2 },
              { date: 'July 15 - July 24', slots: 5 },
              { date: 'Aug 1 - Aug 10', slots: 7 },
              { date: 'Aug 15 - Aug 24', slots: 6 },
              { date: 'Sep 1 - Sep 10', slots: 8 },
            ].map((batch) => (
              <div key={batch.date} className="bg-white/10 p-4 rounded-lg text-center">
                <p className="font-semibold">{batch.date}</p>
                <p className="text-sm text-yellow-400">{batch.slots} slots left</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button className="bg-yellow-400 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition">
              Check Availability & Book
            </button>
          </div>
        </div>
      </section>

      {/* Self-Ride Option */}
      <section className="py-12 bg-gray-100">
        <div className="container-custom">
          <div className="bg-white rounded-xl p-8 md:flex md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-bold mb-2">Prefer Self-Ride?</h3>
              <p className="text-gray-600">Rent a bike and create your own Ladakh adventure. One-way drops available.</p>
            </div>
            <Link href="/bike-trips/ladakh" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition">
              Self-Ride Options →
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="bike-on-rent" />
    </>
  );
}
