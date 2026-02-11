import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';

interface PageProps { params: { location: string }; }

// Generate static params from DATABASE - Only locations where bike-on-rent is available
export async function generateStaticParams() {
  return getServiceLocations('bike-on-rent');
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  return {
    title: `Himalayan on Rent in ${locationName} | @₹1499/Day | TransRentals`,
    description: `Rent Royal Enfield Himalayan in ${locationName}. Adventure touring bike for mountain trips.`,
    alternates: { canonical: `https://transrentals.in/himalayan-on-rent/${params.location}` },
  };
}

export default function HimalayanLocationPage({ params }: PageProps) {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-slate-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/himalayan-on-rent" className="hover:text-slate-700">Himalayan on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <ServiceHeroWithChat
        badge={`Himalayan in ${locationName}`}
        title="Royal Enfield Himalayan on Rent"
        titleHighlight="Starting @₹1499/Day"
        description={`Rent Himalayan in ${locationName} for adventure touring. Built for mountains and tough terrains.`}
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Adventure Ready', color: 'text-blue-600' },
        ]}
        gradientFrom="slate-50"
        gradientTo="blue-50"
      />

      <section className="bg-gradient-to-br from-slate-800 to-blue-900 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Himalayan on Rent in {locationName}</h1>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹1,499/day</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Engine</p>
              <p className="text-xl font-bold">411cc / 450cc</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Himalayan Options in {locationName}</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {[
              { name: 'Himalayan 411cc', price: 1499 },
              { name: 'Himalayan 450', price: 1799 },
            ].map((v) => (
              <div key={v.name} className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold mb-2">{v.name}</h3>
                <p className="text-3xl font-bold text-slate-700 mb-4">₹{v.price}<span className="text-sm text-gray-500">/day</span></p>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>✓ Helmet included</li>
                  <li>✓ Insurance covered</li>
                  <li>✓ Panniers available</li>
                </ul>
                <button className="w-full bg-slate-800 text-white py-2 rounded-lg">Book Now</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Other Bikes in {locationName}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/royal-enfield-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Royal Enfield</h3><p className="text-sm text-gray-600 mt-2">Classic, Bullet</p>
            </Link>
            <Link href={`/ktm-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">KTM</h3><p className="text-sm text-gray-600 mt-2">Duke, RC</p>
            </Link>
            <Link href={`/bike-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">All Bikes</h3><p className="text-sm text-gray-600 mt-2">View all</p>
            </Link>
            <Link href="/bike-tours/leh-ladakh" className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Ladakh Tour</h3><p className="text-sm text-gray-600 mt-2">Guided tours</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="bike-rental" location={locationName} />
    </>
  );
}
