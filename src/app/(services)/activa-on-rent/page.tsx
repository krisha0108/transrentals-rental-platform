import React from 'react';
import type { Metadata } from 'next';
import { MessageCircleQuestion, Plus } from 'lucide-react';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { BikeHeroWithLocation } from '@/components/bike/BikeHeroWithLocation';
import { BikeServiceSchema, HowToSchema } from '@/components/seo/schemas';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Activa on Rent - Rent Activa & Scooty Starting @₹299/Day | TransRentals'),
  description:
    formatPriceHighlight('Rent Honda Activa, TVS Jupiter, Suzuki Access & other scooters across 500+ cities in India. Easy to ride, fuel efficient. Best prices guaranteed. Book your scooty rental now!'),
  keywords: [
    'activa on rent',
    'scooty on rent',
    'activa rental',
    'rent activa',
    'scooty rental',
    'scooter on rent',
    'honda activa rental',
    'activa hire',
    'tvs jupiter on rent',
    'scooter rental near me',
  ],
  openGraph: {
    title: formatPriceHighlight('Activa on Rent - Scooty Rental Starting @₹299/Day | TransRentals'),
    description: formatPriceHighlight('Rent Honda Activa, TVS Jupiter & scooters across 500+ cities. Easy to ride, fuel efficient.'),
    type: 'website',
    url: 'https://transrentals.in/activa-on-rent',
    images: [
      {
        url: 'https://transrentals.in/images/og/activa-rental.jpg',
        width: 1200,
        height: 630,
        alt: 'Activa & Scooty Rental - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: formatPriceHighlight('Activa on Rent - Starting @₹299/Day | TransRentals'),
    description: formatPriceHighlight('Rent scooters across 500+ cities in India. Easy to ride, fuel efficient.'),
    images: ['https://transrentals.in/images/og/activa-rental.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/activa-on-rent',
  },
};

// Schema data
const schemaFaqs = [
  { question: 'What is the minimum age to rent an Activa?', answer: 'You must be at least 18 years old with a valid driving license to rent an Activa or any scooter.' },
  { question: 'Do I need a gear license for Activa?', answer: 'No, Activa and scooters are automatic vehicles. A non-gear (scooter) license is sufficient.' },
  { question: 'What is the mileage of Honda Activa?', answer: 'Honda Activa gives approximately 50-60 km per liter, making it very fuel efficient for daily use.' },
  { question: 'Is helmet included with Activa rental?', answer: 'Yes, helmets are provided free of charge with every Activa and scooter rental.' },
  { question: 'Can I rent Activa for monthly basis?', answer: 'Yes, we offer monthly rental packages for Activa starting from ₹4,999/month with better rates for longer durations.' },
];

const schemaVehicles = [
  { name: 'Honda Activa 6G', brand: 'Honda', price: 299, image: 'https://transrentals.in/images/scooters/activa-6g.jpg' },
  { name: 'TVS Jupiter', brand: 'TVS', price: 299, image: 'https://transrentals.in/images/scooters/jupiter.jpg' },
  { name: 'Suzuki Access 125', brand: 'Suzuki', price: 349, image: 'https://transrentals.in/images/scooters/access-125.jpg' },
  { name: 'Honda Dio', brand: 'Honda', price: 299, image: 'https://transrentals.in/images/scooters/dio.jpg' },
  { name: 'TVS Ntorq 125', brand: 'TVS', price: 399, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
];

export default function ActivaOnRentPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent an Activa or Scooty on TransRentals"
        description="Book Honda Activa, TVS Jupiter, or any scooty rental in 4 simple steps."
        totalTime="PT8M"
        steps={[
          { name: 'Select City & Rental Period', text: 'Enter your city and choose rental duration — 1 day, weekly, or monthly scooty subscription.' },
          { name: 'Choose Scooter Model', text: 'Pick from Honda Activa, TVS Jupiter, Suzuki Access, or Yamaha Fascino based on availability and preference.' },
          { name: 'Check Pricing & Terms', text: 'Review daily or monthly rate, security deposit amount, fuel policy (self-fuel), and helmet availability.' },
          { name: 'Submit Documents & Pick Up', text: 'Upload driving licence and ID proof. Pay deposit and ride away from the vendor pickup point.' },
        ]}
      />
      {/* Schema Markup for SEO */}
      <BikeServiceSchema
        serviceName="Activa on Rent"
        serviceSlug="activa-on-rent"
        description="Rent Honda Activa, TVS Jupiter & scooters across 500+ cities in India. Easy to ride, fuel efficient. Best prices starting @₹299/day."
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 299, max: 499 }}
        rating={4.7}
        reviewCount={1890}
      />
      <div className="flex flex-col">
        <BikeHeroWithLocation />

        <StaticServicePopularCitiesGrid serviceSlug="activa-on-rent" title="Activa Rental in Available Cities" />

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
          <div className="container-custom relative">
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                GOOD TO KNOW
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </span>
              <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
                Activa Rental <span className="text-emerald-600">FAQs</span>
              </h2>
            </div>

            <div className="max-w-5xl mx-auto space-y-3">
              {schemaFaqs.map((faq, idx) => (
                <details
                  key={idx}
                  open={idx === 0}
                  className="group rounded-2xl bg-white border border-gray-100 shadow-sm open:border-emerald-200 open:shadow-md transition-all"
                >
                  <summary className="flex items-center gap-4 px-4 sm:px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 grid place-items-center">
                      <MessageCircleQuestion className="w-[18px] h-[18px] text-emerald-600" />
                    </span>
                    <h3 className="flex-1 font-bold text-[15px] leading-snug text-gray-900">
                      {faq.question}
                    </h3>
                    <span className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 text-gray-500 grid place-items-center transition-all duration-200 group-open:rotate-45 group-open:bg-emerald-600 group-open:text-white">
                      <Plus className="w-4 h-4" />
                    </span>
                  </summary>
                  <p className="px-4 sm:px-5 pb-5 sm:pl-[4.25rem] text-[14px] leading-relaxed text-gray-500">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
