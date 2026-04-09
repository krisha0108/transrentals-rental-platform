import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: 'Pulsar on Rent in India | Bajaj Pulsar Rental @₹499/Day | TransRentals',
  description: 'Rent Bajaj Pulsar bikes across India. Pulsar 150, Pulsar 180, Pulsar NS200, Pulsar RS200 available. Reliable sports bikes. Daily & monthly rental from ₹499/day.',
  keywords: [
    'pulsar on rent',
    'bajaj pulsar rental',
    'pulsar 150 on rent',
    'pulsar ns200 rental',
    'pulsar bike rental india',
    'sports bike on rent',
  ],
  openGraph: {
    title: 'Pulsar on Rent in India @₹499/Day | TransRentals',
    description: 'Rent Bajaj Pulsar bikes. Reliable sports bikes starting @₹499/day.',
    type: 'website',
    url: 'https://transrentals.in/pulsar-on-rent',
    images: [
      {
        url: 'https://transrentals.in/images/og/pulsar-rental.jpg',
        width: 1200,
        height: 630,
        alt: 'Pulsar Bike Rental - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pulsar on Rent in India | TransRentals',
    description: 'Rent Bajaj Pulsar bikes starting @₹499/day.',
    images: ['https://transrentals.in/images/og/pulsar-rental.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/pulsar-on-rent',
  },
};

const topCities = ALL_CITIES.slice(0, 12);

export default function PulsarRentalPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Pulsar Rental in 200+ Cities"
        title="Pulsar on Rent"
        titleHighlight="Starting @₹499/Day"
        description="Rent Bajaj Pulsar bikes - India's most popular sports bike. Reliable, powerful, fuel-efficient. Perfect for daily commute and weekend rides."
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Well Maintained', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Fuel Efficient', color: 'text-blue-600' },
        ]}
        gradientFrom="blue-50"
        gradientTo="indigo-50"
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Bajaj Pulsar Rental Across India
            </h1>
            <p className="text-lg md:text-xl mb-6 opacity-90">
              Pulsar 150 • Pulsar 180 • NS200 • RS200 • Definitely Male
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="#models"
                className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                View Pulsar Models
              </Link>
              <Link
                href="#cities"
                className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-700 transition"
              >
                Find Near You
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Pulsar */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent Pulsar?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '💪', title: 'Proven Reliability', desc: 'India\'s best-selling sports bike' },
              { icon: '⛽', title: 'Fuel Efficient', desc: '45-55 km/litre mileage' },
              { icon: '🏍️', title: 'Sporty Design', desc: 'Aggressive looks, smooth ride' },
              { icon: '💰', title: 'Affordable', desc: 'Best value for money' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Pulsar Rental Available in 200+ Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/pulsar-on-rent/${city.slug}`}
                className="p-3 bg-gray-50 rounded-lg text-center hover:bg-blue-50 hover:border-blue-300 border border-gray-200 transition"
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

      <FAQSection service="bike-on-rent" />
    </>
  );
}
