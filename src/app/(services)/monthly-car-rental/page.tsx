import { Metadata } from 'next';
import Link from 'next/link';
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { ServiceLocationsGrid } from '@/components/services/ServiceLocationsGrid';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: formatPriceHighlight('Monthly Car Rental | Car Subscription @₹12000/Month | Long Term Car Lease'),
  description: formatPriceHighlight('Rent car on monthly basis. Car subscription service. Long term car rental @₹12000/month. Self-drive & chauffeur options. All-inclusive package.'),
  keywords: [
    'monthly car rental',
    'car subscription',
    'monthly car lease',
    'long term car rental',
    'car on monthly rent',
    'car subscription india',
    'monthly car hire',
    'long term car lease',
    'car for month',
    'subscription car service',
    'monthly self drive',
    'car rental per month',
  ],
  openGraph: {
    title: formatPriceHighlight('Monthly Car Rental India | Car Subscription @₹12000/Month'),
    description: formatPriceHighlight('Subscribe to cars monthly. All-inclusive packages. Self-drive & chauffeur options available.'),
  },
};

export default function MonthlyCarRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Book Monthly Car Rental on TransRentals"
        description="Subscribe to a monthly car rental in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Choose Subscription Period', text: 'Select 1 month, 3 months, or 6 months. Longer subscriptions get better monthly rates.' },
          { name: 'Pick Car Category', text: 'Choose hatchback, sedan, or SUV. Select self-drive or chauffeur-driven based on your needs.' },
          { name: 'Complete KYC & Sign Agreement', text: 'Submit documents for KYC. Pay first month rent and security deposit. Sign monthly rental agreement.' },
          { name: 'Receive Car & Use', text: 'Car delivered to your location. Enjoy monthly subscription with zero maintenance hassle.' },
        ]}
      />
      {/* Hero with booking form */}
      <SpecialtyCarBookingHero service="monthly" />

      {/* Fleet Display from Database */}
      <ServiceFleetDisplay
        serviceSlug="monthly-car-rental"
        title="Monthly Car Subscription Plans"
        showCategories={true}
        limit={12}
        priceUnit="/month"
      />

      {/* Locations from Database */}
      <ServiceLocationsGrid
        serviceSlug="monthly-car-rental"
        title="Monthly Car Rental in Popular Cities"
        startingPrice="₹12,000"
        priceUnit="/month"
      />

      {/* Why Monthly Car Rental */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Monthly Car Rental?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '💰', title: 'Cost Effective', desc: 'Cheaper than daily rental' },
              { icon: '🔧', title: 'Zero Maintenance', desc: 'We handle everything' },
              { icon: '🛡️', title: 'Fully Insured', desc: 'Complete insurance coverage' },
              { icon: '🔄', title: 'Flexible Terms', desc: '1 month to 12+ months' },
              { icon: '🚗', title: 'Latest Models', desc: 'Well-maintained vehicles' },
              { icon: '📱', title: 'Easy Process', desc: 'Quick documentation' },
              { icon: '⛽', title: 'Fuel Included', desc: 'Optional fuel packages' },
              { icon: '🎯', title: 'No Commitment', desc: 'Cancel anytime' },
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

      {/* Perfect For */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Perfect for Every Need
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Job Transfer', icon: '💼', desc: 'Relocated for work' },
              { occasion: 'Long Vacation', icon: '🏖️', desc: 'Extended stay, tourism' },
              { occasion: 'Project Work', icon: '🏗️', desc: 'Temporary assignment' },
              { occasion: 'Students', icon: '🎓', desc: 'College semester' },
              { occasion: 'Try Before Buy', icon: '🔍', desc: 'Test drive for months' },
              { occasion: 'Own Car Repair', icon: '🔧', desc: 'Temporary replacement' },
              { occasion: 'Avoid Ownership', icon: '🚫', desc: 'No maintenance hassle' },
              { occasion: 'Business Use', icon: '💼', desc: 'Flexible business needs' },
            ].map((item) => (
              <div key={item.occasion} className="bg-gray-50 p-6 rounded-lg shadow-md text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{item.occasion}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Monthly Car Rental Works
          </h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Choose Car & Plan', desc: 'Select vehicle type and duration' },
              { step: '2', title: 'Submit Documents', desc: 'License, Aadhar, Address proof' },
              { step: '3', title: 'Pay Security Deposit', desc: 'Refundable deposit (varies by car)' },
              { step: '4', title: 'Vehicle Delivered', desc: 'Car delivered to your doorstep' },
              { step: '5', title: 'Use Monthly', desc: 'Drive within km limit for 30 days' },
              { step: '6', title: 'Renew or Return', desc: 'Extend subscription or return' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-white p-4 rounded-lg shadow-md">
                <div className="flex-shrink-0 w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'How much does monthly car rental cost?',
                a: 'Monthly car rental starts from ₹12,000/month for hatchback with 2000 km. Sedan costs ₹18,000-22,000, SUV ₹25,000-30,000. Chauffeur extra ₹15,000-20,000.',
              },
              {
                q: 'What is included in monthly rental?',
                a: 'Includes vehicle for 30 days, maintenance, insurance, roadside assistance, replacement car. Fuel NOT included - you pay for fuel.',
              },
              {
                q: 'What happens if I exceed km limit?',
                a: 'Extra km charges apply: ₹6-12 per km depending on car type. You can also upgrade to higher km package.',
              },
              {
                q: 'Can I extend my monthly rental?',
                a: 'Yes! You can extend month by month. Just renew before end date. Long term rentals (3+ months) get better rates.',
              },
              {
                q: 'What documents are needed?',
                a: 'You need valid driving license (minimum 1 year old), Aadhar card, address proof, PAN card, and refundable security deposit.',
              },
              {
                q: 'Is insurance included in monthly rental?',
                a: 'Yes, comprehensive insurance is included. In case of accident, standard deductible applies as per policy terms.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-lg shadow-md">
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
