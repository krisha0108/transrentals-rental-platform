import { Metadata } from 'next';
import Link from 'next/link';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: formatPriceHighlight('Self Drive Sedan Rental India | Rent Sedan Without Driver @₹1299/Day | TransRentals'),
  description: formatPriceHighlight('Rent sedan without driver across India. Honda City, Hyundai Verna, Maruti Ciaz, Skoda Slavia available. Self-drive sedan rental for business & leisure.'),
  keywords: [
    'self drive sedan rental',
    'sedan on rent without driver',
    'rent sedan india',
    'honda city on rent',
    'verna self drive',
    'sedan rental for outstation',
  ],
  openGraph: {
    title: formatPriceHighlight('Self Drive Sedan Rental India @₹1299/Day | TransRentals'),
    description: formatPriceHighlight('Rent sedans without driver. City, Verna, Ciaz available.'),
    type: 'website',
    url: 'https://transrentals.in/self-drive-sedan-rental',
  },
  alternates: {
    canonical: 'https://transrentals.in/self-drive-sedan-rental',
  },
};

const topCities = ALL_CITIES.slice(0, 60);

const FAQS = [
  { question: 'Which sedan models are available for self-drive rental?', answer: 'You can choose from Honda City, Hyundai Verna, Maruti Ciaz, Maruti Dzire, Skoda Slavia, and Honda Amaze, with self-drive rentals starting from ₹1,299/day.' },
  { question: 'What documents are needed to rent a sedan without a driver?', answer: 'A valid driving licence and Aadhaar or PAN card are required for online KYC verification before the sedan booking is confirmed.' },
  { question: 'Is automatic transmission available in self-drive sedans?', answer: 'Yes, automatic variants of models like the Honda City, Hyundai Verna, and Skoda Slavia are available on rent in select cities, alongside manual options.' },
  { question: 'What is the fuel efficiency of the rental sedans?', answer: 'Most sedans in our fleet deliver 15-20+ km/l mileage, making them an economical choice for both city commutes and long highway drives.' },
  { question: 'Are self-drive sedans suitable for outstation highway trips?', answer: 'Yes, sedans offer a comfortable, highway-ready ride with a smooth suspension and good cabin space, making them ideal for business travel and outstation trips.' },
];

export default function SelfDriveSedanRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Self-Drive Sedan on TransRentals"
        description="Rent a sedan without driver for business or leisure travel in 4 steps."
        totalTime="PT8M"
        steps={[
          { name: 'Choose City & Dates', text: 'Select pickup city, rental start and end dates. Compare daily vs weekly sedan rates.' },
          { name: 'Select Sedan Model', text: 'Choose from Honda City, Hyundai Verna, Maruti Ciaz, or Skoda Slavia. Automatic or manual available.' },
          { name: 'Verify & Pay Deposit', text: 'Upload driving licence and Aadhaar. Pay security deposit online to confirm reservation.' },
          { name: 'Collect & Drive', text: 'Pick up sedan from vendor showroom or opt for doorstep delivery. Do walk-around inspection before driving.' },
        ]}
      />
      <SwiftRentalTypeHero
        vehicleName="Self Drive Sedan"
        selfDrivePrice="₹1,299"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-800 to-blue-900 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Self Drive Sedan Rental Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              City • Verna • Ciaz • Dzire • Slavia • Amaze
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-800 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Sedan */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent a Sedan?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '💼', title: 'Business Ready', desc: 'Professional appearance' },
              { icon: '⛽', title: 'Fuel Efficient', desc: '15-20+ km/l mileage' },
              { icon: '🛋️', title: 'Comfortable', desc: 'Plush seating, smooth ride' },
              { icon: '🛣️', title: 'Highway Ready', desc: 'Perfect for long drives' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sedan Models */}
      {/* Cities */}
      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Self Drive Sedan Rental Across India
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/self-drive-sedan-rental/${city.slug}`}
                className="p-3 bg-gray-50 rounded-lg text-center hover:bg-blue-50 hover:border-blue-300 border border-gray-200 transition"
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
