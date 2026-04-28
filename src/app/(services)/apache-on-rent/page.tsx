import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BikeSearchHero } from '@/components/bike/BikeSearchHero';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: 'Apache on Rent in India | TVS Apache Rental @₹499/Day | TransRentals',
  description: 'Rent TVS Apache bikes across India. Apache RTR 160, RTR 180, RTR 200, Apache RR 310 available. Racing DNA bikes. Daily & monthly rental from ₹499/day.',
  keywords: [
    'apache on rent',
    'tvs apache rental',
    'apache rtr on rent',
    'apache 200 rental',
    'apache bike rental india',
    'racing bike on rent',
  ],
  openGraph: {
    title: 'Apache on Rent in India @₹499/Day | TransRentals',
    description: 'Rent TVS Apache bikes. Racing DNA sports bikes starting @₹499/day.',
    type: 'website',
    url: 'https://transrentals.in/apache-on-rent',
    images: [
      {
        url: 'https://transrentals.in/images/og/apache-rental.jpg',
        width: 1200,
        height: 630,
        alt: 'Apache Bike Rental - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apache on Rent in India | TransRentals',
    description: 'Rent TVS Apache bikes starting @₹499/day.',
    images: ['https://transrentals.in/images/og/apache-rental.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/apache-on-rent',
  },
};

const topCities = ALL_CITIES.slice(0, 12);

export default function ApacheRentalPage() {
  return (
    <>
      <BikeSearchHero />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-600 to-rose-700 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              TVS Apache Rental Across India
            </h1>
            <p className="text-lg md:text-xl mb-6 opacity-90">
              RTR 160 • RTR 180 • RTR 200 4V • RR 310 • Racing DNA
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="#models"
                className="bg-white text-red-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                View Apache Models
              </Link>
              <Link
                href="#cities"
                className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-700 transition"
              >
                Find Near You
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Apache */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent Apache?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏁', title: 'Racing DNA', desc: 'Track-inspired engineering' },
              { icon: '🎯', title: 'Sharp Handling', desc: 'Precise cornering ability' },
              { icon: '💨', title: 'Quick Response', desc: 'Instant throttle response' },
              { icon: '🔧', title: 'Reliable', desc: 'TVS build quality' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-gradient-to-br from-red-50 to-white rounded-lg border border-red-200">
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
            Apache Rental Available in 200+ Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/apache-on-rent/${city.slug}`}
                className="p-3 bg-gray-50 rounded-lg text-center hover:bg-red-50 hover:border-red-300 border border-gray-200 transition"
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
