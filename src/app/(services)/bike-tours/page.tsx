import { Metadata } from 'next';
import Link from 'next/link';
import { BikeTourHero } from '@/components/bike-tours/BikeTourHero';
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
      <BikeTourHero
        badge="Guided Motorcycle Tours"
        title="Bike Tours India"
        price="All-Inclusive Packages"
        description="Join our guided motorcycle tours with ride captain, backup vehicle, accommodation, and meals. Just ride and enjoy — we handle everything else."
        gradient="from-purple-900 via-indigo-900 to-blue-900"
        accentColor="purple-400"
        stats={[
          { icon: 'star' as const, label: 'Customer Rating', value: '4.9/5' },
          { icon: 'users' as const, label: 'Group Size', value: '6–12' },
          { icon: 'mappin' as const, label: 'Destinations', value: '4+' },
          { icon: 'clock' as const, label: 'Tour Length', value: '4–12 Days' },
        ]}
        features={[
          { text: 'Ride Captain' },
          { text: 'Backup Vehicle' },
          { text: 'Accommodation' },
          { text: 'Meals Included' },
          { text: 'Riding Gear' },
          { text: 'All Permits' },
        ]}
      />

      {/* Sub-hero strip */}
      <section className="bg-gray-900 text-white py-10 border-b border-gray-700">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg md:text-xl text-gray-300 mb-2">
              Ride Captain • Backup Vehicle • Accommodation • Meals
            </p>
            <p className="text-sm text-gray-400 mb-6">Small Groups of 6–12 Riders</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#tours" className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition">
                View All Tours
              </a>
              <Link href="/bike-trips/ladakh" className="border border-gray-500 text-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition">
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
