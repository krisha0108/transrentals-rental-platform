import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_CITIES, STATIC_CITIES, getCityBySlug } from '@/data/indian-cities';
import { capitalize } from '@/lib/utils';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { BikeServiceSchema } from '@/components/seo/schemas';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for all cities
export async function generateStaticParams() {
  return STATIC_CITIES.map((city) => ({
    location: city.slug,
  }));
}

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const locationSlug = params.location;

  return {
    title: `Monthly Bike Rental in ${locationName} | Scooty on Rent Monthly @₹2999 | TransRentals`,
    description: `Rent bike or scooty on monthly basis in ${locationName}. Activa, Splendor, Pulsar, Royal Enfield available from ₹2999/month. Zero maintenance, doorstep delivery. Book now!`,
    keywords: [
      `monthly bike rental ${locationName}`,
      `monthly bike rental in ${locationName}`,
      `scooty on rent monthly ${locationName}`,
      `bike on rent monthly ${locationName}`,
      `monthly activa rental ${locationName}`,
      `long term bike rental ${locationName}`,
      `bike subscription ${locationName}`,
      `monthly two wheeler ${locationName}`,
    ],
    openGraph: {
      title: `Monthly Bike Rental in ${locationName} @₹2999/Month | TransRentals`,
      description: `Rent bikes & scooters monthly in ${locationName}. Activa, Splendor, Pulsar available. Zero maintenance, flexible plans.`,
      type: 'website',
      url: `https://transrentals.in/monthly-bike-rental/${locationSlug}`,
      images: [
        {
          url: 'https://transrentals.in/images/og/monthly-bike-rental.jpg',
          width: 1200,
          height: 630,
          alt: `Monthly Bike Rental in ${locationName} - TransRentals`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Monthly Bike Rental in ${locationName} | TransRentals`,
      description: `Rent bikes & scooters monthly in ${locationName}. Starting @₹2999/month.`,
      images: ['https://transrentals.in/images/og/monthly-bike-rental.jpg'],
    },
    alternates: {
      canonical: `https://transrentals.in/monthly-bike-rental/${locationSlug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function MonthlyBikeRentalLocationPage({ params }: PageProps) {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  // Schema data
  const schemaFaqs = [
    { question: `How much does monthly bike rental cost in ${locationName}?`, answer: `Monthly bike rental in ${locationName} starts from ₹2,999/month for scooters like Activa. Commuter bikes cost ₹3,999-4,999/month, and Royal Enfield costs ₹9,999-14,999/month.` },
    { question: `What bikes are available for monthly rent in ${locationName}?`, answer: `We have Honda Activa, TVS Jupiter, Hero Splendor, Bajaj Pulsar, Yamaha FZ, and Royal Enfield available for monthly rental in ${locationName}.` },
    { question: `Is there home delivery for monthly bike rental in ${locationName}?`, answer: `Yes, we provide doorstep delivery across ${locationName}. Bikes are delivered within 24 hours of booking confirmation.` },
    { question: `What documents are needed for monthly bike rental in ${locationName}?`, answer: 'You need a valid driving license (minimum 6 months old), Aadhar card, and a refundable security deposit (₹3,000-10,000 depending on bike type).' },
    { question: `Can I extend my monthly bike rental in ${locationName}?`, answer: 'Yes, you can extend month by month. Long-term rentals (3+ months) get discounted rates up to 15% off.' },
  ];

  const schemaVehicles = [
    { name: 'Honda Activa 6G', brand: 'Honda', price: 2999 },
    { name: 'TVS Jupiter', brand: 'TVS', price: 3499 },
    { name: 'Hero Splendor Plus', brand: 'Hero', price: 3999 },
    { name: 'Bajaj Pulsar 150', brand: 'Bajaj', price: 4999 },
    { name: 'Royal Enfield Classic 350', brand: 'Royal Enfield', price: 9999 },
  ];

  return (
    <>
      {/* Schema Markup */}
      <BikeServiceSchema
        serviceName={`Monthly Bike Rental in ${locationName}`}
        serviceSlug="monthly-bike-rental"
        description={`Rent bikes and scooters on monthly basis in ${locationName}. Activa, Splendor, Pulsar, Royal Enfield available. Starting @₹2999/month.`}
        city={locationName}
        citySlug={params.location}
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 2999, max: 14999 }}
        rating={4.7}
        reviewCount={Math.floor(Math.random() * 500) + 200}
      />

      <ServiceHeroWithChat
        badge={`Monthly Bike Rental in ${locationName}`}
        title={`Monthly Bike & Scooty Rental`}
        titleHighlight="Starting @₹2,999/Month"
        description={`Rent bikes & scooters on monthly basis in ${locationName}. Zero maintenance, flexible plans, doorstep delivery across ${locationName}.`}
        gradientFrom="emerald-50"
        gradientTo="teal-50"
      />

      {/* Breadcrumb */}
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-emerald-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/monthly-bike-rental" className="hover:text-emerald-700">Monthly Bike Rental</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-emerald-600 to-teal-700 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Monthly Bike Rental in {locationName}
            </h1>
            <p className="text-lg md:text-xl mb-6 opacity-90">
              Long Term Bike & Scooty Subscription | Starting @₹2,999/Month
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="#plans"
                className="bg-white text-emerald-700 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition"
              >
                View Monthly Plans
              </Link>
              <Link
                href={`/bike-on-rent/${params.location}`}
                className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-700 transition"
              >
                Daily Rental Options
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 bg-white border-b">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4">
              <div className="text-3xl font-bold text-emerald-700">₹2,999</div>
              <div className="text-sm text-gray-600">Starting Price/Month</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-emerald-700">50+</div>
              <div className="text-sm text-gray-600">Bikes Available</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-emerald-700">24hr</div>
              <div className="text-sm text-gray-600">Delivery Time</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-emerald-700">4.7★</div>
              <div className="text-sm text-gray-600">Customer Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Monthly Plans */}
      <section id="plans" className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-4">
            Monthly Bike Rental Plans in {locationName}
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Choose from scooters, commuter bikes, sports bikes, or premium bikes
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                category: 'Scooter',
                bikes: 'Activa, Jupiter, Access, Dio',
                price: '2,999',
                km: '1500 km/month',
                deposit: '₹3,000',
                features: ['Automatic transmission', 'Easy to ride', 'Fuel efficient', 'Storage space'],
                popular: true,
              },
              {
                category: 'Commuter Bike',
                bikes: 'Splendor, Shine, Pulsar 125',
                price: '3,999',
                km: '2000 km/month',
                deposit: '₹4,000',
                features: ['Manual transmission', 'High mileage', 'Reliable', 'Low maintenance'],
                popular: false,
              },
              {
                category: 'Sports Bike',
                bikes: 'FZ, Duke 200, Apache, Pulsar',
                price: '5,999',
                km: '1500 km/month',
                deposit: '₹7,000',
                features: ['Powerful engine', 'Sporty design', 'Good performance', 'Thrilling ride'],
                popular: false,
              },
              {
                category: 'Royal Enfield',
                bikes: 'Classic 350, Meteor, Hunter',
                price: '9,999',
                km: '2000 km/month',
                deposit: '₹10,000',
                features: ['Iconic brand', 'Touring ready', 'Premium feel', 'Road presence'],
                popular: false,
              },
            ].map((plan) => (
              <div
                key={plan.category}
                className={`bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition relative ${plan.popular ? 'ring-2 ring-emerald-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.category}</h3>
                <p className="text-sm text-gray-600 mb-3">{plan.bikes}</p>
                <p className="text-3xl font-bold text-emerald-700">₹{plan.price}</p>
                <p className="text-sm text-gray-500 mb-4">/month</p>
                <ul className="space-y-2 mb-4 text-sm">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-emerald-600">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <div className="border-t pt-3 space-y-1 text-sm text-gray-600">
                  <p>KM Limit: {plan.km}</p>
                  <p>Deposit: {plan.deposit} (refundable)</p>
                </div>
                <button className="w-full mt-4 bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 transition">
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Monthly Rental */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Monthly Bike Rental in {locationName}?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '💰',
                title: 'Save 40% vs Daily',
                desc: `Monthly rental in ${locationName} costs significantly less than daily rates. Perfect for long stays.`
              },
              {
                icon: '🔧',
                title: 'Zero Maintenance',
                desc: 'Free servicing, repairs, and breakdown assistance included. We handle everything.'
              },
              {
                icon: '🏠',
                title: 'Doorstep Delivery',
                desc: `Bike delivered to your address in ${locationName} within 24 hours. Pickup also available.`
              },
              {
                icon: '🛡️',
                title: 'Fully Insured',
                desc: 'Comprehensive insurance coverage included. Ride worry-free.'
              },
              {
                icon: '📅',
                title: 'Flexible Duration',
                desc: 'Rent for 1 month to 12+ months. Extend or cancel anytime.'
              },
              {
                icon: '🔄',
                title: 'Free Replacement',
                desc: 'If your bike breaks down, we provide a replacement within hours.'
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perfect For Section */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">
            Who Rents Monthly in {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🎓', title: 'Students', desc: 'College semester rentals' },
              { icon: '💼', title: 'Professionals', desc: 'Daily office commute' },
              { icon: '📦', title: 'Delivery Partners', desc: 'Zomato, Swiggy, Amazon' },
              { icon: '🏢', title: 'Job Transfers', desc: 'Temporary relocations' },
            ].map((item) => (
              <div key={item.title} className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-lg text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            How to Rent Bike Monthly in {locationName}
          </h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Choose Your Bike', desc: 'Select scooter or bike type and monthly plan' },
              { step: '2', title: 'Submit Documents', desc: 'Upload driving license and Aadhar card' },
              { step: '3', title: 'Pay & Confirm', desc: 'Pay first month rent + refundable deposit' },
              { step: '4', title: 'Get Delivered', desc: `Bike delivered to your ${locationName} address in 24hrs` },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-white p-5 rounded-lg shadow-md">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Services */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">
            Other Bike Services in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href={`/bike-on-rent/${params.location}`}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group"
            >
              <div className="text-4xl mb-3">🏍️</div>
              <h3 className="font-semibold text-lg group-hover:text-primary transition">Daily Bike Rental</h3>
              <p className="text-sm text-gray-600 mt-2">Rent by day or week. From ₹299/day</p>
            </Link>
            <Link
              href={`/activa-on-rent/${params.location}`}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group"
            >
              <div className="text-4xl mb-3">🛵</div>
              <h3 className="font-semibold text-lg group-hover:text-primary transition">Activa on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">Scooters for easy city rides. From ₹299/day</p>
            </Link>
            <Link
              href={`/royal-enfield-on-rent/${params.location}`}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group"
            >
              <div className="text-4xl mb-3">🔥</div>
              <h3 className="font-semibold text-lg group-hover:text-primary transition">Royal Enfield Rental</h3>
              <p className="text-sm text-gray-600 mt-2">Bullet, Classic 350, Himalayan. From ₹599/day</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="bike-on-rent" />
    </>
  );
}
