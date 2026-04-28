import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BikeSearchHero } from '@/components/bike/BikeSearchHero';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: 'KTM on Rent in India | Duke & RC Bike Rental @₹999/Day | TransRentals',
  description: 'Rent KTM bikes across India. Duke 200, Duke 390, RC 200, RC 390 available. High performance sports bikes for thrill seekers. Daily & monthly rental from ₹999/day.',
  keywords: [
    'ktm on rent',
    'ktm duke on rent',
    'ktm rc on rent',
    'duke 390 rental',
    'ktm bike rental india',
    'sports bike on rent',
  ],
  openGraph: {
    title: 'KTM on Rent in India @₹999/Day | TransRentals',
    description: 'Rent KTM Duke & RC bikes. High performance sports bikes starting @₹999/day.',
    type: 'website',
    url: 'https://transrentals.in/ktm-on-rent',
    images: [
      {
        url: 'https://transrentals.in/images/og/ktm-rental.jpg',
        width: 1200,
        height: 630,
        alt: 'KTM Bike Rental - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KTM on Rent in India | TransRentals',
    description: 'Rent KTM Duke & RC bikes starting @₹999/day.',
    images: ['https://transrentals.in/images/og/ktm-rental.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/ktm-on-rent',
  },
};

const topCities = ALL_CITIES.slice(0, 12);

export default function KTMRentalPage() {
  return (
    <>
      <BikeSearchHero />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-600 to-red-700 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              KTM Bike Rental Across India
            </h1>
            <p className="text-lg md:text-xl mb-6 opacity-90">
              Duke 200 • Duke 390 • RC 200 • RC 390 • Ready to Race
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="#models"
                className="bg-white text-orange-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                View KTM Models
              </Link>
              <Link
                href="#cities"
                className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-700 transition"
              >
                Find Near You
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why KTM */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Rent KTM?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏎️', title: 'High Performance', desc: 'Up to 43 HP power output' },
              { icon: '🎯', title: 'Aggressive Styling', desc: 'Head-turning street presence' },
              { icon: '⚡', title: 'Quick Acceleration', desc: '0-100 in under 6 seconds' },
              { icon: '🛡️', title: 'Premium Build', desc: 'European engineering quality' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg border border-orange-200">
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
            KTM Rental Available in 200+ Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/ktm-on-rent/${city.slug}`}
                className="p-3 bg-gray-50 rounded-lg text-center hover:bg-orange-50 hover:border-orange-300 border border-gray-200 transition"
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
