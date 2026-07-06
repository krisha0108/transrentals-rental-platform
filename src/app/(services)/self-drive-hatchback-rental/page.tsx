import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: formatPriceHighlight('Self Drive Hatchback Rental India | Rent Hatchback @₹899/Day | TransRentals'),
  description: formatPriceHighlight('Rent hatchback without driver across India. Swift, i20, Baleno, Tiago available. Self-drive hatchback rental for city commute. Most affordable option.'),
  keywords: [
    'self drive hatchback rental',
    'hatchback on rent without driver',
    'rent hatchback india',
    'swift on rent',
    'i20 self drive',
    'baleno rental',
  ],
  openGraph: {
    title: formatPriceHighlight('Self Drive Hatchback Rental India @₹899/Day | TransRentals'),
    description: formatPriceHighlight('Rent hatchbacks without driver. Swift, i20, Baleno available.'),
    type: 'website',
    url: 'https://transrentals.in/self-drive-hatchback-rental',
  },
  alternates: {
    canonical: 'https://transrentals.in/self-drive-hatchback-rental',
  },
};

const topCities = ALL_CITIES.slice(0, 12);

const FAQS = [
  { question: 'What is the rental price of a self-drive hatchback?', answer: 'Self-drive hatchback rental starts from ₹899/day, making it the most affordable self-drive category on TransRentals. Popular models include Maruti Swift, Hyundai i20, Tata Tiago, Baleno, Wagon R, and Grand i10.' },
  { question: 'How much mileage do self-drive hatchbacks give?', answer: 'Hatchbacks typically deliver 18-22 km/l fuel efficiency, making them the most economical choice for city commutes and short trips where you are paying for your own fuel.' },
  { question: 'What documents and deposit are needed to rent a hatchback without a driver?', answer: 'A valid driving licence and a government ID are required for KYC verification. The security deposit for hatchbacks is lower than for sedans or SUVs, reflecting the lower vehicle value and rental price.' },
  { question: 'Is a hatchback rental suitable for new or inexperienced drivers?', answer: 'Yes, hatchbacks are the easiest cars to drive and park due to their compact size, making them a popular choice for new drivers, students, and anyone not confident driving larger vehicles.' },
  { question: 'Can I rent a hatchback for a week or a month instead of daily?', answer: 'Yes, hatchbacks are available for 1-day, weekly, and monthly rentals, with discounted per-day rates on longer bookings compared to the standard ₹899/day daily rate.' },
];

export default function SelfDriveHatchbackRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Self-Drive Hatchback on TransRentals"
        description="Book a hatchback without driver in 4 simple steps."
        totalTime="PT8M"
        steps={[
          { name: 'Select City & Rental Period', text: 'Choose city, pickup date, and return date. Hatchbacks available for 1-day to monthly rentals.' },
          { name: 'Pick a Hatchback Model', text: 'Choose from Maruti Swift, Hyundai i20, Tata Tiago, or Baleno. Check fuel type and AC availability.' },
          { name: 'Complete KYC Verification', text: 'Submit driving licence and government ID online. Pay refundable security deposit to confirm booking.' },
          { name: 'Pick Up & Drive', text: 'Collect key at vendor location or opt for home delivery (select cities). Inspect car and start driving.' },
        ]}
      />
      <ServiceHeroWithChat
        badge="Self Drive Hatchback Rental"
        title="Rent Hatchback Without Driver"
        titleHighlight="Starting @₹899/Day"
        description="Most affordable self-drive option. Perfect for city commute, short trips, and budget-conscious travelers. Easy to drive and park."
        features={[
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Best Mileage', color: 'text-green-600' },
        ]}
        gradientFrom="green-50"
        gradientTo="blue-50"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-green-700 to-blue-800 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Self Drive Hatchback Rental Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Swift • i20 • Baleno • Tiago • Wagon R • Grand i10
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#hatchbacks" className="bg-white text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                View Hatchback Models
              </a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-700 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Hatchback */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent a Hatchback?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '💰', title: 'Most Affordable', desc: 'Lowest rental rates' },
              { icon: '⛽', title: 'Best Mileage', desc: '18-22 km/l efficiency' },
              { icon: '🅿️', title: 'Easy Parking', desc: 'Compact size, fits anywhere' },
              { icon: '🏙️', title: 'City Perfect', desc: 'Ideal for traffic & narrow roads' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hatchback Models */}
      {/* Cities */}
      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Self Drive Hatchback Rental in 200+ Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/self-drive-hatchback-rental/${city.slug}`}
                className="p-3 bg-gray-50 rounded-lg text-center hover:bg-green-50 hover:border-green-300 border border-gray-200 transition"
              >
                <span className="font-medium text-gray-800">{city.name}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <p className="text-gray-600">+ 190 more cities available</p>
          </div>
        </div>
      </section>

      {/* Perfect For */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Perfect For
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏢', title: 'Daily Commute', desc: 'Office travel, errands' },
              { icon: '🎓', title: 'Students', desc: 'Budget-friendly option' },
              { icon: '🚗', title: 'New Drivers', desc: 'Easy to handle & park' },
              { icon: '🏖️', title: 'Weekend Trips', desc: 'Short getaways' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-lg text-center shadow-md">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
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
