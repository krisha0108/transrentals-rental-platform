import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
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

const ktmModels = [
  { name: 'KTM Duke 200', cc: '200cc', price: '₹999/day', type: 'Street', power: '25 HP' },
  { name: 'KTM Duke 390', cc: '373cc', price: '₹1,499/day', type: 'Street', power: '43 HP' },
  { name: 'KTM RC 200', cc: '200cc', price: '₹1,099/day', type: 'Sport', power: '25 HP' },
  { name: 'KTM RC 390', cc: '373cc', price: '₹1,599/day', type: 'Sport', power: '43 HP' },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function KTMRentalPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="KTM Rental in 200+ Cities"
        title="KTM on Rent"
        titleHighlight="Starting @₹999/Day"
        description="Rent KTM Duke & RC bikes for the ultimate riding experience. High performance, aggressive styling, perfect for thrill seekers."
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Well Maintained', color: 'text-emerald-600' },
          { icon: 'zap', text: 'High Performance', color: 'text-orange-600' },
        ]}
        gradientFrom="orange-50"
        gradientTo="red-50"
      />

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

      {/* KTM Models */}
      <section id="models" className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            KTM Models Available for Rent
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {ktmModels.map((model) => (
              <div key={model.name} className="bg-white p-5 rounded-lg shadow-md border-t-4 border-orange-500 hover:shadow-xl transition">
                <div className="text-3xl mb-2">🏍️</div>
                <h3 className="font-bold text-lg mb-1">{model.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{model.cc} • {model.type}</p>
                <p className="text-sm text-gray-600 mb-2">Power: {model.power}</p>
                <p className="text-orange-600 font-bold text-xl">{model.price}</p>
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

      {/* Related Services */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Other Bike Rentals
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href="/royal-enfield-on-rent" className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group">
              <div className="text-3xl mb-3">🏍️</div>
              <h3 className="font-semibold text-lg group-hover:text-primary">Royal Enfield</h3>
              <p className="text-sm text-gray-600 mt-2">Classic touring bikes from ₹899/day</p>
            </Link>
            <Link href="/pulsar-on-rent" className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group">
              <div className="text-3xl mb-3">🏍️</div>
              <h3 className="font-semibold text-lg group-hover:text-primary">Bajaj Pulsar</h3>
              <p className="text-sm text-gray-600 mt-2">Popular sports bikes from ₹499/day</p>
            </Link>
            <Link href="/apache-on-rent" className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group">
              <div className="text-3xl mb-3">🏍️</div>
              <h3 className="font-semibold text-lg group-hover:text-primary">TVS Apache</h3>
              <p className="text-sm text-gray-600 mt-2">Racing DNA bikes from ₹499/day</p>
            </Link>
            <Link href="/bike-on-rent" className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group">
              <div className="text-3xl mb-3">🏍️</div>
              <h3 className="font-semibold text-lg group-hover:text-primary">All Bikes</h3>
              <p className="text-sm text-gray-600 mt-2">Browse all bikes from ₹299/day</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="bike-on-rent" />
    </>
  );
}
