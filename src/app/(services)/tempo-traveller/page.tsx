import { Metadata } from 'next';
import Link from 'next/link';
import {
  MessageCircleQuestion, Plus, MapPin, ArrowRight, Users, Armchair, Bus,
  Landmark, Briefcase, Backpack, Heart, Plane, Camera, Map,
} from 'lucide-react';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
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
    <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/25 to-white">
      {/* Halka dotted pattern — upar baayin aur neeche daayin kone me */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          WebkitMaskImage:
            'radial-gradient(420px 320px at 6% 8%, #000 0%, transparent 70%), radial-gradient(420px 320px at 94% 92%, #000 0%, transparent 70%)',
          maskImage:
            'radial-gradient(420px 320px at 6% 8%, #000 0%, transparent 70%), radial-gradient(420px 320px at 94% 92%, #000 0%, transparent 70%)',
        }}
      />

      <div className="container-custom relative">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-primary-700">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            EVERY KIND OF TRIP
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          </span>
          <h2 className="mt-4 text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900">
            Perfect for
            <br />
            <span className="text-primary">Every Occasion</span>
          </h2>
          <p className="mt-4 text-base md:text-lg text-gray-600">
            One vehicle, many kinds of journeys — pick the seater that fits your group.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {[
            { Icon: Users, occasion: 'Family Trips', desc: 'Hill stations, vacations' },
            { Icon: Landmark, occasion: 'Pilgrimages', desc: 'Temple tours, Char Dham' },
            { Icon: Briefcase, occasion: 'Corporate Events', desc: 'Team outings, meetings' },
            { Icon: Backpack, occasion: 'School Trips', desc: 'Educational tours, picnics' },
            { Icon: Heart, occasion: 'Weddings', desc: 'Guest transport, baraat' },
            { Icon: Plane, occasion: 'Airport Transfers', desc: 'Group pickups & drops' },
            { Icon: Camera, occasion: 'Sightseeing', desc: 'City tours, monuments' },
            { Icon: Map, occasion: 'Outstation Tours', desc: 'Multi-city trips' },
          ].map(({ Icon, occasion, desc }) => (
            <div
              key={occasion}
              className="group rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 px-4 py-5 text-center"
            >
              {/* Hara gol icon, uske chaaron taraf dashed halka chakkar */}
              <div className="relative w-14 h-14 mx-auto mb-3.5">
                <span className="absolute inset-0 rounded-full border-2 border-dashed border-primary-200 rotate-[18deg] group-hover:rotate-[78deg] transition-transform duration-500" />
                <span className="absolute inset-[5px] rounded-full bg-primary-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-600" strokeWidth={1.9} />
                </span>
              </div>
              <h3 className="font-bold text-[15px] text-gray-900 leading-snug">{occasion}</h3>
              <p className="mt-1 text-[12.5px] leading-snug text-gray-500">{desc}</p>
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
          { icon: 'star', text: '4.7/5 Rating', sub: 'By travellers', color: 'text-amber-500' },
          { icon: 'shield', text: 'Verified Vendors', sub: 'Across India', color: 'text-blue-600' },
          { icon: 'users', text: 'Group Travel', sub: '9 to 20 seater', color: 'text-green-600' },
          { icon: 'tag', text: 'Best Price', sub: 'Guaranteed', color: 'text-green-600' },
        ]}
        gradientFrom="orange-50"
        gradientTo="amber-50"
        serviceType="tempo-traveller"
        backgroundImage="/images/sections/tempo-traveller-hero-bg.webp"
        bookingVariant="tempo"
        heroStats={[
          { icon: 'tag', value: '₹18/km', label: 'Starting rate' },
          { icon: 'shield', value: '500+', label: 'Verified operators' },
          { icon: 'map', value: '150+', label: 'Cities served' },
          { icon: 'headphones', value: '24/7', label: 'Customer support' },
        ]}
      />

      {/* Fleet Display from Database */}
      <ServiceFleetDisplay
        serviceSlug="tempo-traveller"
        title="Our Tempo Traveller Fleet"
        showCategories={true}
        limit={12}
        priceUnit="/km"
      />

      {/* Locations */}
      <StaticServicePopularCitiesGrid
        serviceSlug="tempo-traveller"
        title="Tempo Traveller in Available Cities"
      />

      {occasionsSection}

      {/* FAQs */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage:
              'radial-gradient(380px 300px at 3% 12%, #000 0%, transparent 70%), radial-gradient(380px 300px at 97% 88%, #000 0%, transparent 70%)',
            maskImage:
              'radial-gradient(380px 300px at 3% 12%, #000 0%, transparent 70%), radial-gradient(380px 300px at 97% 88%, #000 0%, transparent 70%)',
          }}
        />

        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-primary-700">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              GOOD TO KNOW
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Tempo Traveller Rental <span className="text-primary">FAQs</span>
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Common questions about hiring a Tempo Traveller in India
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-3">
            {TEMPO_FAQS.map((faq, idx) => (
              /* <details> — bina kisi client JS ke khulta-band hota hai */
              <details
                key={idx}
                open={idx === 0}
                className="group rounded-2xl bg-white border border-gray-100 shadow-sm open:border-primary-200 open:shadow-md transition-all"
              >
                <summary className="flex items-center gap-4 px-4 sm:px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-primary-50 grid place-items-center">
                    <MessageCircleQuestion className="w-[18px] h-[18px] text-primary" />
                  </span>
                  <h3 className="flex-1 font-bold text-[15px] leading-snug text-gray-900">
                    {faq.q}
                  </h3>
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 text-gray-500 grid place-items-center transition-all duration-200 group-open:rotate-45 group-open:bg-primary group-open:text-white">
                    <Plus className="w-4 h-4" />
                  </span>
                </summary>
                <p className="px-4 sm:px-5 pb-5 sm:pl-[4.25rem] text-[14px] leading-relaxed text-gray-500">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Internal City Links */}
      <section className="relative py-16 bg-white border-t border-gray-100 overflow-hidden">
        {/* Subtle grid-line pattern background */}
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'linear-gradient(#ecfdf5 1px, transparent 1px), linear-gradient(90deg, #ecfdf5 1px, transparent 1px)',
            backgroundSize: '34px 34px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 90%)',
          }}
        />
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
              <MapPin className="w-4 h-4" />
              Browse by City
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Tempo Traveller by City</h2>
            <p className="text-gray-500">Jump straight to a city&apos;s dedicated page</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-5xl mx-auto mb-8">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/tempo-traveller/${city.slug}`}
                className="flex items-center gap-2 bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                </span>
                {city.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
            {[
              { href: '/12-seater-tempo-traveller', label: '12 Seater Tempo Traveller', icon: Users },
              { href: '/17-seater-tempo-traveller', label: '17 Seater Tempo Traveller', icon: Armchair },
              { href: '/bus-rental', label: 'Bus Rental India', icon: Bus },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 bg-white border border-gray-100 hover:border-emerald-200 rounded-xl px-4 py-2.5 text-sm font-bold text-emerald-700 transition-colors"
              >
                <link.icon className="w-4 h-4 text-emerald-600" />
                {link.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
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
