import { Metadata } from 'next';
import Link from 'next/link';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Swift on Rent Without Driver | Self Drive @₹899/Day',
  description: formatPriceHighlight('Rent Maruti Swift without driver across India. Self-drive Swift rental for city commute & short trips. Most popular hatchback with great mileage. Book now!'),
  keywords: [
    'swift on rent',
    'maruti swift on rent',
    'swift self drive',
    'rent swift without driver',
    'swift rental near me',
    'swift car rental',
  ],
  openGraph: {
    title: formatPriceHighlight('Swift on Rent Without Driver @₹899/Day | TransRentals'),
    description: formatPriceHighlight('Self-drive Maruti Swift rental. Most popular hatchback for city commute.'),
    type: 'website',
    url: 'https://transrentals.in/swift-on-rent',
  },
  alternates: {
    canonical: 'https://transrentals.in/swift-on-rent',
  },
};

const topCities = ALL_CITIES.slice(0, 60);

const FAQS = [
  { question: 'What documents are required to rent a Swift without a driver?', answer: 'You need a valid driving licence (held for at least 1 year) plus Aadhaar or PAN for KYC. Upload documents online and get instant approval to book the Maruti Swift self-drive.' },
  { question: 'What is the security deposit for self-drive Swift rental?', answer: 'A refundable security deposit (typically ₹3,000–₹5,000 depending on city and vendor) is collected at pickup and refunded after the post-rental vehicle inspection.' },
  { question: 'Is there a km limit on the ₹899/day Swift rental?', answer: 'Daily Swift plans usually include a free km limit (around 100–120 km/day), with extra km billed per km beyond that. Weekly packages often offer a higher combined km allowance.' },
  { question: 'Can I choose between manual and automatic (AMT) Swift?', answer: 'Yes, both Swift manual and Swift AMT are available on rent. The manual variant starts at the base ₹899/day rate; AMT is offered at a slightly higher daily rate depending on the city.' },
  { question: 'What is the minimum age and driving experience needed to rent a Swift?', answer: 'You must be at least 21 years old with a valid driving licence held for a minimum of 1 year to self-drive the Swift.' },
];

export default function SwiftOnRentPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Maruti Swift on TransRentals"
        description="Book Swift self-drive rental in 4 simple steps."
        totalTime="PT7M"
        steps={[
          { name: 'Choose City & Dates', text: 'Select your city and rental period. Swift available for 1 day, weekend, or weekly self-drive packages.' },
          { name: 'Confirm Swift Variant', text: 'Choose Swift petrol or diesel. Check if automatic transmission is required for city driving.' },
          { name: 'KYC & Payment', text: 'Upload DL and Aadhaar/PAN online. Pay security deposit to instantly confirm your Swift booking.' },
          { name: 'Pick Up & Drive', text: 'Collect Swift keys at vendor or request home delivery. Do pre-rental inspection and start your trip.' },
        ]}
      />
      <SwiftRentalTypeHero
        vehicleName="Maruti Swift"
        selfDrivePrice="₹899"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-red-600 to-orange-700 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Maruti Swift on Rent Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Swift LXi • Swift VXi • Swift ZXi • Swift AMT • Swift CNG
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Swift */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent a Maruti Swift?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏎️', title: 'Sporty Design', desc: 'Head-turning looks & style' },
              { icon: '⛽', title: '22 km/l Mileage', desc: 'Best in class fuel efficiency' },
              { icon: '🔧', title: 'Low Maintenance', desc: 'Maruti reliability & service' },
              { icon: '🅿️', title: 'Easy Parking', desc: 'Compact size, perfect for city' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Swift on Rent Across India
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/swift-on-rent/${city.slug}`}
                className="p-3 bg-white rounded-lg text-center hover:bg-red-50 hover:border-red-300 border border-gray-200 transition"
              >
                <span className="font-medium text-gray-800">{city.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FAQSection service="self-drive-car-rental" customFaqs={FAQS} />

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
    </>
  );
}
