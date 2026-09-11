import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageCircleQuestion, Plus, MapPin, ArrowRight, Truck, PackageOpen, Bus } from 'lucide-react';
import { TruckTypesCards } from '@/components/services/TruckTypesCards';
import { TransporterBookingHero } from '@/components/transporter/TransporterBookingHero';
import { TransporterPopularCitiesGrid } from '@/components/transporter/TransporterPopularCitiesGrid';
import { HowToSchema } from '@/components/seo/schemas';

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
  title: 'Transporter & Truck Rental | Starting from ₹3,999/Day',
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
      <HowToSchema
        name="How to Book a Truck or Transporter on TransRentals"
        description="Book a truck or goods transport vehicle in 4 simple steps across India."
        totalTime="PT10M"
        steps={[
          { name: 'Enter Shipment Details', text: 'Provide pickup city, delivery destination, goods type, weight, and loading date. Specify FTL or LTL requirement.' },
          { name: 'Choose Truck Type', text: 'Select from mini truck (1 ton), Tata 407, Eicher, container truck (20–32 ft), or trailer based on load size.' },
          { name: 'Compare Transporter Quotes', text: 'Review freight quotes from verified transporters. Check per-km rates, driver allowance, and transit insurance options.' },
          { name: 'Confirm & Track Shipment', text: 'Pay advance to confirm. Driver picks up goods on scheduled date. Track shipment via GPS during transit.' },
        ]}
      />
      {/* Hero Section */}
      <TransporterBookingHero city="India" citySlug="" />



      <TruckTypesCards />

      <TransporterPopularCitiesGrid serviceSlug="transporter" />

      {/* FAQ Section with Schema */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage:
              'radial-gradient(380px 300px at 3% 12%, #000 0%, transparent 70%), radial-gradient(380px 300px at 97% 88%, #000 0%, transparent 70%)',
            maskImage:
              'radial-gradient(380px 300px at 3% 12%, #000 0%, transparent 70%), radial-gradient(380px 300px at 97% 88%, #000 0%, transparent 70%)',
          }}
        />

        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-primary-700">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              GOOD TO KNOW
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Truck Rental <span className="text-primary">FAQs</span>
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Common questions about truck rental and goods transport in India.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-3">
            {TRANSPORTER_FAQS.map((faq, idx) => (
              /* <details> — bina kisi client JS ke khulta-band hota hai */
              <details
                key={idx}
                open={idx === 0}
                className="group rounded-2xl bg-white border border-gray-100 shadow-sm open:border-primary-200 open:shadow-md transition-all"
              >
                <summary className="flex items-center gap-4 px-4 sm:px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-primary-50 grid place-items-center">
                    <MessageCircleQuestion className="w-[18px] h-[18px] text-primary" />
                  </span>
                  <h3 className="flex-1 font-bold text-[15px] leading-snug text-gray-900">
                    {faq.q}
                  </h3>
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 text-gray-500 grid place-items-center transition-all duration-200 group-open:rotate-45 group-open:bg-primary group-open:text-white">
                    <Plus className="w-4 h-4" />
                  </span>
                </summary>
                <p className="px-4 sm:px-5 pb-5 sm:pl-[4.25rem] text-[14px] leading-relaxed text-gray-500">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Internal City Links */}
      <section className="relative py-16 bg-white border-t border-gray-100 overflow-hidden">
        {/* Subtle grid-line pattern background */}
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'linear-gradient(#ecfdf5 1px, transparent 1px), linear-gradient(90deg, #ecfdf5 1px, transparent 1px)',
            backgroundSize: '34px 34px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 90%)',
          }}
        />
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
              <MapPin className="w-4 h-4" />
              Browse by City
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Truck Rental by City</h2>
            <p className="text-gray-500">Jump straight to a city&apos;s dedicated page</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-5xl mx-auto mb-8">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/transporter/${city.slug}`}
                className="flex items-center gap-2 bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                </span>
                {city.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
            {[
              { href: '/mini-truck-rental', label: 'Mini Truck Rental', icon: Truck },
              { href: '/trailer-on-rent', label: 'Trailer on Rent', icon: Truck },
              { href: '/packers-and-movers', label: 'Packers and Movers', icon: PackageOpen },
              { href: '/bus-rental', label: 'Bus Rental', icon: Bus },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 bg-white border border-gray-100 hover:border-emerald-200 rounded-xl px-4 py-2.5 text-sm font-bold text-emerald-700 transition-colors"
              >
                <link.icon className="w-4 h-4 text-emerald-600" />
                {link.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
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
              lowPrice: 2500,
              highPrice: 22000,
              offerCount: 30,
            },
          }),
        }}
      />
    </div>
  );
}
