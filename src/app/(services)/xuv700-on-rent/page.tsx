import { Metadata } from 'next';
import Link from 'next/link';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: formatPriceHighlight('XUV700 on Rent Without Driver | Self Drive @₹2999/Day | TransRentals'),
  description: 'Rent Mahindra XUV700 without driver across India. Self-drive XUV700 with ADAS, panoramic sunroof. 5 & 7 seater options. Book now!',
  keywords: ['xuv700 on rent', 'mahindra xuv700 on rent', 'xuv700 self drive', 'rent xuv700 without driver'],
  openGraph: { title: formatPriceHighlight('XUV700 on Rent Without Driver @₹2999/Day | TransRentals'), url: 'https://transrentals.in/xuv700-on-rent' },
  alternates: { canonical: 'https://transrentals.in/xuv700-on-rent' },
};

const topCities = ALL_CITIES.slice(0, 12);

const FAQS = [
  { question: 'What is the rental price of a self-drive Mahindra XUV700?', answer: 'Self-drive Mahindra XUV700 rental starts from ₹2999/day across MX, AX5, AX7, and AX7 L variants. Being a premium SUV, pricing is higher than compact SUVs like the Creta or Seltos.' },
  { question: 'Can I choose between a 5-seater and 7-seater XUV700?', answer: 'Yes, the XUV700 is available in both 5-seater and 7-seater configurations. Select your preferred layout while booking based on your group size and luggage needs.' },
  { question: 'Is the security deposit higher for the XUV700 compared to other SUVs?', answer: 'Yes, being a premium SUV category vehicle, the XUV700 requires a higher refundable security deposit than compact SUVs, reflecting its higher value and ADAS-equipped features.' },
  { question: 'What safety and comfort features come with the XUV700 rental?', answer: 'The self-drive XUV700 includes Level 2 ADAS safety features, a panoramic sunroof, a Sony 3D sound system with 12 speakers, and a 5-star GNCAP safety rating, making it one of the safest SUVs to self-drive.' },
  { question: 'What documents do I need to rent an XUV700 without a driver?', answer: 'You need to upload a valid driving licence, Aadhaar, and PAN for KYC verification. Given the premium security deposit involved, document verification for the XUV700 is thorough before booking confirmation.' },
];

export default function XUV700OnRentPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Mahindra XUV700 on TransRentals"
        description="Book XUV700 self-drive rental in 4 simple steps."
        totalTime="PT8M"
        steps={[
          { name: 'Select City & Duration', text: 'Choose pickup city and rental dates. XUV700 available for day, weekend, and extended trips.' },
          { name: 'Choose XUV700 Configuration', text: 'Select 5-seater or 7-seater XUV700. Check ADAS features and panoramic sunroof availability.' },
          { name: 'Complete KYC', text: 'Upload DL, Aadhaar, and PAN. Pay premium security deposit for luxury SUV category. Instant confirmation.' },
          { name: 'Collect & Drive', text: 'Pick up XUV700 at vendor location. Enjoy the ADAS-equipped premium SUV experience.' },
        ]}
      />
      <SwiftRentalTypeHero vehicleName="Mahindra XUV700" selfDrivePrice="₹2999" />

      <section className="relative bg-gradient-to-br from-red-700 to-rose-800 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Mahindra XUV700 on Rent</h1>
            <p className="text-xl opacity-90 mb-8">MX • AX5 • AX7 • AX7 L Variants</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-red-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Variants</a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-700 transition">Find Near You</a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Rent XUV700?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🛡️', title: 'ADAS Safety', desc: 'Level 2 autonomous features' },
              { icon: '☀️', title: 'Panoramic Sunroof', desc: 'Largest in segment' },
              { icon: '🔊', title: 'Sony 3D Sound', desc: '12-speaker system' },
              { icon: '⭐', title: '5-Star GNCAP', desc: 'Safest Indian SUV' },
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">XUV700 on Rent in 200+ Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/xuv700-on-rent/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-red-50 border border-gray-200 transition">
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
