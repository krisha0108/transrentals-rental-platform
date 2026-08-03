import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { ServiceLocationsGrid } from '@/components/services/ServiceLocationsGrid';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';
import { HowToSchema } from '@/components/seo/schemas';

const TEMPO_FAQS = [
  {
    q: 'What is the cost of a Tempo Traveller per km in India?',
    a: 'Tempo Traveller rental rates in India start from ₹18/km for a 9-seater and vary by seater capacity, AC/non-AC, and trip duration. Day packages (8 hrs/80 km) are a popular option for local trips. Outstation rates include driver allowance and vary by state. Get a quote on TransRentals for your specific route.',
  },
  {
    q: 'What is the difference between a 12-seater and 17-seater Tempo Traveller?',
    a: 'The 12-seater Tempo Traveller is a Force Traveller or Tata Winger with 3+9 seat configuration — ideal for groups of 10–12. The 17-seater has a longer wheelbase with 3+14 configuration and larger luggage boot — best for groups of 14–17 and longer trips with heavy luggage.',
  },
  {
    q: 'Are Tempo Travellers AC or non-AC?',
    a: 'Both AC and non-AC Tempo Travellers are available on TransRentals. AC versions with roof-mounted AC units are recommended for summer trips (March–June) and south Indian routes. Non-AC is sufficient for hill stations and winter travel in north India.',
  },
  {
    q: 'How far in advance should I book a Tempo Traveller?',
    a: 'For regular trips, 48–72 hours notice is sufficient. During peak seasons — Navratri, Diwali, long weekends, and Char Dham season (May–June) — book at least 1–2 weeks in advance. For large group travel during pilgrimages, 3–4 weeks advance booking is recommended.',
  },
  {
    q: 'Can a Tempo Traveller go on hilly routes like Manali or Ooty?',
    a: 'Yes, most Tempo Travellers (Force Traveller/Tata Winger) can handle moderate ghat roads. For steep high-altitude routes like Manali-Leh, Spiti Valley, or Zanskar, a more powerful SUV or 4WD is recommended. Always request hill-experienced drivers for ghat routes.',
  },
  {
    q: 'What is included in the Tempo Traveller booking price?',
    a: 'Standard inclusions: vehicle + driver + driver\'s basic allowance for the trip duration. Extra charges typically apply for: toll charges, state permits for interstate travel, night halt charges (₹250–₹500/night), and fuel if crossing the included km limit.',
  },
];

const TOP_CITIES = [
  { name: 'Delhi', slug: 'delhi' },
  { name: 'Mumbai', slug: 'mumbai' },
  { name: 'Bangalore', slug: 'bangalore' },
  { name: 'Jaipur', slug: 'jaipur' },
  { name: 'Hyderabad', slug: 'hyderabad' },
  { name: 'Chennai', slug: 'chennai' },
  { name: 'Pune', slug: 'pune' },
  { name: 'Lucknow', slug: 'lucknow' },
  { name: 'Chandigarh', slug: 'chandigarh' },
  { name: 'Kochi', slug: 'kochi' },
  { name: 'Ahmedabad', slug: 'ahmedabad' },
  { name: 'Coimbatore', slug: 'coimbatore' },
];

export const metadata: Metadata = {
  title: 'Tempo Traveller on Rent | 12-20 Seater | ₹18/km',
  description: 'Rent Tempo Traveller for group travel across India. 9, 12, 14, 17 seater AC/Non-AC available. Pilgrimages, family trips, corporate events. Verified drivers across 50+ cities.',
  keywords: [
    'tempo traveller on rent',
    '12 seater tempo traveller',
    '17 seater tempo traveller',
    'force traveller',
    'tempo booking',
    'group travel vehicle',
    'family trip vehicle',
    'tempo on rent',
    'traveller on hire',
    'mini bus rental',
    '20 seater tempo',
    'tempo for outstation',
  ],
  openGraph: {
    title: 'Tempo Traveller on Rent India | 12-17 Seater | TransRentals',
    description: 'Book Tempo Traveller for group travel across India. Comfortable AC/Non-AC vehicles for pilgrimages, family trips, and corporate events.',
  },
};

