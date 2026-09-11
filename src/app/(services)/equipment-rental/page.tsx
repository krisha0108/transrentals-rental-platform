import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MessageCircleQuestion, Plus, MapPin, ArrowRight, HardHat, Wrench, Truck,
} from 'lucide-react';
import { BusRentalPopularCitiesGrid } from '@/components/bus-rental/BusRentalPopularCitiesGrid';
import { EquipmentTypesCards } from '@/components/services/EquipmentTypesCards';
import { EquipmentBookingHero } from '@/components/equipment-rental/EquipmentBookingHero';
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

      {/* Wahi hero jo city pages par hai — photo, booking form aur AI
          assistant ke saath. Hub par shehar khaali rehta hai. */}
      <EquipmentBookingHero
        city="India"
        citySlug=""
        cityName=""
        topClearance
        pageDescription="Rent JCB, cranes, excavators, tipper trucks, road rollers, and generators. Certified operators included. Get quotes from 500+ verified vendors now!"
      />

      <EquipmentTypesCards />

      {/* Wahi cities grid jo bus-rental par hai — banner, search,
         state-wise grouping aur stats ke saath. Component serviceSlug
         se chalta hai, isliye seedha reuse ho jaata hai. */}
      <BusRentalPopularCitiesGrid
        serviceSlug="equipment-rental"
        title="Equipment Rental in Available Cities"
      />

      {/* FAQs */}
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
              Equipment Rental <span className="text-primary">FAQs</span>
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Common questions about renting construction equipment in India
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-3">
            {EQUIPMENT_FAQS.map((faq, idx) => (
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
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Equipment Rental by City</h2>
            <p className="text-gray-500">Jump straight to a city&apos;s dedicated page</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-5xl mx-auto mb-8">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/equipment-rental/${city.slug}`}
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
              { href: '/jcb-on-rent', label: 'JCB on Rent', icon: HardHat },
              { href: '/crane-on-rent', label: 'Crane on Rent', icon: Wrench },
              { href: '/transporter', label: 'Truck & Transport', icon: Truck },
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
    </div>
  );
}
