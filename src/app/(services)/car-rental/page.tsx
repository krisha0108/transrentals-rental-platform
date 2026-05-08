import { Metadata } from 'next';
import Link from 'next/link';
import { CarSubServicesGrid } from '@/components/services/CarSubServicesGrid';
import { SimpleServiceHero } from '@/components/services/SimpleServiceHero';
import { ServiceLocationsGrid } from '@/components/services/ServiceLocationsGrid';
import { HowToSchema, FAQSchema, BreadcrumbSchema } from '@/components/seo/schemas';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';

const CAR_RENTAL_FAQS = [
  {
    q: 'What is the cost of car rental per day in India?',
    a: 'Car rental rates in India start from ₹999/day for a hatchback (self-drive) and ₹1,500/day for a chauffeur-driven sedan. SUVs start from ₹2,500/day. Rates vary by city, vehicle type, and whether it is self-drive or with driver. Outstation trips are typically charged per km (₹12–18/km). Get a free quote on TransRentals for your specific route.',
  },
  {
    q: 'What documents are required to rent a car in India?',
    a: 'For self-drive: valid driving licence (minimum 1 year old), Aadhaar Card or Passport as ID proof, and a refundable security deposit. For chauffeur-driven: any valid government ID is sufficient — no DL required from the customer. International tourists need an IDP (International Driving Permit) along with their home country licence.',
  },
  {
    q: 'What is the difference between self-drive and chauffeur-driven car rental?',
    a: 'Self-drive means you drive the car yourself — ideal for road trips, flexible schedules, and lower cost. Chauffeur-driven means a professional driver comes with the car — ideal for airport transfers, business travel, weddings, and outstation trips where you want to relax. Both options are available across 250+ cities on TransRentals.',
  },
  {
    q: 'Can I take a rental car for an outstation trip from one city to another?',
    a: 'Yes, outstation one-way and round-trip bookings are available. Popular routes: Delhi–Agra (230 km), Mumbai–Pune (150 km), Bangalore–Mysore (150 km). One-way rentals are 30–40% cheaper than round trips. Confirm outstation permission with the vendor before booking.',
  },
  {
    q: 'What is typically included in the car rental price?',
    a: 'Standard inclusions vary by booking type. Self-drive packages include vehicle + km allowance (100–300 km/day). Chauffeur-driven includes vehicle + driver + driver allowance. Extra charges typically apply for: excess km, airport toll surcharges, night driving charges, and inter-state permits. Check the quote summary carefully before confirming.',
  },
  {
    q: 'Are there any age restrictions for renting a car in India?',
    a: 'For self-drive: minimum age is 18 years with a valid DL. Most vendors prefer renters above 21 for SUV categories. DL must be at least 1 year old. For chauffeur-driven, there is no age restriction for the passenger.',
  },
  {
    q: 'What happens if the rental car breaks down during the trip?',
    a: 'All TransRentals-listed vendors provide 24/7 roadside assistance. In case of a breakdown, call the vendor immediately — they will arrange for on-road support or a replacement vehicle depending on availability. Document the breakdown with photos before any assistance arrives.',
  },
  {
    q: 'Is fuel included in the car rental price?',
    a: 'For self-drive: fuel is typically NOT included — most vendors operate on a full-to-full policy (you receive the car with a full tank and return it full). For chauffeur-driven outstation trips: fuel is included in the per-km rate. For local city packages (8 hr / 80 km): fuel may or may not be included — confirm at booking.',
  },
];

const TOP_CITIES = [
  { name: 'Delhi', slug: 'delhi' },
  { name: 'Mumbai', slug: 'mumbai' },
  { name: 'Bangalore', slug: 'bangalore' },
  { name: 'Hyderabad', slug: 'hyderabad' },
  { name: 'Chennai', slug: 'chennai' },
  { name: 'Pune', slug: 'pune' },
  { name: 'Jaipur', slug: 'jaipur' },
  { name: 'Ahmedabad', slug: 'ahmedabad' },
  { name: 'Kolkata', slug: 'kolkata' },
  { name: 'Lucknow', slug: 'lucknow' },
  { name: 'Chandigarh', slug: 'chandigarh' },
  { name: 'Kochi', slug: 'kochi' },
];

