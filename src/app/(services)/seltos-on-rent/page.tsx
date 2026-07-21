import { Metadata } from 'next';
import Link from 'next/link';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Seltos on Rent Without Driver | Self Drive @₹1899/Day',
  description: formatPriceHighlight('Rent Kia Seltos without driver across India. Self-drive Seltos rental for family trips & outstation. HTK, HTX, GTX variants. Book now!'),
  keywords: ['seltos on rent', 'kia seltos on rent', 'seltos self drive', 'rent seltos without driver'],
  openGraph: {
    title: formatPriceHighlight('Seltos on Rent Without Driver @₹1899/Day | TransRentals'),
    url: 'https://transrentals.in/seltos-on-rent',
  },
  alternates: { canonical: 'https://transrentals.in/seltos-on-rent' },
};

const topCities = ALL_CITIES.slice(0, 12);

const FAQS = [
  { question: 'What is the rental price of a self-drive Kia Seltos?', answer: 'Self-drive Kia Seltos rental starts from ₹1899/day across HTK, HTX, HTX+, GTX and GTX+ variants. Petrol, diesel, and automatic transmission variants may be priced slightly higher depending on city and availability.' },
  { question: 'What documents are required to rent a Seltos without a driver?', answer: 'You need a valid driving licence (held for at least 1 year) and a government ID proof such as Aadhaar. Both are uploaded online during KYC, and your booking is confirmed instantly after verification.' },
  { question: 'Is a security deposit required for the Seltos self-drive rental?', answer: 'Yes, a refundable security deposit is collected online at the time of booking. The amount depends on the variant chosen — GTX and GTX+ (top variants) attract a slightly higher deposit than HTK/HTX due to their higher value.' },
  { question: 'Are fuel and kilometers included in the Seltos rental?', answer: 'Daily Seltos bookings include a fixed free-km allowance, with extra distance billed per km. Fuel is not included — the car should be returned with the same fuel level as at pickup to avoid refueling charges.' },
  { question: 'Can the Seltos be delivered to my home instead of pickup from a vendor?', answer: 'Yes, home delivery of the Kia Seltos is available in select cities for an additional fee. In other cities, you can collect the car directly from the nearest TransRentals vendor location.' },
];

export default function SeltosOnRentPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Kia Seltos on TransRentals"
        description="Book Seltos self-drive rental in 4 simple steps."
        totalTime="PT8M"
        steps={[
          { name: 'Enter City & Rental Period', text: 'Select your city and rental dates. Kia Seltos available for day trips, weekends, and weekly rentals.' },
          { name: 'Choose Seltos Variant', text: 'Pick from HTK, HTX, or GTX variants. Check petrol vs diesel fuel type and automatic transmission.' },
          { name: 'Submit KYC & Deposit', text: 'Upload driving licence and Aadhaar. Pay security deposit online. Instant booking confirmation.' },
          { name: 'Collect & Drive', text: 'Pick up Seltos at vendor location or home delivery available. Enjoy the premium SUV experience.' },
        ]}
      />
      <SwiftRentalTypeHero vehicleName="Kia Seltos" selfDrivePrice="₹1899" />

      <section className="relative bg-gradient-to-br from-red-600 to-orange-600 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Kia Seltos on Rent Across India</h1>
            <p className="text-xl opacity-90 mb-8">HTK • HTX • HTX+ • GTX • GTX+ Variants</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Variants & Prices</a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition">Find Near You</a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Rent a Kia Seltos?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '📱', title: 'Connected Car', desc: 'UVO connected features' },
              { icon: '☀️', title: 'Sunroof', desc: 'Panoramic sunroof option' },
              { icon: '🎵', title: 'Bose Audio', desc: '8-speaker premium sound' },
              { icon: '🛡️', title: '6 Airbags', desc: 'Top safety rating' },
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

      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Seltos on Rent in 200+ Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/seltos-on-rent/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-red-50 border border-gray-200 transition">
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
