import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { EquipmentTypesCards } from '@/components/services/EquipmentTypesCards';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { HowToSchema, BreadcrumbSchema } from '@/components/seo/schemas';

const EQUIPMENT_FAQS = [
  {
    q: 'What types of construction equipment can I rent on TransRentals?',
    a: 'TransRentals offers a wide range of construction equipment: JCB backhoe loaders, mini and full-size excavators, cranes (mobile and tower), tipper trucks, road rollers, concrete mixers, generators, compactors, and material hoists. Equipment is available with certified operators across 250+ Indian cities.',
  },
  {
    q: 'Is an operator included in equipment rental?',
    a: 'Yes, all heavy construction equipment rentals on TransRentals include a certified operator. The operator is licensed, experienced, and responsible for safe machine operation at your site. Self-operated rentals are available for smaller equipment like generators and compactors.',
  },
  {
    q: 'What is the minimum rental duration for construction equipment?',
    a: 'Minimum rental duration is typically 1 day (8 working hours) for most equipment. Week-long and monthly contracts are available at discounted rates. For large projects requiring equipment on-site for extended periods, monthly rentals offer the best value.',
  },
  {
    q: 'How is fuel handled in construction equipment rental?',
    a: 'Fuel is generally not included in equipment rentals. The client is expected to provide diesel at the work site. Some vendors offer a with-fuel option at an additional charge. Clarify the fuel arrangement when booking on TransRentals to avoid on-site delays.',
  },
  {
    q: 'Can I rent equipment for a project in a remote area?',
    a: 'Yes, TransRentals has vendors across Tier-1, Tier-2, and Tier-3 cities including semi-rural areas. For remote sites, transportation of the equipment to your location may involve an additional mobilization charge. Specify your exact site address when requesting a quote.',
  },
  {
    q: 'What documents are required to rent heavy equipment in India?',
    a: 'As a customer, you need to provide a valid ID proof and the site address. For large or long-term equipment deployments, some vendors may require a site work order or project authorization letter. All TransRentals vendors carry valid insurance and statutory permits for their machines.',
  },
  {
    q: 'How far in advance should I book construction equipment?',
    a: 'For planned projects, book at least 48–72 hours in advance. During peak construction season (October–February) and in metro cities, demand is high — book 5–7 days ahead. Emergency and same-day bookings are available in select cities based on vendor availability.',
  },
];

const TOP_CITIES = [
  { name: 'Delhi', slug: 'delhi' },
  { name: 'Mumbai', slug: 'mumbai' },
  { name: 'Bangalore', slug: 'bangalore' },
  { name: 'Hyderabad', slug: 'hyderabad' },
  { name: 'Chennai', slug: 'chennai' },
  { name: 'Pune', slug: 'pune' },
  { name: 'Jaipur', slug: 'jaipur' },
  { name: 'Lucknow', slug: 'lucknow' },
  { name: 'Nagpur', slug: 'nagpur' },
  { name: 'Indore', slug: 'indore' },
  { name: 'Bhopal', slug: 'bhopal' },
  { name: 'Chandigarh', slug: 'chandigarh' },
];

export const metadata: Metadata = {
  title: 'Equipment Rental India | JCB, Crane, Excavator | Starting ₹1,499/Day | TransRentals',
  description:
    'Rent construction equipment across India — JCB backhoe loaders, excavators, cranes, tipper trucks, road rollers, and generators. Certified operators included. Get quotes from 500+ verified vendors.',
  keywords: [
    'equipment rental',
    'construction equipment rental',
    'crane rental India',
    'excavator rental',
    'jcb on rent',
    'tipper truck rental',
    'road roller rental',
    'generator rental',
    'construction machinery hire',
    'heavy equipment rental India',
    'equipment with operator',
    'earthmoving equipment rental',
  ],
  openGraph: {
    title: 'Equipment Rental India | JCB, Crane, Excavator | Starting ₹1,499/Day | TransRentals',
    description: 'Rent construction equipment across India. JCB, cranes, excavators, generators with certified operators. 500+ verified vendors.',
    type: 'website',
    url: 'https://transrentals.in/equipment-rental',
    images: [{ url: 'https://transrentals.in/api/og?service=equipment-rental', width: 1200, height: 630, alt: 'Equipment Rental - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Equipment Rental India | JCB, Crane, Excavator | TransRentals',
    description: 'Rent construction equipment across India. Certified operators included.',
    images: ['https://transrentals.in/api/og?service=equipment-rental'],
  },
  alternates: { canonical: 'https://transrentals.in/equipment-rental' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export default function EquipmentRentalPage() {
  return (
    <div className="flex flex-col">
      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: EQUIPMENT_FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: { '@type': 'Answer', text: faq.a },
            })),
          }),
        }}
      />

      {/* Service Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Construction Equipment Rental in India',
            description: 'Construction and heavy equipment rental services across India. JCB, cranes, excavators, generators with certified operators.',
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            areaServed: { '@type': 'Country', name: 'India' },
          }),
        }}
      />
      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
              { '@type': 'ListItem', position: 2, name: 'Equipment Rental', item: 'https://transrentals.in/equipment-rental' },
            ],
          }),
        }}
      />
      <HowToSchema
        name="How to Book Construction Equipment Rental on TransRentals"
        description="Rent JCB, cranes, excavators, generators and more with certified operators across India."
        totalTime="PT15M"
        steps={[
          { name: 'Select Equipment Type', text: 'Choose from JCB backhoe loaders, excavators, cranes, tipper trucks, road rollers, or generators based on your project need.' },
          { name: 'Enter Site Location & Dates', text: 'Provide your construction site address and rental start date. Specify project duration for better pricing.' },
          { name: 'Compare Vendor Quotes', text: 'Get quotes from multiple TransRentals-verified equipment vendors. Compare rates, equipment models, and availability.' },
          { name: 'Confirm & Deploy', text: 'Confirm your booking with advance payment. The certified operator and equipment arrive at your site on the scheduled date.' },
        ]}
      />

      <ServiceHeroWithChat
        badge="Equipment Rental"
        title="Construction & Heavy Equipment"
        titleHighlight="Hire Across India"
        description="Rent JCB, cranes, excavators, tipper trucks, road rollers, and generators. Certified operators included. Get quotes from 500+ verified vendors now!"
        features={[
          { icon: 'star', text: '4.6/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Certified Operators', color: 'text-blue-600' },
          { icon: 'zap', text: 'Multiple Quotes', color: 'text-green-600' },
        ]}
        gradientFrom="yellow-50"
        gradientTo="orange-50"
      />

      <EquipmentTypesCards />

      <LocationsGrid service="equipment-rental" />

      {/* FAQ Section */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Equipment Rental FAQs</h2>
            <p className="text-gray-600">Common questions about renting construction equipment in India</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {EQUIPMENT_FAQS.map((faq, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal City Links */}
      <section className="py-10 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">Equipment Rental by City</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/equipment-rental/${city.slug}`}
                className="text-center py-2.5 px-2 rounded-lg border border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 transition text-sm font-medium text-gray-700 hover:text-yellow-700"
              >
                {city.name}
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <Link href="/jcb-on-rent" className="text-yellow-700 hover:underline">JCB on Rent</Link>
              <span className="text-gray-300">|</span>
              <Link href="/crane-on-rent" className="text-yellow-700 hover:underline">Crane on Rent</Link>
              <span className="text-gray-300">|</span>
              <Link href="/transporter" className="text-yellow-700 hover:underline">Truck & Transport</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
