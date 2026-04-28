import { Metadata } from 'next';
import Link from 'next/link';
import { BikeTourHero } from '@/components/bike-tours/BikeTourHero';

export const metadata: Metadata = {
  title: 'Bike Trip Rentals India | Ladakh, Spiti, Rajasthan Motorcycle Tours | TransRentals',
  description: 'Rent bikes for road trips across India. Ladakh, Spiti Valley, Rajasthan, Goa bike tours. Royal Enfield, Himalayan available. One-way drops, gear included.',
  keywords: [
    'bike trip rental india',
    'motorcycle tour rental',
    'ladakh bike trip',
    'spiti valley bike rental',
    'rajasthan bike tour',
    'road trip bike rental',
    'touring bike rental',
  ],
  openGraph: {
    title: 'Bike Trip Rentals India | Adventure Motorcycle Tours | TransRentals',
    description: 'Rent bikes for road trips. Ladakh, Spiti, Rajasthan tours. Royal Enfield available.',
    type: 'website',
    url: 'https://transrentals.in/bike-trips',
  },
  alternates: {
    canonical: 'https://transrentals.in/bike-trips',
  },
};

export default function BikeTripsPage() {
  const trips = [
    {
      name: 'Ladakh Bike Trip',
      slug: 'ladakh',
      description: 'Conquer Khardung La, explore Pangong Lake, ride through Nubra Valley',
      duration: '7-15 days',
      bestTime: 'May - September',
      difficulty: 'Challenging',
      gradient: 'from-blue-600 to-indigo-700',
      highlights: ['Khardung La', 'Pangong Lake', 'Nubra Valley', 'Magnetic Hill'],
    },
    {
      name: 'Spiti Valley Tour',
      slug: 'spiti-valley',
      description: 'Explore the cold desert, ancient monasteries, and stunning landscapes',
      duration: '8-12 days',
      bestTime: 'June - October',
      difficulty: 'Challenging',
      gradient: 'from-green-600 to-teal-700',
      highlights: ['Kunzum Pass', 'Key Monastery', 'Chandratal Lake', 'Kaza'],
      comingSoon: true,
    },
    {
      name: 'Rajasthan Heritage Ride',
      slug: 'rajasthan',
      description: 'Ride through royal palaces, desert dunes, and vibrant cities',
      duration: '7-10 days',
      bestTime: 'October - March',
      difficulty: 'Moderate',
      gradient: 'from-orange-600 to-red-700',
      highlights: ['Jaipur', 'Jodhpur', 'Jaisalmer', 'Udaipur'],
      comingSoon: true,
    },
    {
      name: 'Goa Coastal Ride',
      slug: 'goa',
      description: 'Beach hopping, coastal roads, and vibrant nightlife',
      duration: '3-5 days',
      bestTime: 'November - March',
      difficulty: 'Easy',
      gradient: 'from-cyan-600 to-blue-700',
      highlights: ['Beach Roads', 'Old Goa', 'Dudhsagar Falls', 'Coastal Views'],
      comingSoon: true,
    },
  ];

  return (
    <>
      <BikeTourHero
        badge="Adventure Awaits"
        title="Bike Trip Rentals India"
        price="Explore the Unexplored"
        description="Rent bikes for epic road trips. Ladakh, Spiti, Rajasthan, Goa — we've got you covered with Royal Enfield, one-way drops, and full gear."
        gradient="from-indigo-900 via-purple-900 to-pink-900"
        accentColor="indigo-400"
        stats={[
          { icon: 'bike', label: 'Bikes Available', value: '50+' },
          { icon: 'mappin', label: 'Pickup Cities', value: '15+' },
          { icon: 'star', label: 'Rating', value: '4.8/5' },
          { icon: 'shield', label: 'Insurance', value: 'Included' },
        ]}
        features={[
          { text: 'Royal Enfield' },
          { text: 'One-Way Drops' },
          { text: 'Full Insurance' },
          { text: 'Riding Gear' },
          { text: 'Tool Kit' },
          { text: 'Permit Help' },
        ]}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Bike Trip Rentals Across India
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Royal Enfield • One-Way Drops • Riding Gear • 24/7 Support
            </p>
          </div>
        </div>
      </section>

      {/* Trips Grid */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">
            Popular Bike Trip Destinations
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {trips.map((trip) => (
              <div
                key={trip.slug}
                className={`relative bg-gradient-to-br ${trip.gradient} text-white rounded-xl overflow-hidden shadow-lg`}
              >
                {trip.comingSoon && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-black text-xs px-3 py-1 rounded-full font-semibold">
                    Coming Soon
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-2">{trip.name}</h3>
                  <p className="opacity-90 mb-4">{trip.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm mb-4">
                    <span className="bg-white/20 px-3 py-1 rounded">{trip.duration}</span>
                    <span className="bg-white/20 px-3 py-1 rounded">{trip.bestTime}</span>
                    <span className="bg-white/20 px-3 py-1 rounded">{trip.difficulty}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {trip.highlights.map((h) => (
                      <span key={h} className="text-xs bg-white/10 px-2 py-1 rounded">
                        {h}
                      </span>
                    ))}
                  </div>
                  {trip.comingSoon ? (
                    <button
                      disabled
                      className="bg-white/30 text-white px-6 py-2 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  ) : (
                    <Link
                      href={`/bike-trips/${trip.slug}`}
                      className="inline-block bg-white text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
                    >
                      Explore & Book →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Rent with TransRentals for Bike Trips?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏍️', title: 'Adventure-Ready Bikes', desc: 'Royal Enfield Himalayan, Classic 350 - proven for tough terrains' },
              { icon: '🔄', title: 'One-Way Drops', desc: 'Pick up in Delhi, drop in Leh (or any combination)' },
              { icon: '🛡️', title: 'Full Insurance', desc: 'Comprehensive coverage for peace of mind' },
              { icon: '🧥', title: 'Riding Gear', desc: 'Jackets, gloves, knee guards available' },
              { icon: '🔧', title: 'Maintained Bikes', desc: 'Serviced before every trip, tool kit included' },
              { icon: '📞', title: '24/7 Support', desc: 'Emergency support network across routes' },
              { icon: '📄', title: 'Permit Help', desc: 'Assistance with Inner Line Permits' },
              { icon: '💰', title: 'Best Rates', desc: 'Long-term discounts, no hidden charges' },
            ].map((f) => (
              <div key={f.title} className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-indigo-900 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-4">Ready for Your Next Adventure?</h2>
          <p className="text-xl opacity-90 mb-8">Start with Ladakh - the ultimate bike trip destination</p>
          <Link
            href="/bike-trips/ladakh"
            className="inline-block bg-yellow-400 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition"
          >
            Plan Ladakh Trip →
          </Link>
        </div>
      </section>
    </>
  );
}