export const metadata: Metadata = {
  title: 'Car Rental India | Self Drive & Chauffeur-Driven | Starting ₹999/Day | TransRentals',
  description: 'Rent cars across India at the best prices. Self-drive cars, chauffeur-driven sedans, SUVs, and hatchbacks available in 250+ cities. Verified vendors, instant booking.',
  keywords: ['car rental', 'car on rent', 'self drive car', 'car hire India', 'rent a car', 'car booking', 'car rental near me', 'outstation cab', 'chauffeur driven car'],
  alternates: {
    canonical: 'https://transrentals.in/car-rental',
  },
  openGraph: {
    title: 'Car Rental India | Self Drive & Chauffeur-Driven | Starting ₹999/Day | TransRentals',
    description: 'Book self-drive cars and cars with drivers across 250+ Indian cities. Verified vendors, best prices, instant booking.',
    type: 'website',
    url: 'https://transrentals.in/car-rental',
    images: [{ url: 'https://transrentals.in/images/og/car-rental.jpg', width: 1200, height: 630, alt: 'Car Rental India - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Car Rental India | Starting ₹999/Day | TransRentals',
    description: 'Book self-drive cars and cars with drivers across 250+ Indian cities. Verified vendors, best prices.',
    images: ['https://transrentals.in/images/og/car-rental.jpg'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export default function CarRentalPage() {
  return (
    <>
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://transrentals.in' },
        { name: 'Car Rental India', url: 'https://transrentals.in/car-rental' },
      ]} />
      <HowToSchema
        name="How to Rent a Car in India on TransRentals"
        description="Book a self-drive or chauffeur-driven car in 4 easy steps across 250+ cities."
        totalTime="PT10M"
        steps={[
          { name: 'Choose Trip Type', text: 'Select self-drive or chauffeur-driven. Pick your trip type: local, outstation, or airport transfer.' },
          { name: 'Select City & Dates', text: 'Choose pickup city from 250+ locations. Set pickup date, time, and drop-off details.' },
          { name: 'Pick Your Car', text: 'Browse hatchbacks, sedans, SUVs from verified vendors. Compare prices and features.' },
          { name: 'Confirm & Ride', text: 'Complete booking online. For self-drive: bring your valid DL and ID. For chauffeur: just show up and go.' },
        ]}
      />
      <FAQSchema faqs={CAR_RENTAL_FAQS.map(f => ({ question: f.q, answer: f.a }))} />
      {/* Service Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Car Rental India',
            description: 'Rent cars across India at the best prices. Self-drive cars, chauffeur-driven sedans, SUVs, and hatchbacks available in 250+ cities.',
            url: 'https://transrentals.in/car-rental',
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            areaServed: { '@type': 'Country', name: 'India' },
            serviceType: 'Car Rental',
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: '999',
              highPrice: '9999',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              reviewCount: '10000',
              bestRating: '5',
            },
          }),
        }}
      />

      {/* Hero Section */}
      <SimpleServiceHero
        badge="Car Rental Services"
        title="Car Rental"
        titleHighlight="Self Drive & Chauffeur-Driven"
        description="Rent cars with driver or self-drive across 250+ cities. Roundtrip, one-way, airport transfers. Choose from hatchbacks, sedans, and SUVs!"
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Verified Drivers', color: 'text-blue-600' },
          { icon: 'zap', text: 'Instant Booking', color: 'text-green-600' },
        ]}
        gradientFrom="blue-50"
        gradientTo="indigo-50"
      />

      {/* Fleet Display from Database */}
      <ServiceFleetDisplay
        serviceSlug="car-rental"
        title="Types of Cars Available"
        showCategories={true}
        limit={12}
        priceUnit="/day"
      />

      {/* Locations from Database */}
      <ServiceLocationsGrid
        serviceSlug="car-rental"
        title="Car Rental in Popular Cities"
        startingPrice="₹999"
        priceUnit="/day"
      />

      {/* Specialized Car Services */}
      <CarSubServicesGrid />

      {/* FAQ Section */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Car Rental FAQs</h2>
            <p className="text-gray-600">Common questions about renting a car in India</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {CAR_RENTAL_FAQS.map((faq, idx) => (
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
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">Car Rental by City</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/car-rental/${city.slug}`}
                className="text-center py-2.5 px-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition text-sm font-medium text-gray-700 hover:text-blue-700"
              >
                {city.name}
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <Link href="/self-drive-car-rentals" className="text-blue-600 hover:underline">Self Drive Car Rentals</Link>
              <span className="text-gray-300">|</span>
              <Link href="/outstation-cab" className="text-blue-600 hover:underline">Outstation Cabs</Link>
              <span className="text-gray-300">|</span>
              <Link href="/airport-transfer" className="text-blue-600 hover:underline">Airport Transfers</Link>
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
            mainEntity: CAR_RENTAL_FAQS.map((faq) => ({
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
