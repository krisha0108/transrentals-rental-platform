import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

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

const splendorModels = [
  { name: 'Splendor Plus', cc: '97cc', price: '₹299/day', type: 'Commuter', mileage: '70 km/l' },
  { name: 'Splendor iSmart', cc: '110cc', price: '₹349/day', type: 'Smart Commuter', mileage: '75 km/l' },
  { name: 'Super Splendor', cc: '125cc', price: '₹399/day', type: 'Premium Commuter', mileage: '65 km/l' },
  { name: 'HF Deluxe', cc: '97cc', price: '₹279/day', type: 'Economy', mileage: '70 km/l' },
];

const topCities = ALL_CITIES.slice(0, 12);

export default function SplendorRentalPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Splendor Rental in 200+ Cities"
        title="Splendor on Rent"
        titleHighlight="Starting @₹299/Day"
        description="Rent Hero Splendor - India's most trusted bike. Best-in-class mileage, low maintenance, perfect for daily commute and long rides."
        features={[
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Well Maintained', color: 'text-emerald-600' },
          { icon: 'zap', text: '70+ km/l Mileage', color: 'text-green-600' },
        ]}
        gradientFrom="green-50"
        gradientTo="emerald-50"
      />

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

      {/* Splendor Models */}
      <section id="models" className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Splendor Models Available for Rent
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {splendorModels.map((model) => (
              <div key={model.name} className="bg-white p-5 rounded-lg shadow-md border-t-4 border-green-500 hover:shadow-xl transition">
                <div className="text-3xl mb-2">🏍️</div>
                <h3 className="font-bold text-lg mb-1">{model.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{model.cc} • {model.type}</p>
                <p className="text-sm text-gray-600 mb-2">Mileage: {model.mileage}</p>
                <p className="text-green-600 font-bold text-xl">{model.price}</p>
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

      {/* Related Services */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Other Bike Rentals
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href="/activa-on-rent" className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-xl transition group">
              <div className="text-3xl mb-3">🛵</div>
              <h3 className="font-semibold text-lg group-hover:text-primary">Activa & Scooters</h3>
              <p className="text-sm text-gray-600 mt-2">Automatic scooters from ₹299/day</p>
            </Link>
            <Link href="/pulsar-on-rent" className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-xl transition group">
              <div className="text-3xl mb-3">🏍️</div>
              <h3 className="font-semibold text-lg group-hover:text-primary">Bajaj Pulsar</h3>
              <p className="text-sm text-gray-600 mt-2">Sports bikes from ₹499/day</p>
            </Link>
            <Link href="/monthly-bike-rental" className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-xl transition group">
              <div className="text-3xl mb-3">📅</div>
              <h3 className="font-semibold text-lg group-hover:text-primary">Monthly Rental</h3>
              <p className="text-sm text-gray-600 mt-2">Long term from ₹2,499/month</p>
            </Link>
            <Link href="/bike-on-rent" className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-xl transition group">
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
