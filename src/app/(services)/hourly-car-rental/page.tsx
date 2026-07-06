import { Metadata } from 'next';
import Link from 'next/link';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { HourlyPopularPackages } from '@/components/hourly-car-rental/HourlyPopularPackages';
import { HourlyBookingHeroAuto } from '@/components/hourly-car-rental/HourlyBookingHeroAuto';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Hourly Car Rental | Rent Car by Hour @₹149/hr | TransRentals',
  description: 'Rent a car by the hour for meetings, errands, shopping. Self-drive hourly rental from ₹149/hr. Flexible 2-8 hour packages. Book now!',
  keywords: ['hourly car rental', 'rent car by hour', 'car rental per hour', 'short term car rental', 'car hire hourly'],
  openGraph: {
    title: 'Hourly Car Rental @₹149/hr | TransRentals',
    description: 'Rent a car by the hour. Flexible packages for short trips.',
    url: 'https://transrentals.in/hourly-car-rental',
  },
  alternates: { canonical: 'https://transrentals.in/hourly-car-rental' },
};

const topCities = ALL_CITIES.slice(0, 12);

const FAQS = [
  { question: 'What is the price of hourly car rental?', answer: 'Hourly self-drive car rental starts at ₹149/hr, with flexible 2, 4, and 8-hour packages that include a preset km limit. Exact pricing depends on your city and car type — hatchback, sedan, or SUV.' },
  { question: 'Is fuel included in the hourly rental price?', answer: 'Yes, fuel costs are included in the hourly package price — there are no separate fuel charges to pay on top of your booking.' },
  { question: 'What do I need to rent a self-drive car by the hour?', answer: 'You need a valid driving license and to complete quick online KYC verification. Once verified, you can book instantly and drive yourself — no separate driver required.' },
  { question: "What happens if I don't return the car within my booked hours?", answer: 'You can return anytime within your booked package (2, 4, or 8 hours). Extending the booking is possible if needed, but time used beyond the package is charged extra, so plan your hours accordingly.' },
  { question: 'Do I need to pick up the car myself, or is delivery available?', answer: "Both options are available — you can pick up the car at the vendor's location or opt for home delivery in select cities, based on your convenience." },
];

export default function HourlyCarRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Book Hourly Car Rental on TransRentals"
        description="Rent a car by the hour in 4 simple steps."
        totalTime="PT5M"
        steps={[
          { name: 'Choose City & Package', text: 'Select your city and hourly package — 2 hours, 4 hours, or 8 hours with included km limit.' },
          { name: 'Pick Car Type', text: 'Choose from hatchback, sedan, or SUV for your short-trip needs. All self-drive options available.' },
          { name: 'Verify & Book', text: 'Upload DL and complete KYC. Pay only for the hours needed. Instant booking confirmation.' },
          { name: 'Drive & Return', text: 'Pick up at vendor location or home delivery. Return car within the booked time to avoid extra charges.' },
        ]}
      />
      <HourlyBookingHeroAuto />

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Hourly Rental?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '⏰', title: 'Pay Per Hour', desc: 'No full-day charges' },
              { icon: '🚗', title: 'Self Drive', desc: 'Drive yourself, no driver' },
              { icon: '⛽', title: 'Fuel Included', desc: 'No extra fuel costs' },
              { icon: '📱', title: 'Quick Booking', desc: 'Book in 2 minutes' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-cyan-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HourlyPopularPackages />

      <section className="py-12 bg-cyan-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Perfect For</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '💼', title: 'Business Meetings', desc: 'Quick client visits' },
              { icon: '🛒', title: 'Shopping Trips', desc: 'Mall runs & errands' },
              { icon: '🏥', title: 'Hospital Visits', desc: 'Medical appointments' },
              { icon: '✈️', title: 'Airport Runs', desc: 'Drop & pick' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-lg text-center shadow-sm">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Hourly Car Rental in 200+ Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/hourly-car-rental/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-cyan-50 border border-gray-200 transition">
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
