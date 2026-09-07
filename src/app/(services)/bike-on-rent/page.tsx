import React from 'react';
import type { Metadata } from 'next';
import { DynamicServicePage } from '@/components/services/DynamicServicePage';
import { BikeTypesCards } from '@/components/services/BikeTypesCards';
import { BikeFleetShowcase } from '@/components/services/BikeFleetShowcase';
import { BikeServiceSchema, HowToSchema, ItemListSchema, BreadcrumbSchema } from '@/components/seo/schemas';
import { BikeSearchHero } from '@/components/bike/BikeSearchHero';
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
        url: 'https://transrentals.in/api/og?service=bike-on-rent',
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
    images: ['https://transrentals.in/api/og?service=bike-on-rent'],
  },
  alternates: {
    canonical: 'https://transrentals.in/bike-on-rent',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
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
    { id: '6', question: 'What is the rental cost for a Royal Enfield?', answer: 'Royal Enfield Classic 350 and Bullet 350 rent for ₹499–₹699/day. The Himalayan 411 is ₹699–₹899/day. For longer trips, weekly rates offer 20–30% savings over daily rates.' },
    { id: '7', question: 'Can I rent a bike in Goa without a driving license?', answer: 'No. A valid driving license with MCWG endorsement is legally required to ride any motorbike in India, including Goa. Riding without a license risks fines, accidents, and insurance complications. All TransRentals vendors require licence verification before handover.' },
    { id: '8', question: 'Is monthly bike rental available?', answer: 'Yes, monthly bike rentals are available in major cities like Bangalore, Hyderabad, Pune, and Delhi. Monthly plans start from ₹3,500/month for scooters and ₹7,000/month for Royal Enfield. Monthly plans save 40–50% vs daily rates and are popular with working professionals.' },
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
  { question: 'What is the rental cost for a Royal Enfield?', answer: 'Royal Enfield Classic 350 and Bullet 350 rent for ₹499–₹699/day. The Himalayan 411 is ₹699–₹899/day. Weekly rates offer 20–30% savings over daily rates.' },
  { question: 'Can I rent a bike in Goa without a driving license?', answer: 'No. A valid driving license with MCWG endorsement is legally required to ride any motorbike in India, including Goa. All TransRentals vendors require licence verification before handover.' },
  { question: 'Is monthly bike rental available?', answer: 'Yes, monthly bike rentals are available in major cities. Monthly plans start from ₹3,500/month for scooters and ₹7,000/month for Royal Enfield — saving 40–50% vs daily rates.' },
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
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://transrentals.in' },
        { name: 'Bike on Rent', url: 'https://transrentals.in/bike-on-rent' },
      ]} />
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
      <HowToSchema
        name="How to Rent a Bike on TransRentals"
        description="Book a bike rental in 4 simple steps on TransRentals across 150+ cities in India."
        totalTime="PT10M"
        steps={[
          { name: 'Select Your City', text: 'Choose your pickup city from 150+ available locations across India.' },
          { name: 'Pick Your Bike', text: 'Browse available bikes — Royal Enfield, KTM, Honda, Yamaha & more. Filter by type, price, and brand.' },
          { name: 'Book Online', text: 'Complete your booking with secure online payment. Instant confirmation.' },
          { name: 'Ride Away', text: 'Pick up your bike from the vendor location with your licence and ID proof. Enjoy your ride!' },
        ]}
      />

      {/* Hero Section */}
      {/* Same hero the city pages use — background image plus the search card.
          With no citySlug the pick-up field turns into a city chooser. */}
      <BikeSearchHero />

      {/* Fleet Display from Database */}
      <ServiceFleetDisplay
        serviceSlug="bike-on-rent"
        title="Our Bike Fleet"
        showCategories={true}
        limit={12}
        priceUnit="/day"
      />

      <ItemListSchema
        name="Bike Rental in Top Indian Cities"
        description="Rent bikes — Royal Enfield, KTM, Honda, Yamaha — across top cities in India."
        url="https://transrentals.in/bike-on-rent"
        items={[
          { name: 'Bike Rental in Goa', url: 'https://transrentals.in/bike-on-rent/goa', description: 'Rent bikes in Goa from ₹399/day. Royal Enfield, Activa, KTM available.' },
          { name: 'Bike Rental in Manali', url: 'https://transrentals.in/bike-on-rent/manali', description: 'Rent bikes in Manali for Leh-Ladakh road trips from ₹599/day.' },
          { name: 'Bike Rental in Delhi', url: 'https://transrentals.in/bike-on-rent/delhi', description: 'Rent bikes in Delhi from ₹399/day. Self-drive available.' },
          { name: 'Bike Rental in Bangalore', url: 'https://transrentals.in/bike-on-rent/bangalore', description: 'Rent bikes in Bangalore from ₹299/day. Daily & monthly rentals.' },
          { name: 'Bike Rental in Mumbai', url: 'https://transrentals.in/bike-on-rent/mumbai', description: 'Rent bikes in Mumbai from ₹399/day. Activa, Pulsar, Royal Enfield.' },
          { name: 'Bike Rental in Jaipur', url: 'https://transrentals.in/bike-on-rent/jaipur', description: 'Rent bikes in Jaipur from ₹349/day. Explore Rajasthan on two wheels.' },
          { name: 'Bike Rental in Leh', url: 'https://transrentals.in/bike-on-rent/leh', description: 'Rent bikes in Leh for Ladakh road trips. Royal Enfield from ₹999/day.' },
          { name: 'Bike Rental in Hyderabad', url: 'https://transrentals.in/bike-on-rent/hyderabad', description: 'Rent bikes in Hyderabad from ₹299/day.' },
          { name: 'Bike Rental in Chennai', url: 'https://transrentals.in/bike-on-rent/chennai', description: 'Rent bikes in Chennai from ₹299/day.' },
          { name: 'Bike Rental in Pune', url: 'https://transrentals.in/bike-on-rent/pune', description: 'Rent bikes in Pune from ₹349/day.' },
          { name: 'Bike Rental in Rishikesh', url: 'https://transrentals.in/bike-on-rent/rishikesh', description: 'Rent bikes in Rishikesh for Uttarakhand adventures from ₹499/day.' },
          { name: 'Bike Rental in Ooty', url: 'https://transrentals.in/bike-on-rent/ooty', description: 'Rent bikes in Ooty from ₹399/day.' },
        ]}
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
