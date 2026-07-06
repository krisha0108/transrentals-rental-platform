import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BikeSearchHero } from '@/components/bike/BikeSearchHero';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Splendor on Rent in India | Hero Splendor Rental @₹299/Day | TransRentals',
  description: 'Rent Hero Splendor bikes across India. Splendor Plus, Splendor iSmart, Super Splendor available. Most fuel efficient bike. Daily & monthly rental from ₹299/day.',
  keywords: [
    'splendor on rent',
    'hero splendor rental',
    'splendor plus on rent',
    'super splendor rental',
    'splendor bike rental india',
    'fuel efficient bike rental',
  ],
  openGraph: {
    title: 'Splendor on Rent in India @₹299/Day | TransRentals',
    description: 'Rent Hero Splendor bikes. Most fuel efficient bikes starting @₹299/day.',
    type: 'website',
    url: 'https://transrentals.in/splendor-on-rent',
    images: [
      {
        url: 'https://transrentals.in/images/og/splendor-rental.jpg',
        width: 1200,
        height: 630,
        alt: 'Splendor Bike Rental - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Splendor on Rent in India | TransRentals',
    description: 'Rent Hero Splendor bikes starting @₹299/day.',
    images: ['https://transrentals.in/images/og/splendor-rental.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/splendor-on-rent',
  },
};

const topCities = ALL_CITIES.slice(0, 12);

const FAQS = [
  { question: 'What is the rental price for Hero Splendor?', answer: 'Hero Splendor rental starts at just ₹299/day — the most affordable bike rental option on TransRentals, with additional savings on weekly and monthly plans.' },
  { question: 'Which Splendor variants can I rent?', answer: 'Splendor Plus, Splendor iSmart, and Super Splendor are all available for daily and monthly rental across 200+ cities.' },
  { question: 'What mileage does Hero Splendor give?', answer: 'Splendor offers up to 75 km/litre, making it India\'s most fuel-efficient commuter bike and a great low-cost rental choice.' },
  { question: 'What documents and deposit are needed to rent a Splendor?', answer: 'A valid two-wheeler driving license and Aadhaar card are required, along with a minimal refundable security deposit — lower than premium bike segments.' },
  { question: 'Is Splendor a good choice for daily office commute?', answer: 'Yes, its light weight, easy handling, and low fuel cost make Splendor ideal for daily office commute, delivery work, and short city rides.' },
];

export default function SplendorRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Hero Splendor on TransRentals"
        description="Book Hero Splendor rental for daily commuting in 4 simple steps."
        totalTime="PT7M"
        steps={[
          { name: 'Select City & Duration', text: 'Enter city and choose rental period. Splendor Plus, iSmart, and Super Splendor available for daily and monthly rental.' },
          { name: 'Choose Variant', text: 'Select Splendor Plus for basic commuting or Super Splendor for slightly more power. Both offer great fuel economy.' },
          { name: 'Upload DL & Pay Deposit', text: 'Submit driving licence with two-wheeler class and Aadhaar. Pay minimal deposit for this commuter segment.' },
          { name: 'Pick Up & Commute', text: 'Collect Splendor at vendor location. Perfect for daily office commute with excellent mileage.' },
        ]}
      />
      <BikeSearchHero />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 to-emerald-700 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Hero Splendor Rental Across India
            </h1>
            <p className="text-lg md:text-xl mb-6 opacity-90">
              Splendor Plus • iSmart • Super Splendor • Desh Ki Dhadkan
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="#models"
                className="bg-white text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                View Splendor Models
              </Link>
              <Link
                href="#cities"
                className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-700 transition"
              >
                Find Near You
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Splendor */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent Splendor?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '⛽', title: 'Best Mileage', desc: 'Up to 75 km/litre' },
              { icon: '💰', title: 'Most Affordable', desc: 'Lowest rental rates' },
              { icon: '🔧', title: 'Low Maintenance', desc: 'Reliable & easy to maintain' },
              { icon: '✅', title: 'Proven Trust', desc: 'India\'s #1 selling bike' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-200">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Perfect For
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🏢', title: 'Office Commute', desc: 'Low fuel cost, easy parking' },
              { icon: '📦', title: 'Delivery Work', desc: 'Reliable for delivery executives' },
              { icon: '🎓', title: 'Students', desc: 'Affordable & practical' },
            ].map((item) => (
              <div key={item.title} className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Splendor Rental Available in 200+ Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/splendor-on-rent/${city.slug}`}
                className="p-3 bg-white rounded-lg text-center hover:bg-green-50 hover:border-green-300 border border-gray-200 transition"
              >
                <span className="font-medium text-gray-800">{city.name}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <p className="text-gray-600">+ 190 more cities available</p>
          </div>
        </div>
      </section>

      <FAQSection service="splendor-on-rent" customFaqs={FAQS} />

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
