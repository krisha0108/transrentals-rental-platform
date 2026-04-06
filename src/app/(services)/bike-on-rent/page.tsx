import React from 'react';
import type { Metadata } from 'next';
import { DynamicServicePage } from '@/components/services/DynamicServicePage';
import { BikeTypesCards } from '@/components/services/BikeTypesCards';
import { BikeFleetShowcase } from '@/components/services/BikeFleetShowcase';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { SimpleServiceHero } from '@/components/services/SimpleServiceHero';
import { ServiceLocationsGrid } from '@/components/services/ServiceLocationsGrid';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Bike on Rent - Rent Bikes Starting @₹399/Day | TransRentals'),
  description:
    formatPriceHighlight('Rent bikes across 150+ cities in India. Choose from Royal Enfield, KTM, Honda, Yamaha & more. Best prices guaranteed. Book your bike rental now!'),
  keywords: [
    'bike on rent',
    'bike rental',
    'rent a bike',
    'bike rental near me',
    'royal enfield on rent',
    'ktm duke rental',
    'bike hire india',
  ],
  openGraph: {
    title: formatPriceHighlight('Bike on Rent - Starting @₹399/Day | TransRentals'),
    description: formatPriceHighlight('Rent bikes across 150+ cities in India. Royal Enfield, KTM, Honda & more.'),
    type: 'website',
    url: 'https://transrentals.in/bike-on-rent',
    images: [
      {
        url: 'https://transrentals.in/images/og/bike-rental.jpg',
        width: 1200,
        height: 630,
        alt: 'Bike Rental Services - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: formatPriceHighlight('Bike on Rent - Starting @₹399/Day | TransRentals'),
    description: formatPriceHighlight('Rent bikes across 150+ cities in India. Royal Enfield, KTM, Honda & more.'),
    images: ['https://transrentals.in/images/og/bike-rental.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/bike-on-rent',
  },
};

const fallbackContent = {
  hero: {
    title: 'Bike Rental Services',
    subtitle: 'Rent bikes and scooters across 150+ Indian cities - Royal Enfield, KTM, Honda & more',
    backgroundImage: '',
    ctaText: 'Rent Now',
    ctaLink: '#locations',
    overlayOpacity: 50,
  },
  introText: 'TransRentals offers the best bike rental services across India. Whether you need a scooter for daily commute, a Royal Enfield for a road trip, or a sports bike for the thrill, we have you covered with verified vendors and competitive prices.',
  features: [
    { id: '1', icon: 'shield', title: 'Verified Bikes', description: 'All bikes are thoroughly inspected and maintained for your safety.' },
    { id: '2', icon: 'credit-card', title: 'Best Prices', description: 'Compare prices from multiple vendors starting at just ₹399/day.' },
    { id: '3', icon: 'headphones', title: '24/7 Support', description: 'Roadside assistance and customer support available round the clock.' },
    { id: '4', icon: 'map-pin', title: '150+ Cities', description: 'Wide network of bike rental partners across major Indian cities.' },
    { id: '5', icon: 'car', title: 'All Bike Types', description: 'From scooters to superbikes - find the perfect ride for your needs.' },
    { id: '6', icon: 'clock', title: 'Flexible Rentals', description: 'Hourly, daily, weekly, or monthly rentals available.' },
  ],
  featuresTitle: 'Why Rent a Bike from TransRentals',
  featuresVisible: true,
  howItWorks: [
    { id: '1', stepNumber: 1, icon: 'map-pin', title: 'Select City', description: 'Choose your pickup city and location' },
    { id: '2', stepNumber: 2, icon: 'car', title: 'Pick Your Bike', description: 'Browse available bikes and select one' },
    { id: '3', stepNumber: 3, icon: 'calendar', title: 'Book Online', description: 'Complete booking with secure payment' },
    { id: '4', stepNumber: 4, icon: 'key', title: 'Ride Away', description: 'Pick up your bike and enjoy the ride' },
  ],
  howItWorksTitle: 'How It Works',
  howItWorksVisible: true,
  testimonials: [],
  testimonialsTitle: 'What Our Riders Say',
  testimonialsVisible: false,
  faqs: [
    { id: '1', question: 'What documents are required for bike rental?', answer: 'You need a valid driving license (with MCWG endorsement for bikes above 50cc), government ID proof (Aadhaar/Passport), and a security deposit.' },
    { id: '2', question: 'Is helmet included with the rental?', answer: 'Yes, helmets are provided free of charge with every bike rental. We recommend using them for your safety.' },
    { id: '3', question: 'What is the minimum age for bike rental?', answer: 'You must be at least 18 years old with a valid driving license to rent a bike.' },
    { id: '4', question: 'Can I take the bike to another city?', answer: 'Inter-city travel is allowed with prior approval. Additional charges may apply for one-way trips.' },
    { id: '5', question: 'What if the bike breaks down during my rental?', answer: 'We provide 24/7 roadside assistance. Contact our support and we\'ll arrange for help or a replacement bike.' },
  ],
  faqsTitle: 'Frequently Asked Questions',
  faqsVisible: true,
  gallery: [],
  galleryTitle: 'Our Fleet',
  galleryVisible: false,
  customSections: [],
  ctaSection: {
    title: 'Ready to Ride?',
    subtitle: 'Book your bike rental today and explore India on two wheels.',
    buttonText: 'Find Bikes Near You',
    buttonLink: '#locations',
    visible: true,
  },
};

// Schema data for structured markup
const schemaFaqs = [
  { question: 'What documents are required for bike rental?', answer: 'You need a valid driving license (with MCWG endorsement for bikes above 50cc), government ID proof (Aadhaar/Passport), and a security deposit.' },
  { question: 'Is helmet included with the rental?', answer: 'Yes, helmets are provided free of charge with every bike rental. We recommend using them for your safety.' },
  { question: 'What is the minimum age for bike rental?', answer: 'You must be at least 18 years old with a valid driving license to rent a bike.' },
  { question: 'Can I take the bike to another city?', answer: 'Inter-city travel is allowed with prior approval. Additional charges may apply for one-way trips.' },
  { question: 'What if the bike breaks down during my rental?', answer: 'We provide 24/7 roadside assistance. Contact our support and we will arrange for help or a replacement bike.' },
];

const schemaVehicles = [
  { name: 'Royal Enfield Classic 350', brand: 'Royal Enfield', price: 599, image: 'https://transrentals.in/images/bikes/classic-350.jpg' },
  { name: 'Royal Enfield Himalayan', brand: 'Royal Enfield', price: 699, image: 'https://transrentals.in/images/bikes/himalayan.jpg' },
  { name: 'Honda Activa 6G', brand: 'Honda', price: 299, image: 'https://transrentals.in/images/bikes/activa-6g.jpg' },
  { name: 'KTM Duke 390', brand: 'KTM', price: 799, image: 'https://transrentals.in/images/bikes/duke-390.jpg' },
  { name: 'TVS Jupiter', brand: 'TVS', price: 299, image: 'https://transrentals.in/images/bikes/jupiter.jpg' },
];

export default function BikeRentalPage() {
  return (
    <>
      {/* Schema Markup for SEO */}
      <BikeServiceSchema
        serviceName="Bike on Rent"
        serviceSlug="bike-on-rent"
        description="Rent bikes across 150+ cities in India. Choose from Royal Enfield, KTM, Honda, Yamaha & more. Best prices guaranteed."
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 299, max: 1499 }}
        rating={4.6}
        reviewCount={2850}
      />

      {/* Hero Section */}
      <SimpleServiceHero
        badge="Bike Rental Services"
        title="Rent Bikes"
        titleHighlight="Starting @₹399/Day"
        description="Choose from Royal Enfield, KTM, Honda, Yamaha & more across 150+ cities. Book now!"
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Verified Vendors', color: 'text-blue-600' },
          { icon: 'zap', text: 'Quick Booking', color: 'text-green-600' },
        ]}
        gradientFrom="blue-50"
        gradientTo="green-50"
      />

      {/* Fleet Display from Database */}
      <ServiceFleetDisplay
        serviceSlug="bike-on-rent"
        title="Our Bike Fleet"
        showCategories={true}
        limit={12}
        priceUnit="/day"
      />

      {/* Locations from Database */}
      <ServiceLocationsGrid
        serviceSlug="bike-on-rent"
        title="Bike Rental in Popular Cities"
        startingPrice="₹399"
        priceUnit="/day"
      />

      <DynamicServicePage
        slug="bike-on-rent"
        fallbackContent={fallbackContent}
        hideHero
      >
        <BikeTypesCards />
        <BikeFleetShowcase />
      </DynamicServicePage>
    </>
  );
}
