import { Metadata } from 'next';
import Link from 'next/link';
import { BikeTourHero } from '@/components/bike-tours/BikeTourHero';
import { FAQSection } from '@/components/services/FAQSection';
import { BikeServiceSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Ladakh Bike Trip Rental | Rent Himalayan, Classic 350 for Leh @₹799/Day | TransRentals',
  description: 'Rent Royal Enfield bikes for Ladakh trip. Himalayan, Classic 350, Bullet available in Delhi, Manali, Leh. Perfect for Khardung La, Pangong. One-way drops available. Book now!',
  keywords: [
    'ladakh bike trip',
    'bike rental for ladakh',
    'leh ladakh bike rental',
    'delhi to ladakh bike rent',
    'manali to leh bike rental',
    'himalayan on rent for ladakh',
    'bullet rental ladakh',
    'royal enfield ladakh trip',
    'khardung la bike trip',
    'pangong lake bike ride',
    'leh bike rental rates',
    'ladakh motorcycle tour',
    'spiti valley bike rental',
  ],
  openGraph: {
    title: 'Ladakh Bike Trip Rental | Royal Enfield @₹799/Day | TransRentals',
    description: 'Rent Royal Enfield for Ladakh. Himalayan, Classic 350 available in Delhi, Manali, Leh. One-way drops, gear included.',
    type: 'website',
    url: 'https://transrentals.in/bike-trips/ladakh',
    images: [
      {
        url: 'https://transrentals.in/images/og/ladakh-bike-trip.jpg',
        width: 1200,
        height: 630,
        alt: 'Ladakh Bike Trip Rental - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ladakh Bike Trip Rental | Starting @₹799/Day | TransRentals',
    description: 'Rent Royal Enfield for Ladakh trip. Himalayan, Classic 350 available.',
    images: ['https://transrentals.in/images/og/ladakh-bike-trip.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/bike-trips/ladakh',
  },
};

// Schema data
const schemaFaqs = [
  { question: 'Which bike is best for the Ladakh trip?', answer: 'Royal Enfield Himalayan is the best choice for Ladakh due to its 411cc engine, long-travel suspension, and reliability at high altitudes. Classic 350 and Meteor 350 are also popular choices, and Interceptor 650 or KTM Adventure 390 suit more experienced riders.' },
  { question: 'What is the best season to do a Ladakh bike trip?', answer: 'Ladakh is accessible for bike trips from May to September, once the Manali-Leh and Srinagar-Leh highways open for the season. June and September offer the most stable weather; July-August can bring occasional rain and landslides on the highway sections.' },
  { question: 'How do I avoid altitude sickness on the Ladakh bike trip?', answer: 'Spend 1-2 days acclimatizing in Leh (11,500 ft) before attempting high passes like Khardung La (18,380 ft). Stay well hydrated, avoid alcohol and heavy exertion on day one, and carry Diamox and basic medicines — our tips section covers this in detail.' },
  { question: 'What permits do I need for the Ladakh bike trip?', answer: 'An Inner Line Permit (ILP) is required for Nubra Valley, Pangong Lake, and Tso Moriri. Permits can be applied online or arranged in person in Leh; we can help you arrange these along with your bike rental.' },
  { question: 'Can I pick up the bike in Delhi and drop it in Leh?', answer: 'Yes, one-way rentals are available. Pick up in Delhi or Manali and drop in Leh (or vice versa). One-way charges apply (₹3,000-5,000).' },
  { question: 'How much does it cost to rent a bike for Ladakh, and what is included?', answer: 'Bike rental for Ladakh starts from ₹799/day for a Royal Enfield Classic 350; Himalayan costs ₹999-1,299/day, with 15-20% off on 10+ day packages. The package includes the bike, comprehensive insurance, a basic tool kit, first aid and puncture kit, and 24/7 roadside assistance. Helmets are free; fuel, permits, and accommodation are not included.' },
];

const schemaVehicles = [
  { name: 'Royal Enfield Himalayan', brand: 'Royal Enfield', price: 999, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
  { name: 'Royal Enfield Classic 350', brand: 'Royal Enfield', price: 799, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
  { name: 'Royal Enfield Meteor 350', brand: 'Royal Enfield', price: 899, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
  { name: 'Royal Enfield Interceptor 650', brand: 'Royal Enfield', price: 1299, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
  { name: 'KTM Adventure 390', brand: 'KTM', price: 1499, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
];

export default function LadakhBikeTripPage() {
  return (
    <>
      {/* Schema Markup */}
      <BikeServiceSchema
        serviceName="Ladakh Bike Trip Rental"
        serviceSlug="bike-trips/ladakh"
        description="Rent Royal Enfield bikes for Ladakh trip. Himalayan, Classic 350, Bullet available in Delhi, Manali, Leh. Perfect for Khardung La, Pangong, Nubra Valley."
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 799, max: 1499 }}
        rating={4.9}
        reviewCount={1856}
      />

      <BikeTourHero
        badge="Ladakh Bike Trip Specialists"
        title="Ladakh Bike Trip Rental"
        price="Royal Enfield @₹799/Day"
        description="Rent bikes for Leh Ladakh adventure. Himalayan, Classic 350, Bullet available in Delhi, Manali & Leh. One-way drops, riding gear included."
        gradient="from-blue-900 via-indigo-900 to-purple-900"
        accentColor="blue-400"
        stats={[
          { icon: 'bike', label: 'Starting From', value: '₹799/Day' },
          { icon: 'mountain', label: 'Max Altitude', value: '18,380 ft' },
          { icon: 'clock', label: 'Season', value: 'May – Sep' },
          { icon: 'mappin', label: 'One-Way Drops', value: 'Available' },
        ]}
        features={[
          { text: 'Himalayan & Classic 350' },
          { text: 'One-Way Drops' },
          { text: 'Delhi / Manali / Leh' },
          { text: 'Insurance Included' },
          { text: 'Riding Gear' },
          { text: '24/7 Support' },
        ]}
      />


      {/* Pickup Locations */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Pickup Locations for Ladakh Trip</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                city: 'Delhi',
                desc: 'Start your journey from the capital',
                route: 'Delhi → Manali → Leh (2 days riding)',
                popular: 'Most Popular',
                link: '/royal-enfield-on-rent/delhi'
              },
              {
                city: 'Manali',
                desc: 'Skip Delhi traffic, start from hills',
                route: 'Manali → Rohtang → Leh (1 day ride)',
                popular: 'Quick Start',
                link: '/royal-enfield-on-rent/manali'
              },
              {
                city: 'Leh',
                desc: 'Fly in, ride around Ladakh',
                route: 'Explore Nubra, Pangong, Tso Moriri',
                popular: 'Fly & Ride',
                link: '/royal-enfield-on-rent/leh'
              },
            ].map((loc) => (
              <Link
                key={loc.city}
                href={loc.link}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg shadow-md hover:shadow-xl transition group"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold group-hover:text-indigo-700">{loc.city}</h3>
                  <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded">{loc.popular}</span>
                </div>
                <p className="text-gray-600 mb-2">{loc.desc}</p>
                <p className="text-sm text-indigo-600 font-medium">{loc.route}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section id="routes" className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">
            Popular Ladakh Bike Routes
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                route: 'Manali-Leh Highway',
                days: '2 days riding',
                distance: '490 km',
                highlights: ['Rohtang Pass', 'Keylong', 'Baralacha La', 'Sarchu', 'Tanglang La'],
                difficulty: 'Challenging',
                gradient: 'from-blue-500 to-cyan-600',
              },
              {
                route: 'Leh to Nubra Valley',
                days: '1 day ride',
                distance: '160 km',
                highlights: ['Khardung La (18,380 ft)', 'Diskit Monastery', 'Hunder Sand Dunes', 'Double Hump Camels'],
                difficulty: 'Moderate',
                gradient: 'from-purple-500 to-pink-600',
              },
              {
                route: 'Leh to Pangong Lake',
                days: '1 day ride',
                distance: '160 km',
                highlights: ['Chang La Pass', 'Tangtse Village', 'Pangong Tso', '3 Idiots Point', 'Blue Waters'],
                difficulty: 'Moderate',
                gradient: 'from-indigo-500 to-blue-600',
              },
              {
                route: 'Srinagar-Leh Highway',
                days: '2 days riding',
                distance: '420 km',
                highlights: ['Zoji La', 'Drass', 'Kargil', 'Lamayuru', 'Magnetic Hill'],
                difficulty: 'Moderate',
                gradient: 'from-green-500 to-teal-600',
              },
              {
                route: 'Tso Moriri Lake',
                days: '2 days round trip',
                distance: '400 km',
                highlights: ['Tso Kar Lake', 'Puga Hot Springs', 'Korzok Village', 'Wildlife Spotting'],
                difficulty: 'Challenging',
                gradient: 'from-orange-500 to-red-600',
              },
              {
                route: 'Hanle & Umling La',
                days: '2 days round trip',
                distance: '500 km',
                highlights: ['Umling La (19,024 ft)', 'Highest Motorable Road', 'Hanle Observatory', 'Stargazing'],
                difficulty: 'Expert',
                gradient: 'from-yellow-500 to-orange-600',
              },
            ].map((trip) => (
              <div key={trip.route} className={`bg-gradient-to-br ${trip.gradient} text-white p-6 rounded-xl shadow-lg`}>
                <h3 className="text-xl font-bold mb-2">{trip.route}</h3>
                <div className="flex gap-4 text-sm mb-3">
                  <span>{trip.days}</span>
                  <span>•</span>
                  <span>{trip.distance}</span>
                </div>
                <div className="bg-white/20 backdrop-blur px-3 py-1 rounded inline-block text-sm mb-3">
                  {trip.difficulty}
                </div>
                <ul className="space-y-1 text-sm opacity-90">
                  {trip.highlights.map((h, i) => (
                    <li key={i}>→ {h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">
            Ladakh Bike Trip Tips
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🗓️', title: 'Best Season', desc: 'May to September. July-August may have rain. June & September are ideal.' },
              { icon: '🏔️', title: 'Acclimatize', desc: 'Spend 1-2 days in Leh before high passes. Stay hydrated, avoid alcohol.' },
              { icon: '⛽', title: 'Fuel Stops', desc: 'Fill tank at every opportunity. Carry extra petrol (5L) for remote areas.' },
              { icon: '📄', title: 'Permits', desc: 'Inner Line Permit required for Nubra, Pangong, Tso Moriri. Apply online or in Leh.' },
              { icon: '💊', title: 'Medicine', desc: 'Carry Diamox for altitude sickness. Basic medicines, sunscreen, lip balm essential.' },
              { icon: '🧥', title: 'Clothing', desc: 'Layer up! Even in summer, passes are freezing. Waterproof jacket a must.' },
              { icon: '🔧', title: 'Bike Check', desc: 'Check brakes, clutch, tyres before each ride. Carry spare tubes, chain link.' },
              { icon: '📱', title: 'Connectivity', desc: 'Only BSNL/Jio works in Ladakh. Download offline maps. Inform someone of route.' },
            ].map((tip) => (
              <div key={tip.title} className="bg-white p-5 rounded-lg shadow-md">
                <div className="text-3xl mb-2">{tip.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{tip.title}</h3>
                <p className="text-sm text-gray-600">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQSection service="bike-on-rent" customFaqs={schemaFaqs} />
    </>
  );
}
