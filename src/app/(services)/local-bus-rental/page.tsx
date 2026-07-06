import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Local Bus Rental | Hourly & Half-Day Bus Hire in Your City | TransRentals',
  description:
    'Hire a bus or tempo traveller by the hour for local sightseeing, school trips, local weddings, and same-city events. 4-hour, 8-hour, and 12-hour packages. Driver included, no outstation charges.',
  keywords: [
    'local bus rental',
    'local bus hire',
    'bus on rent for local use',
    'hourly bus rental',
    'half day bus rental',
    'local bus rental near me',
    'local sightseeing bus',
    'city bus hire',
    'local tempo traveller rental',
  ],
  alternates: {
    canonical: 'https://transrentals.in/local-bus-rental',
  },
  openGraph: {
    title: 'Local Bus Rental | Hourly & Half-Day Bus Hire | TransRentals',
    description: 'Hire a bus by the hour for local sightseeing, school trips, weddings, and same-city events. 4/8/12-hour packages with driver included.',
    type: 'website',
    url: 'https://transrentals.in/local-bus-rental',
    images: [{ url: 'https://transrentals.in/api/og?service=local-bus-rental', width: 1200, height: 630, alt: 'Local Bus Rental - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Local Bus Rental | Hourly & Half-Day Bus Hire | TransRentals',
    description: 'Hire a bus by the hour for local sightseeing, school trips, and same-city events.',
    images: ['https://transrentals.in/api/og?service=local-bus-rental'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

const PACKAGES = [
  { name: '4-Hour / 40 km', price: 'Starting ₹2,999', bestFor: 'Local sightseeing, half-day school trips, city functions' },
  { name: '8-Hour / 80 km', price: 'Starting ₹4,999', bestFor: 'Full-day local weddings, corporate shuttles, local tours' },
  { name: '12-Hour / 120 km', price: 'Starting ₹6,999', bestFor: 'Full-day events, multi-stop local pickups, large functions' },
];

const USE_CASES = [
  { icon: '🏙️', title: 'Local Sightseeing', desc: 'City tours, day picnics' },
  { icon: '🎓', title: 'School Day Trips', desc: 'Same-day educational visits' },
  { icon: '💒', title: 'Local Wedding Functions', desc: 'Guest shuttle within city' },
  { icon: '🏢', title: 'Corporate Shuttles', desc: 'Office pickup & drop' },
  { icon: '🛕', title: 'Local Religious Events', desc: 'Processions, local temple visits' },
  { icon: '🎉', title: 'Local Parties & Functions', desc: 'Guest transport within city' },
];

const FAQS = [
  { question: 'What is the difference between local bus rental and outstation bus rental?', answer: 'Local bus rental is billed as an hourly/km package (e.g., 4 hrs/40 km) for travel within a single city, with no driver night-halt or outstation allowance charges. Outstation bus rental is billed per km for intercity travel and includes driver allowance for multi-day trips.' },
  { question: 'What is the minimum booking duration for a local bus rental?', answer: 'Most operators have a 4-hour minimum package. Shorter point-to-point local transfers may be available in select cities — ask for a custom quote if you need less than 4 hours.' },
  { question: 'What happens if I exceed the package hours or kilometers?', answer: 'Extra hours and extra kilometers beyond your package are billed at a fixed per-hour and per-km rate, disclosed upfront before booking. There are no hidden charges.' },
  { question: 'Is AC available for local bus rental packages?', answer: 'Yes, both AC and Non-AC buses and tempo travellers are available for local packages. AC is recommended for daytime bookings, especially March–June.' },
  { question: 'Can I book a local bus rental for the same day?', answer: 'Same-day booking is often possible subject to availability, but booking at least 24 hours in advance ensures you get your preferred bus size and AC/Non-AC option.' },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function LocalBusRentalPage() {
  return (
    <div className="min-h-screen">
      <HowToSchema
        name="How to Book a Local Bus Rental on TransRentals"
        description="Hire a bus or tempo traveller for local, same-city use in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Select Your City & Package', text: 'Choose your city and an hourly package — 4 hrs/40 km, 8 hrs/80 km, or 12 hrs/120 km.' },
          { name: 'Choose Bus Size', text: 'Pick a Tempo Traveller (9-17 seater) or mini bus (20-32 seater) based on group size.' },
          { name: 'Compare Local Operator Quotes', text: 'Review quotes from verified local bus operators. Check inclusions — driver, fuel, and extra km/hour rates.' },
          { name: 'Confirm Booking & Travel', text: 'Pay advance to confirm. Driver arrives at your pickup point for the scheduled local trip.' },
        ]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Local Bus Rental',
            description: 'Hire buses and tempo travellers by the hour for local sightseeing, school trips, weddings, and same-city events across India.',
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            areaServed: { '@type': 'Country', name: 'India' },
            serviceType: 'Local Bus Rental',
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
              { '@type': 'ListItem', position: 2, name: 'Bus Rental', item: 'https://transrentals.in/bus-rental' },
              { '@type': 'ListItem', position: 3, name: 'Local Bus Rental', item: 'https://transrentals.in/local-bus-rental' },
            ],
          }),
        }}
      />

      <ServiceHeroWithChat
        badge="Hourly & Half-Day Bus Hire"
        title="Local Bus Rental"
        titleHighlight="Starting ₹2,999 for 4 Hours"
        description="Hire a bus or tempo traveller by the hour for local sightseeing, school trips, weddings, and same-city events. Driver included, no outstation charges."
        features={[
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Verified Operators', color: 'text-blue-600' },
          { icon: 'zap', text: 'Same-Day Availability', color: 'text-green-600' },
        ]}
        gradientFrom="orange-50"
        gradientTo="red-50"
      />

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Local Bus Rental Packages</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Fixed hourly/km packages for travel within your city — no driver night-halt or outstation allowance.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PACKAGES.map((pkg) => (
              <div key={pkg.name} className="border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-orange-300 transition-all text-center">
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{pkg.name}</h3>
                <div className="text-2xl font-bold text-orange-600 mb-3">{pkg.price}</div>
                <p className="text-sm text-gray-500">{pkg.bestFor}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            * Rates vary by city, bus size, and AC/Non-AC choice. Extra hours/km charged at a fixed rate disclosed upfront.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">What Local Bus Rental Is Used For</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {USE_CASES.map((use) => (
              <div key={use.title} className="bg-white rounded-xl p-4 text-center hover:shadow-md transition flex flex-col items-center justify-center min-h-[140px]">
                <div className="text-3xl mb-2">{use.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm leading-tight">{use.title}</h3>
                <p className="text-xs text-gray-500 leading-snug">{use.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Local Bus Rental by City</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/bus-rental/${city.slug}`}
                className="text-center py-3 px-2 rounded-lg border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition text-sm font-medium text-gray-700 hover:text-orange-700"
              >
                {city.name}
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-4">Need outstation or a specific event type instead?</p>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <Link href="/bus-rental" className="text-orange-600 hover:underline">Outstation Bus Rental</Link>
              <span className="text-gray-300">|</span>
              <Link href="/wedding-bus-rental" className="text-orange-600 hover:underline">Wedding Bus Rental</Link>
              <span className="text-gray-300">|</span>
              <Link href="/corporate-bus-rental" className="text-orange-600 hover:underline">Corporate Bus Rental</Link>
              <span className="text-gray-300">|</span>
              <Link href="/26-seater-bus" className="text-orange-600 hover:underline">26 Seater Bus</Link>
            </div>
          </div>
        </div>
      </section>

      <FAQSection service="local-bus-rental" customFaqs={FAQS} />
    </div>
  );
}
