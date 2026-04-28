import { Metadata } from 'next';
import Link from 'next/link';
import { BikeTourHero } from '@/components/bike-tours/BikeTourHero';
import { Clock, MapPin, Star, Users } from 'lucide-react';
import { FAQSection } from '@/components/services/FAQSection';

export const metadata: Metadata = {
  title: 'Rajasthan Bike Tour 2025 | Guided Motorcycle Tour from ₹24,999 | TransRentals',
  description: 'Book Rajasthan guided bike tour. 7 days Delhi-Jaipur-Jodhpur-Jaisalmer-Udaipur with ride captain, Royal Enfield, accommodation & meals. Desert safari included.',
  keywords: [
    'rajasthan bike tour',
    'rajasthan motorcycle tour',
    'jaisalmer bike tour',
    'guided rajasthan tour',
    'royal rajasthan bike trip',
    'desert bike tour india',
  ],
  openGraph: {
    title: 'Rajasthan Guided Bike Tour 2025 | ₹24,999 All-Inclusive | TransRentals',
    description: '7-day guided motorcycle tour through royal Rajasthan with palace stays and desert camping.',
    type: 'website',
    url: 'https://transrentals.in/bike-tours/rajasthan',
  },
  alternates: {
    canonical: 'https://transrentals.in/bike-tours/rajasthan',
  },
};

const itinerary = [
  { day: 1, title: 'Delhi to Jaipur', desc: 'Start from Delhi. Ride to the Pink City. Evening Hawa Mahal visit.', distance: '280 km', stay: 'Heritage Hotel Jaipur' },
  { day: 2, title: 'Jaipur Exploration', desc: 'Visit Amber Fort, City Palace, Jantar Mantar. Local bazaar.', stay: 'Heritage Hotel Jaipur' },
  { day: 3, title: 'Jaipur to Jodhpur', desc: 'Ride through Aravalli hills. Blue City arrival. Mehrangarh Fort sunset.', distance: '340 km', stay: 'Haveli in Jodhpur' },
  { day: 4, title: 'Jodhpur to Jaisalmer', desc: 'Desert highway ride. Golden City arrival. Fort walk.', distance: '290 km', stay: 'Haveli in Jaisalmer' },
  { day: 5, title: 'Jaisalmer Desert', desc: 'Jaisalmer Fort, Patwon Haveli. Evening desert safari & camping.', stay: 'Desert Camp' },
  { day: 6, title: 'Jaisalmer to Udaipur', desc: 'Longest ride day. Scenic highway. Lake City arrival.', distance: '530 km', stay: 'Lake View Hotel' },
  { day: 7, title: 'Udaipur & Departure', desc: 'Lake Pichola boat ride. City Palace. Farewell lunch. Tour ends.', stay: 'Tour ends' },
];

export default function RajasthanTourPage() {
  return (
    <>
      <BikeTourHero
        badge="Royal Heritage Ride"
        title="Rajasthan Bike Tour"
        price="₹24,999 All-Inclusive"
        description="Ride through royal palaces, golden sand dunes, and colorful Rajasthani culture. Heritage stays, desert camping, and unforgettable sunsets."
        gradient="from-orange-800 via-red-900 to-rose-900"
        accentColor="orange-400"
        stats={[
          { icon: Clock, label: 'Duration', value: '7 Days' },
          { icon: MapPin, label: 'Distance', value: '1,440 km' },
          { icon: Star, label: 'Rating', value: '4.9/5' },
          { icon: Users, label: 'Group Size', value: '6–12' },
        ]}
        features={[
          { text: 'Ride Captain' },
          { text: 'Heritage Stays' },
          { text: 'Desert Safari' },
          { text: 'Meals Included' },
          { text: 'Riding Gear' },
          { text: 'All Permits' },
        ]}
      />

      {/* Breadcrumb */}
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-orange-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/bike-tours" className="hover:text-orange-700">Bike Tours</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Rajasthan</span>
          </nav>
        </div>
      </section>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-orange-600 via-red-700 to-rose-800 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl">
            <p className="text-yellow-400 font-semibold mb-2">GUIDED MOTORCYCLE TOUR</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Rajasthan Royal Ride 2025
            </h1>
            <p className="text-xl opacity-90 mb-6">
              7 Days • Jaipur • Jodhpur • Jaisalmer • Udaipur • Desert Safari
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <p className="text-xs opacity-75">Duration</p>
                <p className="text-2xl font-bold">7 Days</p>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <p className="text-xs opacity-75">Best Time</p>
                <p className="text-2xl font-bold">Oct - Mar</p>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <p className="text-xs opacity-75">Difficulty</p>
                <p className="text-2xl font-bold">Moderate</p>
              </div>
            </div>
            <button className="bg-yellow-400 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition">
              Book Now
            </button>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Tour Highlights</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: '🏰', title: 'Amber Fort', desc: 'Jaipur' },
              { icon: '🏯', title: 'Mehrangarh', desc: 'Jodhpur' },
              { icon: '🏜️', title: 'Sam Dunes', desc: 'Jaisalmer' },
              { icon: '🛶', title: 'Lake Pichola', desc: 'Udaipur' },
              { icon: '🐪', title: 'Desert Safari', desc: 'Camel ride' },
            ].map((h) => (
              <div key={h.title} className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl mb-2">{h.icon}</div>
                <h3 className="font-bold text-sm">{h.title}</h3>
                <p className="text-xs text-gray-600">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Itinerary */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-4">Day-by-Day Itinerary</h2>
          <p className="text-center text-gray-600 mb-12">Delhi - Jaipur - Jodhpur - Jaisalmer - Udaipur</p>
          <div className="max-w-3xl mx-auto">
            {itinerary.map((day, index) => (
              <div key={day.day} className="flex gap-4 mb-6">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                    {day.day}
                  </div>
                  {index < itinerary.length - 1 && <div className="w-0.5 h-full bg-orange-200 mt-2" />}
                </div>
                <div className="flex-1 pb-6">
                  <h3 className="font-bold text-lg">{day.title}</h3>
                  <p className="text-gray-600 mb-2">{day.desc}</p>
                  <div className="flex gap-4 text-sm">
                    {day.distance && <span className="text-orange-600">📍 {day.distance}</span>}
                    <span className="text-gray-500">🏨 {day.stay}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Experiences */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">Special Experiences</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🏰', title: 'Heritage Stays', desc: 'Sleep in converted palaces and havelis. Experience royal Rajasthani hospitality.' },
              { icon: '🐪', title: 'Desert Camping', desc: 'Camel safari in Sam dunes. Bonfire, folk dance, and star gazing.' },
              { icon: '🍛', title: 'Royal Cuisine', desc: 'Authentic Rajasthani thali, dal baati churma, and local delicacies.' },
            ].map((exp) => (
              <div key={exp.title} className="bg-orange-50 p-6 rounded-xl text-center">
                <div className="text-4xl mb-4">{exp.icon}</div>
                <h3 className="font-bold text-xl mb-2">{exp.title}</h3>
                <p className="text-gray-600">{exp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-orange-900 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-4">Experience Royal Rajasthan</h2>
          <p className="text-xl opacity-90 mb-8">Best time: October to March. Limited batches available.</p>
          <div className="flex gap-4 justify-center">
            <button className="bg-yellow-400 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition">
              Book Now
            </button>
            <Link href="/bike-tours" className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-900 transition">
              View All Tours
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="bike-on-rent" />
    </>
  );
}
