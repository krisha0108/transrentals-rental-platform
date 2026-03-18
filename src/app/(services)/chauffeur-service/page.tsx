import { Metadata } from 'next';
import Link from 'next/link';
import { getCitiesByPriority } from '@/data/indian-cities';
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';

export const metadata: Metadata = {
  title: 'Chauffeur Service | Driver on Hire @₹599/Day | Professional Car Driver',
  description: 'Hire professional chauffeur for your car. Driver on hire for outstation, daily use. Experienced car drivers. Personal driver service @₹599/day.',
  keywords: [
    'chauffeur service',
    'driver on hire',
    'chauffeur booking',
    'professional driver',
    'car driver service',
    'personal driver',
    'driver for outstation',
    'car driver hire',
    'chauffeur for car',
    'driver booking',
    'temporary driver',
    'driver on rent',
  ],
  openGraph: {
    title: 'Chauffeur Service India | Driver on Hire @₹599/Day | TransRentals',
    description: 'Book professional chauffeur for your car. Experienced drivers for daily use, outstation trips, events.',
  },
};

export default function ChauffeurServicePage() {
  const popularCities = getCitiesByPriority(8);

  return (
    <>
      {/* Booking Hero - Same as Car Rental */}
      <CarRentalBookingHero
        city=""
        citySlug=""
        serviceSlug="car-rental"
        serviceTitle="Chauffeur Service"
      />

      {/* Why Chauffeur Service */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Our Chauffeur Service?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '✅', title: 'Verified Drivers', desc: 'Police verification done' },
              { icon: '🎓', title: 'Trained & Licensed', desc: 'Professional training' },
              { icon: '🌟', title: 'Experienced', desc: '5+ years experience' },
              { icon: '🚗', title: 'Know All Routes', desc: 'Local & highway expert' },
              { icon: '🤵', title: 'Professional Attire', desc: 'Well-groomed drivers' },
              { icon: '💬', title: 'Good Communication', desc: 'Hindi, English speaking' },
              { icon: '🛡️', title: 'Fully Insured', desc: 'Covered for safety' },
              { icon: '📱', title: 'Available on Demand', desc: '24/7 booking' },
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

      {/* Popular Cities Grid */}
      <section id="locations" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Chauffeur Service in Popular Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularCities.map((city) => (
              <Link
                key={city.slug}
                href={`/chauffeur-service/${city.slug}`}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group"
              >
                <h3 className="font-semibold text-lg group-hover:text-indigo-700 transition">
                  {city.name}
                </h3>
                <p className="text-sm text-gray-600">{city.state}</p>
                <p className="text-sm text-indigo-700 mt-2">From @₹599/day →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Chauffeur Packages */}
      <section id="packages" className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Chauffeur Service Packages
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { type: 'Daily (8-10 hrs)', price: '599-899', features: 'Local city driving, 8-10 hours service, Own car', best: 'Daily office commute' },
              { type: 'Outstation Trip', price: '800-1200/day', features: 'Outstation driving, Night stay charges extra, Bata included', best: 'Long trips, Tours' },
              { type: 'Monthly Contract', price: '15000-25000', features: 'Full month driver, 26 days, 8-10 hrs/day', best: 'Regular need, Families' },
              { type: 'Event/Wedding', price: '1500-2500/day', features: 'Special occasions, Uniformed driver, Flexible hours', best: 'Weddings, Events' },
              { type: 'Luxury Car Driver', price: '1200-2000/day', features: 'Premium car experience, White uniform, Extra trained', best: 'Luxury vehicles' },
              { type: 'Airport Transfer', price: '400-600', features: 'One-way pickup/drop, Professional service, On-time', best: 'Airport trips' },
            ].map((pkg) => (
              <div key={pkg.type} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition border-t-4 border-indigo-600">
                <h3 className="text-xl font-bold mb-2">{pkg.type}</h3>
                <p className="text-3xl font-bold text-indigo-700 mb-3">₹{pkg.price}</p>
                <p className="text-sm text-gray-600 mb-3">{pkg.features}</p>
                <p className="text-xs text-gray-500 mb-4">Best for: {pkg.best}</p>
                <button className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition">
                  Book Chauffeur
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perfect Occasions */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Perfect for Every Need
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Daily Commute', icon: '💼', desc: 'Office, business trips' },
              { occasion: 'Outstation Tours', icon: '🗺️', desc: 'Hill stations, pilgrimages' },
              { occasion: 'Weddings', icon: '💒', desc: 'Wedding car driver' },
              { occasion: 'Events', icon: '🎉', desc: 'Parties, celebrations' },
              { occasion: 'Airport Transfers', icon: '✈️', desc: 'Pickup & drop service' },
              { occasion: 'Medical Needs', icon: '🏥', desc: 'Hospital visits, care' },
              { occasion: 'Elderly Care', icon: '👴', desc: 'Senior citizen assistance' },
              { occasion: 'Temporary Need', icon: '⏰', desc: 'Short-term requirement' },
            ].map((item) => (
              <div key={item.occasion} className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{item.occasion}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Driver Qualities */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Our Chauffeur Qualities
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-indigo-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-indigo-900">Professional Skills</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>5+ years driving experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>Valid driving license (LMV/HMV)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>Expert in all car types</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>Know local & highway routes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>Safe & defensive driving</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>Traffic rules knowledge</span>
                </li>
              </ul>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-purple-900">Personal Qualities</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Police verification done</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Well-groomed & professional</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Punctual & reliable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Good communication skills</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Courteous & respectful</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Trustworthy & honest</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            How to Hire a Chauffeur
          </h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Choose Package', desc: 'Daily, outstation, or monthly' },
              { step: '2', title: 'Provide Details', desc: 'Car type, location, duration' },
              { step: '3', title: 'Verify Driver', desc: 'Check driver profile & documents' },
              { step: '4', title: 'Confirm Booking', desc: 'Pay advance & confirm' },
              { step: '5', title: 'Driver Arrives', desc: 'Professional chauffeur at your service' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-white p-4 rounded-lg shadow-md">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
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
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'How much does a chauffeur service cost?',
                a: 'Chauffeur service starts from ₹599 per day for 8-10 hours local driving. Outstation drivers cost ₹800-1200/day. Monthly contract starts from ₹15,000.',
              },
              {
                q: 'Are your chauffeurs verified?',
                a: 'Yes! All our chauffeurs are police verified, have valid driving licenses, and go through thorough background checks. We ensure safety and reliability.',
              },
              {
                q: 'Can I hire a chauffeur for outstation trips?',
                a: 'Yes, we provide chauffeurs for outstation trips. Charges are ₹800-1200/day plus driver allowance (bata) and accommodation if overnight stay required.',
              },
              {
                q: 'What is included in monthly chauffeur package?',
                a: 'Monthly package includes driver for 26 days, 8-10 hours per day. Suitable for families or businesses with regular driving needs. Cost: ₹15,000-25,000/month.',
              },
              {
                q: 'Can I get a driver for my luxury car?',
                a: 'Yes! We provide specially trained chauffeurs for luxury cars like BMW, Mercedes, Audi. They are experienced in handling premium vehicles. Cost: ₹1200-2000/day.',
              },
              {
                q: 'How quickly can I get a chauffeur?',
                a: 'For local bookings, we can provide a chauffeur within 2-4 hours. For outstation or special requirements, we recommend booking 24 hours in advance.',
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
