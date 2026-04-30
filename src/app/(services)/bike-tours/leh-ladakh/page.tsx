import { Metadata } from 'next';
import Link from 'next/link';
import { BikeTourHero } from '@/components/bike-tours/BikeTourHero';
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
      <BikeTourHero
        badge="Most Popular Tour"
        title="Leh Ladakh Bike Tour"
        price="₹32,999 All-Inclusive"
        description="The ultimate Himalayan motorcycle adventure. Cross Khardung La, camp at Pangong Lake, ride through Nubra Valley. Everything included."
        gradient="from-blue-900 via-indigo-900 to-slate-900"
        accentColor="blue-400"
        stats={[
          { icon: 'clock', label: 'Duration', value: '10 Days' },
          { icon: 'mappin', label: 'Distance', value: '1,800 km' },
          { icon: 'mountain', label: 'Max Altitude', value: '18,380 ft' },
          { icon: 'users', label: 'Group Size', value: '6–12' },
        ]}
        features={[
          { text: 'Ride Captain' },
          { text: 'Backup Vehicle' },
          { text: 'Accommodation' },
          { text: 'Meals Included' },
          { text: 'Mechanic' },
          { text: '24/7 Support' },
        ]}
      />

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
