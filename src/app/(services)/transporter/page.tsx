import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { FAQSection } from '@/components/services/FAQSection';
import { TruckTypesCards } from '@/components/services/TruckTypesCards';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';

const TRANSPORTER_FAQS = [
  {
    q: 'What is the cost of truck rental per day in India?',
    a: 'Truck rental rates in India vary by vehicle size and route. Mini trucks (1 ton) start from ₹2,500/day for local trips, while container trucks and heavy trailers are priced higher. Outstation trips are charged per km. Get a free quote on TransRentals based on your specific load and route requirements.',
  },
  {
    q: 'What types of trucks are available for rent on TransRentals?',
    a: 'TransRentals offers a full range of commercial vehicles: Mini Trucks (Tata Ace, Mahindra Jeeto - 1 ton), Light Commercial Vehicles (Tata 407, Bolero Pickup - 1.5–5 ton), Medium Trucks (Eicher 14/17/19 ft - 3–7 ton), Container Trucks (20 ft, 24 ft, 32 ft - 10–25 ton), and Full Trailers (40-ft flatbed and container - 25–40 ton).',
  },
  {
    q: 'Is goods insurance available for truck rentals?',
    a: 'Yes, transit insurance for goods is available through TransRentals at 0.5–1% of declared goods value. All vehicles have mandatory third-party vehicle insurance. For valuable or fragile cargo, always opt for goods-in-transit insurance before booking.',
  },
  {
    q: 'Can I book a truck for a one-way intercity trip?',
    a: 'Yes, one-way intercity truck bookings are available. Major routes: Delhi–Mumbai, Mumbai–Pune, Bangalore–Chennai, Delhi–Kolkata. One-way rates include driver allowance and have a minimum km charge. Contact TransRentals for freight quotes on specific routes.',
  },
  {
    q: 'What is the difference between full-truck-load (FTL) and part-load (LTL)?',
    a: 'Full-truck-load (FTL) means you hire the entire truck for your goods exclusively — faster transit and better for large or fragile shipments. Part-load (LTL) means your goods share the truck with others — cheaper but slower transit. TransRentals offers both options.',
  },
  {
    q: 'How do I book a truck for household goods transport in India?',
    a: 'For household shifting using a truck, select the mini-truck-rental service on TransRentals. For small loads (1 room/studio), Tata Ace is ideal. For 1–2BHK, Tata 407 or Eicher 14-ft works best. For 3BHK+, a 17–20 ft truck is recommended. Book 24–48 hrs in advance.',
  },
];

const TOP_CITIES = [
  { name: 'Delhi', slug: 'delhi' },
  { name: 'Mumbai', slug: 'mumbai' },
  { name: 'Bangalore', slug: 'bangalore' },
  { name: 'Hyderabad', slug: 'hyderabad' },
  { name: 'Chennai', slug: 'chennai' },
  { name: 'Pune', slug: 'pune' },
  { name: 'Ahmedabad', slug: 'ahmedabad' },
  { name: 'Kolkata', slug: 'kolkata' },
  { name: 'Jaipur', slug: 'jaipur' },
  { name: 'Lucknow', slug: 'lucknow' },
  { name: 'Nagpur', slug: 'nagpur' },
  { name: 'Indore', slug: 'indore' },
];

export const metadata: Metadata = {
  title: 'Transporter & Truck Rental | Starting from ₹3,999/Day | TransRentals',
  description:
    'Book trucks and goods vehicles across India. Tata Ace (1-ton) to 40-ft trailers. GPS tracking, verified drivers, full-load and part-load options. Get instant quotes from verified transporters.',
  keywords: [
    'truck rental India',
    'truck on rent',
    'goods transport service',
    'transporter services',
    'truck hire',
    'tata ace on rent',
    'container truck rental',
    'commercial vehicle rental',
    'freight transport India',
    'truck rental per day',
    'mini truck rental',
    'eicher truck hire',
  ],
  openGraph: {
    title: 'Transporter & Truck Rental | Starting from ₹3,999/Day | TransRentals',
    description: 'Book goods vehicles across India. Tata Ace to 40-ft trailers. GPS tracking, verified drivers. Full-load and part-load options available.',
    type: 'website',
    url: 'https://transrentals.in/transporter',
    images: [{ url: 'https://transrentals.in/images/og/truck-rental.jpg', width: 1200, height: 630, alt: 'Truck Rental - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Truck Rental & Transport Services | TransRentals',
    description: 'Professional truck rental and transport services across India. 7-ton to 32-ton trucks.',
    images: ['https://transrentals.in/images/og/truck-rental.jpg'],
  },
  alternates: { canonical: 'https://transrentals.in/transporter' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export default function TransporterPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <ServiceHeroWithChat
        badge="Truck Rental & Transport"
        title="Transporter Services"
        titleHighlight="GPS Tracked & Verified Drivers"
        description="Professional truck rental and transport services. 7-ton to 32-ton trucks available. GPS tracking, verified drivers. Get quotes now!"
        features={[
          { icon: 'star', text: '4.6/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Verified Transporters', color: 'text-blue-600' },
          { icon: 'zap', text: 'Multiple Quotes', color: 'text-green-600' },
        ]}
        gradientFrom="slate-50"
        gradientTo="gray-50"
      />



      <TruckTypesCards />

      <LocationsGrid service="transporter" />

      <FAQSection service="transporter" />

      {/* FAQ Section with Schema */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Truck Rental FAQs</h2>
            <p className="text-gray-600">Common questions about truck rental and goods transport in India</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {TRANSPORTER_FAQS.map((faq, idx) => (
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
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">Truck Rental by City</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/transporter/${city.slug}`}
                className="text-center py-2.5 px-2 rounded-lg border border-gray-200 hover:border-slate-400 hover:bg-slate-50 transition text-sm font-medium text-gray-700 hover:text-slate-800"
              >
                {city.name}
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <Link href="/mini-truck-rental" className="text-slate-600 hover:underline">Mini Truck Rental</Link>
              <span className="text-gray-300">|</span>
              <Link href="/trailer-on-rent" className="text-slate-600 hover:underline">Trailer on Rent</Link>
              <span className="text-gray-300">|</span>
              <Link href="/packers-and-movers" className="text-slate-600 hover:underline">Packers and Movers</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: TRANSPORTER_FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: { '@type': 'Answer', text: faq.a },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Truck Rental and Transport Service in India',
            description: 'Professional truck rental and goods transport services across India. Mini trucks to 40-ft trailers.',
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            areaServed: { '@type': 'Country', name: 'India' },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: '2500',
              highPrice: '22000',
            },
          }),
        }}
      />
    </div>
  );
}
