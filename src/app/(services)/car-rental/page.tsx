import { Metadata } from 'next';
import Link from 'next/link';
import { CarSubServicesGrid } from '@/components/services/CarSubServicesGrid';
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';
import { CarRentalPopularCitiesGrid } from '@/components/car-rental/CarRentalPopularCitiesGrid';
import { HowToSchema, FAQSchema, BreadcrumbSchema, ItemListSchema } from '@/components/seo/schemas';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';
import { FAQSection } from '@/components/services/FAQSection';
import { ArrowRight, MapPin, Key, Navigation, Plane } from 'lucide-react';

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
      <ItemListSchema
        name="Car Rental in Top Cities - TransRentals"
        description="Rent cars in top Indian cities — self-drive and chauffeur-driven available."
        url="https://transrentals.in/car-rental"
        items={TOP_CITIES.map(city => ({
          name: `Car Rental in ${city.name}`,
          url: `https://transrentals.in/car-rental/${city.slug}`,
          description: `Book self-drive and chauffeur-driven cars in ${city.name} starting ₹999/day.`,
        }))}
      />
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
              lowPrice: 999,
              highPrice: 9999,
              offerCount: 50,
            },
          }),
        }}
      />

      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Car Rental</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <CarRentalBookingHero
        city=""
        citySlug=""
        serviceSlug="car-rental"
        serviceTitle="Car Rental"
        headingLine1="Drive Your Way,"
        headingLine2="Across India"
        subheading="Rent cars with driver or self-drive across 250+ cities. Roundtrip, one-way, airport transfers."
        heroVariant="aurora"
        heroImage="/images/sections/car-rental-hero-bg.png"
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
      <CarRentalPopularCitiesGrid
        serviceSlug="car-rental"
        title="Car Rental in Popular Cities"
        startingPrice="₹999"
        priceUnit="/day"
      />

      {/* Specialized Car Services */}
      <CarSubServicesGrid />

      {/* FAQ Section */}
      <FAQSection
        service="car-rental"
        customFaqs={CAR_RENTAL_FAQS.map((f) => ({ question: f.q, answer: f.a }))}
      />

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
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Car Rental by City</h2>
            <p className="text-gray-500">Jump straight to a city&apos;s dedicated page</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-5xl mx-auto mb-8">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/car-rental/${city.slug}`}
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
              { href: '/self-drive-car-rentals', label: 'Self Drive Car Rentals', icon: Key },
              { href: '/outstation-cab', label: 'Outstation Cabs', icon: Navigation },
              { href: '/airport-transfer', label: 'Airport Transfers', icon: Plane },
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
