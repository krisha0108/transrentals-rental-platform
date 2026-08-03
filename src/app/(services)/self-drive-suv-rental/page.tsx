import { Metadata } from 'next';
import Link from 'next/link';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Self Drive SUV Rental India | Starting from ₹1999/Day',
  description: formatPriceHighlight('Rent SUV without driver across India. Creta, Seltos, Scorpio, XUV700, Fortuner available. Self-drive SUV rental for road trips, family travel. Book online!'),
  keywords: [
    'self drive suv rental',
    'suv on rent without driver',
    'rent suv india',
    'self drive creta',
    'suv rental for road trip',
    'family suv rental',
  ],
  openGraph: {
    title: formatPriceHighlight('Self Drive SUV Rental India @₹1999/Day | TransRentals'),
    description: formatPriceHighlight('Rent SUVs without driver. Creta, Seltos, Scorpio, Fortuner available.'),
    type: 'website',
    url: 'https://transrentals.in/self-drive-suv-rental',
  },
  alternates: {
    canonical: 'https://transrentals.in/self-drive-suv-rental',
  },
};

const topCities = ALL_CITIES.slice(0, 60);

const FAQS = [
  { question: 'What is the rental price of a self-drive SUV?', answer: 'Self-drive SUV rental starts from ₹1,999/day. Popular models available include Hyundai Creta, Kia Seltos, Mahindra Scorpio, XUV700, and Toyota Fortuner, with pricing varying by model and city.' },
  { question: 'Which SUV should I choose for a hill station road trip?', answer: 'For hill stations like Manali, Ooty, or Munnar, SUVs like the Scorpio, XUV700, or Fortuner are recommended due to their higher ground clearance and power, though Creta and Seltos also handle hilly terrain well.' },
  { question: 'What documents are required to rent an SUV without a driver?', answer: 'A valid driving licence along with Aadhaar or PAN is required for KYC. Documents are verified online and the booking is confirmed instantly once the security deposit is paid.' },
  { question: 'How many people can travel in a self-drive SUV rental?', answer: 'Most SUVs on TransRentals offer 5-seater configurations (Creta, Seltos), while models like the XUV700 also offer a 7-seater option — ideal for larger families or group road trips.' },
  { question: 'Are weekly or monthly SUV rentals cheaper than daily bookings?', answer: 'Yes, weekly and monthly self-drive SUV rentals come at discounted per-day rates compared to the standard ₹1,999/day rate, making them more economical for extended trips.' },
];

export default function SelfDriveSUVRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Self-Drive SUV on TransRentals"
        description="Book an SUV without driver for road trips or family travel in 4 steps."
        totalTime="PT8M"
        steps={[
          { name: 'Enter City & Duration', text: 'Select your city, pickup date, and rental duration. Weekly and monthly SUV rentals available at discounts.' },
          { name: 'Choose SUV Model', text: 'Pick from Hyundai Creta, Kia Seltos, Mahindra Scorpio, XUV700, or Toyota Fortuner based on budget and terrain.' },
          { name: 'Complete Document Verification', text: 'Upload DL, Aadhaar/PAN. Pay security deposit. Booking confirmed instantly after verification.' },
          { name: 'Pick Up & Drive', text: 'Collect SUV at vendor or doorstep (select cities). Inspect the vehicle thoroughly before your road trip.' },
        ]}
      />
      <SwiftRentalTypeHero
        vehicleName="Self Drive SUV"
        selfDrivePrice="₹1,999"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-800 to-blue-900 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Self Drive SUV Rental Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Creta • Seltos • Scorpio • XUV700 • Fortuner • Harrier
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-slate-800 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why SUV */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent an SUV?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '👨‍👩‍👧‍👦', title: 'Family Friendly', desc: '5-7 seater options for families' },
              { icon: '🧳', title: 'Boot Space', desc: 'Large luggage capacity' },
              { icon: '🏔️', title: 'Road Trips', desc: 'Perfect for highways & hills' },
              { icon: '💪', title: 'Powerful', desc: 'Handle any terrain with ease' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUV Models */}
      {/* Cities */}
      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Self Drive SUV Rental Across India
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/self-drive-suv-rental/${city.slug}`}
                className="p-3 bg-gray-50 rounded-lg text-center hover:bg-blue-50 hover:border-blue-300 border border-gray-200 transition"
              >
                <span className="font-medium text-gray-800">{city.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Perfect For
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏖️', title: 'Family Vacations', desc: 'Goa, Kerala, Rajasthan trips' },
              { icon: '🏔️', title: 'Hill Station Trips', desc: 'Manali, Ooty, Munnar drives' },
              { icon: '💼', title: 'Business Travel', desc: 'Airport transfers, client visits' },
              { icon: '🎉', title: 'Weekend Getaways', desc: 'Nearby destinations, quick trips' },
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
