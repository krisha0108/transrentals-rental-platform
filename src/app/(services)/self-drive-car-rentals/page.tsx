import { Metadata } from 'next';
import { CarSearchHero } from '@/components/car';
import { ServiceLocationsGrid } from '@/components/services/ServiceLocationsGrid';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Self Drive Car Rental - Rent Cars @₹899/Day',
  description: 'Self-drive car rentals across India. No driver needed. Drive yourself. Hatchbacks, sedans, SUVs available. Book online instantly. 24/7 support.',
  keywords: ['self drive car rental', 'self drive cars', 'car rental without driver', 'self drive car hire', 'drive yourself car rental', 'car rental no driver'],
  openGraph: {
    title: 'Self Drive Car Rental India - Starting @₹899/Day | TransRentals',
    description: 'Rent self-drive cars across 250+ Indian cities. No driver needed. Freedom to drive yourself. Book online.',
    type: 'website',
    url: 'https://transrentals.in/self-drive-car-rentals',
    images: [{ url: 'https://transrentals.in/images/og/self-drive.jpg', width: 1200, height: 630, alt: 'Self Drive Car Rental - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Self Drive Car Rental India - Starting @₹899/Day | TransRentals',
    description: 'Rent self-drive cars across 250+ Indian cities. No driver needed. Freedom to drive yourself.',
    images: ['https://transrentals.in/images/og/self-drive.jpg'],
  },
  alternates: { canonical: 'https://transrentals.in/self-drive-car-rentals' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export default function SelfDriveCarRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Book a Self-Drive Car Rental on TransRentals"
        description="Rent a car without a driver in 4 simple steps. Drive yourself."
        totalTime="PT10M"
        steps={[
          { name: 'Choose City & Dates', text: 'Select city, pickup date, return date, and preferred pickup location (home delivery or vendor pickup).' },
          { name: 'Pick a Car', text: 'Choose from hatchback, sedan, SUV, or luxury car. View fuel type — petrol, diesel, or CNG.' },
          { name: 'Complete KYC', text: 'Upload driving licence, Aadhaar/PAN, and selfie. Pay refundable security deposit online.' },
          { name: 'Pick Up & Drive', text: 'Collect car from vendor at the scheduled time. Do pre-rental inspection and start your trip.' },
        ]}
      />
      {/* Hero Section */}
      <CarSearchHero
        city=""
        citySlug=""
        citySelectable
        pageDescription="Rent self-drive cars across 250+ cities. No driver needed — complete freedom. Hatchbacks, Sedans, SUVs available!"
      />

      {/* Fleet Display from Database */}
      <ServiceFleetDisplay
        serviceSlug="self-drive-car-rentals"
        title="Self Drive Cars Available"
        showCategories={true}
        limit={12}
        priceUnit="/day"
      />

      {/* Locations from Database */}
      <ServiceLocationsGrid
        serviceSlug="self-drive-car-rentals"
        title="Self Drive Cars in Popular Cities"
        startingPrice="₹899"
        priceUnit="/day"
      />

      {/* Why Self Drive */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Self-Drive Car Rental?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '🔐', title: 'Privacy', desc: 'Drive alone or with family, no third person' },
              { icon: '⏰', title: 'Flexibility', desc: 'Your schedule, your route, your stops' },
              { icon: '💰', title: 'Cost Effective', desc: 'No driver charges, save money' },
              { icon: '🗺️', title: 'Freedom', desc: 'Explore at your own pace' },
              { icon: '🚗', title: 'Wide Selection', desc: 'Hatchbacks to SUVs available' },
              { icon: '📱', title: 'Easy Booking', desc: 'Book online in 2 minutes' },
              { icon: '🔧', title: 'Well Maintained', desc: 'All cars regularly serviced' },
              { icon: '🆘', title: '24/7 Support', desc: 'Round the clock assistance' },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Self Drive Car Rental Works
          </h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Choose Your Car', desc: 'Select from our wide range of self-drive cars based on your needs and budget' },
              { step: '2', title: 'Book Online', desc: 'Book instantly on our website or app. Provide basic details and documents' },
              { step: '3', title: 'Pick Up Car', desc: 'Pick up the car from our location or get it delivered to your doorstep' },
              { step: '4', title: 'Drive & Enjoy', desc: 'Drive wherever you want, whenever you want. Complete freedom and privacy' },
              { step: '5', title: 'Return Car', desc: 'Return the car at the end of your rental period. Simple and hassle-free' },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 bg-white p-6 rounded-lg shadow-md">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Requirements for Self Drive Car Rental
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4">Documents Required</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Valid Driving License (minimum 1 year old)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Aadhar Card / PAN Card (ID proof)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Address Proof (Aadhar/Utility Bill)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Refundable Security Deposit</span>
                </li>
              </ul>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4">Age & Experience</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Minimum age: 21 years</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Driving license: Minimum 1 year old</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Clean driving record preferred</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>For luxury cars: 3+ years experience</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'What is self-drive car rental?',
                a: 'Self-drive car rental means you rent a car and drive it yourself without a driver. You have complete control and privacy during your trip.',
              },
              {
                q: 'How much does self-drive car rental cost?',
                a: 'Self-drive car rental starts from ₹899/day for hatchbacks. Sedans cost around ₹1299/day and SUVs from ₹2199/day. Long-term rentals get additional discounts.',
              },
              {
                q: 'Do I need a driving license?',
                a: 'Yes, a valid driving license (minimum 1 year old) is mandatory for self-drive car rentals. International license holders can also rent with valid documents.',
              },
              {
                q: 'Is fuel included in the rental price?',
                a: 'No, fuel is not included. The car will be provided with some fuel, and you need to refill and return with the same fuel level.',
              },
              {
                q: 'What is the security deposit?',
                a: 'Security deposit ranges from ₹3,000 to ₹15,000 depending on the car type. It is fully refundable if there is no damage to the vehicle.',
              },
              {
                q: 'Can I take the self-drive car outside the city?',
                a: 'Yes, you can take self-drive cars for outstation trips. Additional charges may apply for inter-state travel.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