export default function TempoTravellerPage() {
  const occasionsSection = (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Perfect for Every Occasion
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { occasion: 'Family Trips', icon: '👨‍👩‍👧‍👦', desc: 'Hill stations, vacations' },
            { occasion: 'Pilgrimages', icon: '🛕', desc: 'Temple tours, Char Dham' },
            { occasion: 'Corporate Events', icon: '💼', desc: 'Team outings, meetings' },
            { occasion: 'School Trips', icon: '🎒', desc: 'Educational tours, picnics' },
            { occasion: 'Weddings', icon: '💒', desc: 'Guest transport, baraat' },
            { occasion: 'Airport Transfers', icon: '✈️', desc: 'Group pickups & drops' },
            { occasion: 'Sightseeing', icon: '📸', desc: 'City tours, monuments' },
            { occasion: 'Outstation Tours', icon: '🗺️', desc: 'Multi-city trips' },
          ].map((item) => (
            <div key={item.occasion} className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{item.occasion}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <>
      <HowToSchema
        name="How to Book a Tempo Traveller on TransRentals"
        description="Rent a tempo traveller for group travel in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Enter Trip Details', text: 'Enter pickup city, destination, travel date, and number of passengers. Choose between AC and non-AC.' },
          { name: 'Choose Seater Capacity', text: 'Select 9-seater, 12-seater, 14-seater, or 17-seater Tempo Traveller based on group size and luggage.' },
          { name: 'Compare Vendor Quotes', text: 'Review per-km rates from verified operators. Check inclusions — driver allowance, toll charges, and state permit.' },
          { name: 'Confirm & Travel', text: 'Pay advance to confirm booking. Driver arrives at pickup point on travel date with a well-maintained vehicle.' },
        ]}
      />
      {/* Hero with Chat Booking System */}
      <ServiceHeroWithChat
        badge="Tempo Traveller Rental"
        title="Tempo Traveller"
        titleHighlight="AC & Non-AC | All India"
        description="12, 17, 20 Seater AC Tempo Travellers for family trips, pilgrimages, corporate events. Professional drivers included!"
        features={[
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Verified Vendors', color: 'text-blue-600' },
          { icon: 'star', text: 'Group Travel', color: 'text-green-600' },
        ]}
        gradientFrom="orange-50"
        gradientTo="amber-50"
      />

      {/* Fleet Display from Database */}
      <ServiceFleetDisplay
        serviceSlug="tempo-traveller"
        title="Our Tempo Traveller Fleet"
        showCategories={true}
        limit={12}
        priceUnit="/km"
      />

      {/* Locations from Database */}
      <ServiceLocationsGrid
        serviceSlug="tempo-traveller"
        title="Tempo Traveller in Popular Cities"
        startingPrice="₹18"
        priceUnit="/km"
      />

      {occasionsSection}

      {/* Tempo Traveller FAQ Section */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tempo Traveller Rental FAQs</h2>
            <p className="text-gray-600">Common questions about hiring a Tempo Traveller in India</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {TEMPO_FAQS.map((faq, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal City Links */}
      <section className="py-10 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">Tempo Traveller by City</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/tempo-traveller/${city.slug}`}
                className="text-center py-2.5 px-2 rounded-lg border border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition text-sm font-medium text-gray-700 hover:text-amber-700"
              >
                {city.name}
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <Link href="/12-seater-tempo-traveller" className="text-amber-600 hover:underline">12 Seater Tempo Traveller</Link>
              <span className="text-gray-300">|</span>
              <Link href="/17-seater-tempo-traveller" className="text-amber-600 hover:underline">17 Seater Tempo Traveller</Link>
              <span className="text-gray-300">|</span>
              <Link href="/bus-rental" className="text-amber-600 hover:underline">Bus Rental India</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: TEMPO_FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: { '@type': 'Answer', text: faq.a },
            })),
          }),
        }}
      />
    </>
  );
}
