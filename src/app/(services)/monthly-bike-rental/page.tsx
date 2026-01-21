import { Metadata } from 'next';
import Link from 'next/link';
import { getCitiesByPriority } from '@/data/indian-cities';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { FAQSection } from '@/components/services/FAQSection';
import { BikeServiceSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Monthly Bike Rental | Scooty on Rent Monthly @₹2999/Month | TransRentals',
  description: 'Rent bike or scooty on monthly basis. Monthly bike subscription from ₹2999/month. Activa, Splendor, Pulsar available. Zero maintenance, flexible plans. Book now!',
  keywords: [
    'monthly bike rental',
    'bike on rent monthly',
    'monthly scooty rental',
    'scooty on rent monthly',
    'bike subscription',
    'long term bike rental',
    'monthly activa rental',
    'bike for month',
    'monthly two wheeler rental',
    'bike rental per month',
    'monthly bike hire',
    'long term scooty rental',
  ],
  openGraph: {
    title: 'Monthly Bike Rental India | Bike Subscription @₹2999/Month',
    description: 'Subscribe to bikes & scooters monthly. All-inclusive packages with zero maintenance. Activa, Splendor, Pulsar available.',
    type: 'website',
    url: 'https://transrentals.in/monthly-bike-rental',
    images: [
      {
        url: 'https://transrentals.in/images/og/monthly-bike-rental.jpg',
        width: 1200,
        height: 630,
        alt: 'Monthly Bike Rental - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Monthly Bike Rental | Starting @₹2999/Month | TransRentals',
    description: 'Rent bikes & scooters on monthly basis. Zero maintenance, flexible plans.',
    images: ['https://transrentals.in/images/og/monthly-bike-rental.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/monthly-bike-rental',
  },
};

// Schema data
const schemaFaqs = [
  { question: 'How much does monthly bike rental cost?', answer: 'Monthly bike rental starts from ₹2,999/month for scooters like Activa. Commuter bikes cost ₹3,999-4,999/month, and premium bikes like Royal Enfield cost ₹7,999-12,999/month.' },
  { question: 'What is included in monthly bike rental?', answer: 'Monthly rental includes the bike for 30 days, comprehensive insurance, free maintenance & servicing, and 24/7 roadside assistance. Fuel and helmet are not included.' },
  { question: 'What documents are needed for monthly bike rental?', answer: 'You need a valid driving license (minimum 6 months old), Aadhar card, and a refundable security deposit (₹2,000-10,000 depending on bike type).' },
  { question: 'Can I extend my monthly rental?', answer: 'Yes, you can extend month by month. Long-term rentals (3+ months) get discounted rates up to 15% off.' },
  { question: 'Is there a km limit for monthly rentals?', answer: 'Most monthly plans include 1500-2000 km/month. Extra km charges apply at ₹2-5/km depending on the bike.' },
];

const schemaVehicles = [
  { name: 'Honda Activa 6G', brand: 'Honda', price: 2999 },
  { name: 'TVS Jupiter', brand: 'TVS', price: 3499 },
  { name: 'Hero Splendor Plus', brand: 'Hero', price: 3999 },
  { name: 'Bajaj Pulsar 150', brand: 'Bajaj', price: 4999 },
  { name: 'Royal Enfield Classic 350', brand: 'Royal Enfield', price: 9999 },
];

export default function MonthlyBikeRentalPage() {
  const popularCities = getCitiesByPriority(8);

  return (
    <>
      {/* Schema Markup */}
      <BikeServiceSchema
        serviceName="Monthly Bike Rental"
        serviceSlug="monthly-bike-rental"
        description="Rent bikes and scooters on monthly basis across India. Activa, Splendor, Pulsar, Royal Enfield available. Starting @₹2999/month."
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 2999, max: 12999 }}
        rating={4.7}
        reviewCount={3450}
      />

      <ServiceHeroWithChat
        badge="Monthly Bike Rental in 200+ Cities"
        title="Monthly Bike Rental | Scooty Subscription"
        titleHighlight="Starting @₹2,999/Month"
        description="Rent bikes & scooters on monthly basis for college, work, or long stays. Zero maintenance, flexible plans, doorstep delivery."
        gradientFrom="emerald-50"
        gradientTo="teal-50"
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-600 to-teal-700 text-white py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Monthly Bike & Scooty Rental
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Long Term Two Wheeler Subscription | Starting @₹2,999/Month
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8 text-left">
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                <div className="text-3xl mb-2">📅</div>
                <h3 className="font-semibold mb-1">Monthly Subscription</h3>
                <p className="text-sm opacity-90">Flexible 1-12 month plans</p>
              </div>
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                <div className="text-3xl mb-2">🔧</div>
                <h3 className="font-semibold mb-1">Zero Maintenance</h3>
                <p className="text-sm opacity-90">Free servicing & repairs</p>
              </div>
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                <div className="text-3xl mb-2">🏠</div>
                <h3 className="font-semibold mb-1">Doorstep Delivery</h3>
                <p className="text-sm opacity-90">Delivered to your address</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="#locations"
                className="bg-white text-emerald-700 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition"
              >
                Browse Locations
              </Link>
              <Link
                href="#plans"
                className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-700 transition"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Monthly Bike Rental */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Monthly Bike Rental?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '💰', title: 'Save 40% vs Daily', desc: 'Cheaper than daily rental rates' },
              { icon: '🔧', title: 'Free Maintenance', desc: 'Servicing & repairs included' },
              { icon: '🛡️', title: 'Fully Insured', desc: 'Comprehensive coverage' },
              { icon: '📅', title: 'Flexible Duration', desc: '1 month to 12+ months' },
              { icon: '🚀', title: 'Quick Delivery', desc: 'Same day in metro cities' },
              { icon: '📱', title: 'Easy Process', desc: 'Minimal documentation' },
              { icon: '🔄', title: 'Free Replacement', desc: 'If bike breaks down' },
              { icon: '❌', title: 'No Long Commitment', desc: 'Cancel after 1 month' },
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

      {/* Monthly Plans */}
      <section id="plans" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Monthly Bike Subscription Plans
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                category: 'Scooter',
                bikes: 'Activa, Jupiter, Access',
                price: '2,999-3,999',
                km: '1500 km/month',
                deposit: '₹3,000',
                best: 'Students, Daily commute',
                color: 'emerald'
              },
              {
                category: 'Commuter Bike',
                bikes: 'Splendor, Shine, Pulsar',
                price: '3,999-4,999',
                km: '2000 km/month',
                deposit: '₹4,000',
                best: 'Office goers, Delivery',
                color: 'blue'
              },
              {
                category: 'Sports Bike',
                bikes: 'FZ, Duke 200, Apache',
                price: '5,999-7,999',
                km: '1500 km/month',
                deposit: '₹7,000',
                best: 'Enthusiasts, Weekend rides',
                color: 'orange'
              },
              {
                category: 'Premium/RE',
                bikes: 'Classic 350, Himalayan',
                price: '9,999-14,999',
                km: '2000 km/month',
                deposit: '₹10,000',
                best: 'Long trips, Touring',
                color: 'red'
              },
            ].map((plan) => (
              <div key={plan.category} className={`bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition border-t-4 border-${plan.color}-600`}>
                <h3 className="text-xl font-bold mb-2">{plan.category}</h3>
                <p className="text-sm text-gray-600 mb-3">{plan.bikes}</p>
                <p className="text-3xl font-bold text-emerald-700 mb-2">₹{plan.price}</p>
                <p className="text-sm text-gray-500 mb-1">/month</p>
                <div className="border-t pt-3 mt-3 space-y-2 text-sm">
                  <p><span className="text-gray-500">KM Limit:</span> {plan.km}</p>
                  <p><span className="text-gray-500">Deposit:</span> {plan.deposit}</p>
                  <p><span className="text-gray-500">Best for:</span> {plan.best}</p>
                </div>
                <button className="w-full mt-4 bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 transition">
                  Subscribe Now
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 mt-6 text-sm">
            * 3+ month subscription gets 10% discount | 6+ months gets 15% discount
          </p>
        </div>
      </section>

      {/* Popular Cities */}
      <section id="locations" className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Monthly Bike Rental in Popular Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularCities.map((city) => (
              <Link
                key={city.slug}
                href={`/monthly-bike-rental/${city.slug}`}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group border-l-4 border-emerald-500"
              >
                <h3 className="font-semibold text-lg group-hover:text-emerald-700 transition">
                  {city.name}
                </h3>
                <p className="text-sm text-gray-600">{city.state}</p>
                <p className="text-sm text-emerald-700 mt-2 font-medium">From ₹2,999/month →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <LocationsGrid service="monthly-bike-rental" />

      {/* What's Included */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            What&apos;s Included in Monthly Package
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-emerald-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-emerald-900">Package Includes</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>Bike/Scooty for 30 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>1500-2000 km/month (varies by plan)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>Free maintenance & servicing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>Comprehensive insurance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>24/7 roadside assistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>Free replacement if breakdown</span>
                </li>
              </ul>
            </div>
            <div className="bg-teal-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-teal-900">Not Included</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-teal-700 mt-1">•</span>
                  <span>Fuel (you pay for petrol)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-700 mt-1">•</span>
                  <span>Helmet (₹50/day or bring own)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-700 mt-1">•</span>
                  <span>Extra km: ₹2-5/km</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-700 mt-1">•</span>
                  <span>Security deposit (refundable)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-700 mt-1">•</span>
                  <span>Traffic fines (customer liable)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-700 mt-1">•</span>
                  <span>Parking charges</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Perfect For */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Perfect for Every Need
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'College Students', icon: '🎓', desc: 'Semester-long rentals' },
              { occasion: 'Working Professionals', icon: '💼', desc: 'Daily office commute' },
              { occasion: 'Job Transfers', icon: '🏢', desc: 'Temporary relocation' },
              { occasion: 'Delivery Partners', icon: '📦', desc: 'Swiggy, Zomato, Amazon' },
              { occasion: 'Long Vacation', icon: '🏖️', desc: 'Extended city stays' },
              { occasion: 'Own Bike Repair', icon: '🔧', desc: 'Temporary replacement' },
              { occasion: 'Try Before Buy', icon: '🔍', desc: 'Test drive for months' },
              { occasion: 'New to City', icon: '🏙️', desc: 'Just moved, need transport' },
            ].map((item) => (
              <div key={item.occasion} className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition">
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
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Monthly Bike Rental Works
          </h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Choose Bike & Plan', desc: 'Select scooter or bike, choose duration' },
              { step: '2', title: 'Submit Documents', desc: 'Driving license + Aadhar card' },
              { step: '3', title: 'Pay Security Deposit', desc: 'Refundable ₹3,000-10,000' },
              { step: '4', title: 'Get Bike Delivered', desc: 'Doorstep delivery in 24 hours' },
              { step: '5', title: 'Ride for 30 Days', desc: 'Use within km limit freely' },
              { step: '6', title: 'Renew or Return', desc: 'Extend or return, deposit refunded' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-white p-4 rounded-lg shadow-md">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
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

      <FAQSection service="bike-on-rent" />
    </>
  );
}
