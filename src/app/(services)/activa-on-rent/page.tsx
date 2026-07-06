import React from 'react';
import type { Metadata } from 'next';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { FAQSection } from '@/components/services/FAQSection';
import { BikeHeroWithLocation } from '@/components/bike/BikeHeroWithLocation';
import { BikeServiceSchema, HowToSchema } from '@/components/seo/schemas';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Activa on Rent - Rent Activa & Scooty Starting @₹299/Day | TransRentals'),
  description:
    formatPriceHighlight('Rent Honda Activa, TVS Jupiter, Suzuki Access & other scooters across 150+ cities in India. Easy to ride, fuel efficient. Best prices guaranteed. Book your scooty rental now!'),
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
    description: formatPriceHighlight('Rent Honda Activa, TVS Jupiter & scooters across 150+ cities. Easy to ride, fuel efficient.'),
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
    description: formatPriceHighlight('Rent scooters across 150+ cities in India. Easy to ride, fuel efficient.'),
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
        description="Rent Honda Activa, TVS Jupiter & scooters across 150+ cities in India. Easy to ride, fuel efficient. Best prices starting @₹299/day."
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 299, max: 499 }}
        rating={4.7}
        reviewCount={1890}
      />
      <div className="flex flex-col">
        <BikeHeroWithLocation />

        <LocationsGrid service="activa-on-rent" />

        <FAQSection service="bike-on-rent" customFaqs={schemaFaqs} />

      </div>
    </>
  );
}
