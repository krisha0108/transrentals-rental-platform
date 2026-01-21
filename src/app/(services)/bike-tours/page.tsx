import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';

export const metadata: Metadata = {
  title: 'Guided Bike Tours India | Leh Ladakh, Spiti, Rajasthan Motorcycle Tours | TransRentals',
  description: 'Book guided motorcycle tours across India. Leh Ladakh, Spiti Valley, Rajasthan, Goa tours with ride captain, backup vehicle, accommodation & meals included. Starting ₹24,999.',
  keywords: [
    'guided bike tours india',
    'motorcycle tours india',
    'leh ladakh bike tour',
    'spiti valley motorcycle tour',
    'rajasthan bike tour package',
    'goa motorcycle tour',
    'adventure bike tours',
  ],
  openGraph: {
    title: 'Guided Motorcycle Tours India | All-Inclusive Packages | TransRentals',
    description: 'Book guided bike tours with ride captain, backup vehicle, accommodation & meals. Ladakh, Spiti, Rajasthan, Goa.',
    type: 'website',
    url: 'https://transrentals.in/bike-tours',
    images: [
      {
        url: 'https://transrentals.in/images/og/bike-tours.jpg',
        width: 1200,
        height: 630,
        alt: 'Guided Motorcycle Tours India - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guided Bike Tours India | TransRentals',
    description: 'All-inclusive motorcycle tours starting ₹24,999.',
  },
  alternates: {
    canonical: 'https://transrentals.in/bike-tours',
  },
};

const tours = [
  {
    name: 'Leh Ladakh Bike Tour',
    slug: 'leh-ladakh',
    tagline: 'The Ultimate Himalayan Adventure',
    description: 'Conquer the highest motorable roads, experience Pangong Lake, and ride through Nubra Valley',
    duration: '10 Days / 9 Nights',
    distance: '1,200+ km',
    difficulty: 'Challenging',
    bestTime: 'May - September',
    startingPrice: 32999,
    gradient: 'from-blue-600 to-indigo-700',
    highlights: ['Khardung La (18,380 ft)', 'Pangong Lake', 'Nubra Valley', 'Magnetic Hill', 'Tso Moriri'],
    routes: ['Delhi - Manali - Leh - Srinagar', 'Manali - Leh - Manali'],
  },
  {
    name: 'Spiti Valley Expedition',
    slug: 'spiti-valley',
    tagline: 'The Cold Desert Adventure',
    description: 'Explore ancient monasteries, pristine lakes, and the rugged beauty of Spiti',
    duration: '8 Days / 7 Nights',
    distance: '900+ km',
    difficulty: 'Challenging',
    bestTime: 'June - October',
    startingPrice: 26999,
    gradient: 'from-teal-600 to-emerald-700',
    highlights: ['Kunzum Pass', 'Key Monastery', 'Chandratal Lake', 'Kaza', 'Pin Valley'],
    routes: ['Shimla - Spiti - Manali', 'Manali - Spiti - Shimla'],
  },
  {
    name: 'Rajasthan Royal Ride',
    slug: 'rajasthan',
    tagline: 'Palaces, Forts & Desert Dunes',
    description: 'Ride through royal heritage, golden sand dunes, and vibrant Rajasthani culture',
    duration: '7 Days / 6 Nights',
    distance: '800+ km',
    difficulty: 'Moderate',
    bestTime: 'October - March',
    startingPrice: 24999,
    gradient: 'from-orange-600 to-red-700',
    highlights: ['Jaipur Forts', 'Jodhpur Blue City', 'Jaisalmer Desert', 'Udaipur Lakes', 'Pushkar'],
    routes: ['Delhi - Jaipur - Jodhpur - Jaisalmer - Udaipur'],
  },
  {
    name: 'Goa Coastal Explorer',
    slug: 'goa',
    tagline: 'Beaches, Backroads & Good Vibes',
    description: 'Beach hopping, scenic coastal roads, waterfalls, and Portuguese heritage',
    duration: '4 Days / 3 Nights',
    distance: '400+ km',
    difficulty: 'Easy',
    bestTime: 'November - March',
    startingPrice: 14999,
    gradient: 'from-cyan-600 to-blue-700',
    highlights: ['North Goa Beaches', 'Dudhsagar Falls', 'Old Goa Churches', 'Coastal Highway', 'Spice Plantations'],
    routes: ['Goa - Dudhsagar - Karnataka Border - Goa'],
  },
];

const inclusions = [
  { icon: '🏍️', title: 'Royal Enfield Bike', desc: 'Himalayan/Classic 350 with full tank' },
  { icon: '👨‍✈️', title: 'Ride Captain', desc: 'Experienced guide leading the group' },
  { icon: '🚐', title: 'Backup Vehicle', desc: 'Support vehicle with mechanic' },
  { icon: '🏨', title: 'Accommodation', desc: 'Hotels, camps & homestays' },
  { icon: '🍽️', title: 'Meals', desc: 'Breakfast & dinner included' },
  { icon: '🛡️', title: 'Insurance', desc: 'Comprehensive coverage' },
  { icon: '🧥', title: 'Riding Gear', desc: 'Jacket, gloves, knee guards' },
  { icon: '📄', title: 'Permits', desc: 'All required permits arranged' },
];

export default function BikeToursPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Guided Motorcycle Tours"
        title="Bike Tours India"
        titleHighlight="All-Inclusive Packages"
        description="Join our guided motorcycle tours with ride captain, backup vehicle, accommodation, and meals. Just ride and enjoy - we handle everything else."
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'All-Inclusive', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Expert Guides', color: 'text-purple-600' },
        ]}
        gradientFrom="purple-50"
        gradientTo="indigo-50"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Guided Motorcycle Tours Across India
            </h1>
            <p className="text-xl md:text-2xl mb-4 opacity-90">
              Ride Captain • Backup Vehicle • Accommodation • Meals
            </p>
            <p className="text-lg opacity-75 mb-8">
              Starting from ₹14,999 | Small Groups of 6-12 Riders
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#tours" className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition">
                View All Tours
              </a>
              <Link href="/bike-trips/ladakh" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-900 transition">
                Most Popular: Ladakh
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            What&apos;s Included in Every Tour
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {inclusions.map((item) => (
              <div key={item.title} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tours Grid */}
      <section id="tours" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-4">
            Our Guided Motorcycle Tours
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Choose your adventure. All tours include bike, guide, backup vehicle, accommodation, and meals.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {tours.map((tour) => (
              <div
                key={tour.slug}
                className={`relative bg-gradient-to-br ${tour.gradient} text-white rounded-xl overflow-hidden shadow-lg`}
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm opacity-75 mb-1">{tour.tagline}</p>
                      <h3 className="text-2xl font-bold">{tour.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-75">Starting from</p>
                      <p className="text-2xl font-bold">₹{tour.startingPrice.toLocaleString()}</p>
                    </div>
                  </div>

                  <p className="opacity-90 mb-4">{tour.description}</p>

                  <div className="flex flex-wrap gap-3 text-sm mb-4">
                    <span className="bg-white/20 px-3 py-1 rounded">{tour.duration}</span>
                    <span className="bg-white/20 px-3 py-1 rounded">{tour.distance}</span>
                    <span className="bg-white/20 px-3 py-1 rounded">{tour.difficulty}</span>
                    <span className="bg-white/20 px-3 py-1 rounded">{tour.bestTime}</span>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs opacity-75 mb-2">Highlights:</p>
                    <div className="flex flex-wrap gap-2">
                      {tour.highlights.slice(0, 4).map((h) => (
                        <span key={h} className="text-xs bg-white/10 px-2 py-1 rounded">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/bike-tours/${tour.slug}`}
                    className="inline-block bg-white text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
                  >
                    View Itinerary & Book →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Self-Ride Option */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl p-8 md:p-12">
            <div className="md:flex md:items-center md:justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Prefer Self-Ride?</h2>
                <p className="opacity-90">Rent a bike and plan your own adventure. One-way drops available.</p>
              </div>
              <div className="flex gap-4">
                <Link href="/bike-trips/ladakh" className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                  Self-Ride Options
                </Link>
                <Link href="/royal-enfield-on-rent" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition">
                  Rent Royal Enfield
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Guided Tours Work
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Choose Tour', desc: 'Select your preferred destination and dates' },
              { step: '2', title: 'Book & Pay', desc: 'Pay 25% to confirm, rest 30 days before' },
              { step: '3', title: 'Join Group', desc: 'Meet fellow riders at the starting point' },
              { step: '4', title: 'Ride & Enjoy', desc: 'Follow the ride captain, we handle everything' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Riders Say
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Rahul S.', tour: 'Ladakh Tour', text: 'Best decision ever! The ride captain knew every corner. Backup vehicle saved us twice. Unforgettable experience.' },
              { name: 'Priya M.', tour: 'Spiti Valley', text: 'As a solo female rider, I felt completely safe. The group was amazing and the accommodations were top-notch.' },
              { name: 'Amit K.', tour: 'Rajasthan', text: 'The desert camping and palace stays were incredible. Worth every rupee. Already planning the Ladakh tour!' },
            ].map((review) => (
              <div key={review.name} className="bg-gray-50 p-6 rounded-lg">
                <div className="flex gap-1 text-yellow-400 mb-3">★★★★★</div>
                <p className="text-gray-700 mb-4">&quot;{review.text}&quot;</p>
                <div>
                  <p className="font-semibold">{review.name}</p>
                  <p className="text-sm text-gray-500">{review.tour}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQSection service="bike-on-rent" />
    </>
  );
}
