import { Metadata } from 'next';
import Link from 'next/link';
import { BikeTourHero } from '@/components/bike-tours/BikeTourHero';
import { FAQSection } from '@/components/services/FAQSection';

export const metadata: Metadata = {
  title: 'Goa Bike Tour 2025 | Guided Coastal Motorcycle Tour from ₹14,999 | TransRentals',
  description: 'Book Goa guided bike tour. 4 days coastal ride with beaches, Dudhsagar Falls, Old Goa churches. Ride captain, accommodation & meals included.',
  keywords: [
    'goa bike tour',
    'goa motorcycle tour',
    'goa coastal ride',
    'dudhsagar bike tour',
    'guided goa tour',
    'goa beach motorcycle tour',
  ],
  openGraph: {
    title: 'Goa Coastal Bike Tour 2025 | ₹14,999 All-Inclusive | TransRentals',
    description: '4-day guided motorcycle tour along Goa\'s beautiful coastline with beaches and waterfalls.',
    type: 'website',
    url: 'https://transrentals.in/bike-tours/goa',
  },
  alternates: {
    canonical: 'https://transrentals.in/bike-tours/goa',
  },
};

const itinerary = [
  { day: 1, title: 'Arrival & North Goa', desc: 'Arrive Goa. Bike allocation. Ride to Baga, Calangute, Anjuna beaches. Sunset at Chapora Fort.', stay: 'Beach Resort North Goa' },
  { day: 2, title: 'Dudhsagar Falls', desc: 'Early start for Dudhsagar. Scenic Western Ghats ride. Spice plantation visit.', distance: '120 km', stay: 'Beach Resort North Goa' },
  { day: 3, title: 'South Goa & Old Goa', desc: 'Visit Se Cathedral, Basilica of Bom Jesus. Ride to Palolem, Colva beaches.', distance: '100 km', stay: 'Beach Resort South Goa' },
  { day: 4, title: 'Coastal Highway & Departure', desc: 'Morning beach ride. Farewell breakfast. Tour ends by noon.', stay: 'Tour ends' },
];

export default function GoaTourPage() {
  return (
    <>
      <BikeTourHero
        badge="Beach & Backroads"
        title="Goa Coastal Bike Tour"
        price="₹14,999 All-Inclusive"
        description="Sun, sand, and scenic roads. Explore Goa's beautiful beaches, majestic Dudhsagar Falls, and Portuguese heritage on two wheels."
        gradient="from-cyan-700 via-blue-800 to-indigo-900"
        accentColor="cyan-400"
        stats={[
          { icon: 'clock', label: 'Duration', value: '4 Days' },
          { icon: 'mappin', label: 'Distance', value: '320 km' },
          { icon: 'star', label: 'Rating', value: '4.8/5' },
          { icon: 'shield', label: 'Difficulty', value: 'Easy' },
        ]}
        features={[
          { text: 'Ride Captain' },
          { text: 'Beach Stays' },
          { text: 'Meals Included' },
          { text: 'Fuel Covered' },
          { text: 'Entry Tickets' },
          { text: 'Photography' },
        ]}
      />


      {/* Highlights */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Tour Highlights</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: '🏖️', title: 'Beaches', desc: 'Baga, Palolem' },
              { icon: '💧', title: 'Dudhsagar', desc: 'Milk waterfall' },
              { icon: '⛪', title: 'Old Goa', desc: 'Churches' },
              { icon: '🌅', title: 'Chapora Fort', desc: 'Dil Chahta Hai' },
              { icon: '🌶️', title: 'Spice Farm', desc: 'Plantation tour' },
            ].map((h) => (
              <div key={h.title} className="text-center p-4 bg-cyan-50 rounded-lg">
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
          <p className="text-center text-gray-600 mb-12">Coastal Goa Circuit</p>
          <div className="max-w-3xl mx-auto">
            {itinerary.map((day, index) => (
              <div key={day.day} className="flex gap-4 mb-6">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-cyan-600 text-white rounded-full flex items-center justify-center font-bold">
                    {day.day}
                  </div>
                  {index < itinerary.length - 1 && <div className="w-0.5 h-full bg-cyan-200 mt-2" />}
                </div>
                <div className="flex-1 pb-6">
                  <h3 className="font-bold text-lg">{day.title}</h3>
                  <p className="text-gray-600 mb-2">{day.desc}</p>
                  <div className="flex gap-4 text-sm">
                    {day.distance && <span className="text-cyan-600">📍 {day.distance}</span>}
                    <span className="text-gray-500">🏨 {day.stay}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">What&apos;s Included</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏍️', title: 'Royal Enfield', desc: 'Classic 350 or Meteor' },
              { icon: '👨‍✈️', title: 'Ride Captain', desc: 'Local Goa expert' },
              { icon: '🏨', title: '3 Nights Stay', desc: 'Beach resorts' },
              { icon: '🍽️', title: 'Meals', desc: 'Breakfast & Dinner' },
              { icon: '⛽', title: 'Fuel', desc: 'Entire trip' },
              { icon: '🎫', title: 'Entry Tickets', desc: 'Dudhsagar, Spice farm' },
              { icon: '🧥', title: 'Helmet', desc: 'Safety gear' },
              { icon: '📸', title: 'Photos', desc: 'Trip documentation' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-white rounded-lg shadow">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perfect For */}
      <section className="py-16 bg-cyan-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">Perfect For</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: '👫', title: 'Couples', desc: 'Romantic beach getaway' },
              { icon: '👨‍👩‍👧‍👦', title: 'Friends', desc: 'Epic group adventure' },
              { icon: '🧘', title: 'First-Timers', desc: 'Easy riding, great intro' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-xl text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-cyan-900 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-4">Escape to Goa</h2>
          <p className="text-xl opacity-90 mb-8">Best time: November to March. Weekend batches available.</p>
          <div className="flex gap-4 justify-center">
            <button className="bg-yellow-400 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition">
              Book Now
            </button>
            <Link href="/bike-tours" className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-cyan-900 transition">
              View All Tours
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="bike-on-rent" />
    </>
  );
}
