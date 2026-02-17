import React from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { SimpleServiceHero } from '@/components/services/SimpleServiceHero';
import { OneWayCabRoutesGrid } from '@/components/services/OneWayCabRoutesGrid';
import { DynamicServicePage } from '@/components/services/DynamicServicePage';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('One Way Cab - Drop Taxi Service Starting @₹9/km | TransRentals'),
  description:
    formatPriceHighlight('Book one way cab service across India. No return charges. Professional drivers, all inclusive pricing. Drop taxi service available in 500+ routes.'),
  keywords: [
    'one way cab',
    'one way taxi',
    'drop taxi',
    'one side cab',
    'one way drop',
    'outstation drop taxi',
    'intercity cab',
  ],
  openGraph: {
    title: formatPriceHighlight('One Way Cab - Drop Taxi Service Starting @₹9/km | TransRentals'),
    description: formatPriceHighlight('Book one way cab service across India. No return charges. Drop in different city.'),
    type: 'website',
    url: 'https://transrentals.in/one-way-cab',
    images: [
      {
        url: 'https://transrentals.in/images/og/one-way-cab.jpg',
        width: 1200,
        height: 630,
        alt: 'One Way Cab Service - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: formatPriceHighlight('One Way Cab - Drop Taxi Service Starting @₹9/km | TransRentals'),
    description: formatPriceHighlight('Book one way cab service across India. No return charges.'),
    images: ['https://transrentals.in/images/og/one-way-cab.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/one-way-cab',
  },
};

const fallbackContent = {
  hero: {
    title: 'One Way Cab Service',
    subtitle: 'Book drop taxi across 500+ routes in India - No return charges, all inclusive pricing',
    backgroundImage: '',
    ctaText: 'Book Now',
    ctaLink: '#routes',
    overlayOpacity: 50,
  },
  introText: 'TransRentals offers the best one way cab service across India. Travel from one city to another without paying return charges. Our professional drivers ensure a safe and comfortable journey with transparent pricing.',
  features: [
    { id: '1', icon: 'shield', title: 'No Return Charges', description: 'Pay only for one side journey. Drop your destination without extra cost.' },
    { id: '2', icon: 'credit-card', title: 'Best Prices', description: 'Transparent pricing starting at just ₹9/km with no hidden charges.' },
    { id: '3', icon: 'headphones', title: '24/7 Support', description: 'Round the clock customer support and roadside assistance.' },
    { id: '4', icon: 'map-pin', title: '500+ Routes', description: 'Wide network covering major cities and towns across India.' },
    { id: '5', icon: 'car', title: 'All Car Types', description: 'Sedans, SUVs, and premium cars available for your journey.' },
    { id: '6', icon: 'clock', title: 'Instant Booking', description: 'Quick and easy booking process with instant confirmation.' },
  ],
  featuresTitle: 'Why Choose Our One Way Cab Service',
  featuresVisible: true,
  howItWorks: [
    { id: '1', stepNumber: 1, icon: 'map-pin', title: 'Select Route', description: 'Choose your pickup and drop cities' },
    { id: '2', stepNumber: 2, icon: 'calendar', title: 'Pick Date & Time', description: 'Select your journey date and time' },
    { id: '3', stepNumber: 3, icon: 'car', title: 'Choose Vehicle', description: 'Select from available car options' },
    { id: '4', stepNumber: 4, icon: 'check', title: 'Confirm Booking', description: 'Get instant confirmation and ride' },
  ],
  howItWorksTitle: 'How to Book One Way Cab',
  howItWorksVisible: true,
  testimonials: [],
  testimonialsTitle: 'What Our Customers Say',
  testimonialsVisible: false,
  faqs: [
    { id: '1', question: 'What is one way cab service?', answer: 'One way cab service allows you to travel from one city to another without paying return charges. You only pay for the distance traveled in one direction.' },
    { id: '2', question: 'How is pricing calculated?', answer: 'Pricing is based on the distance between cities, vehicle type, and time of travel. We offer transparent pricing with no hidden charges.' },
    { id: '3', question: 'Are drivers verified?', answer: 'Yes, all our drivers are verified, experienced, and trained to provide safe and comfortable journeys.' },
    { id: '4', question: 'Can I cancel my booking?', answer: 'Yes, you can cancel your booking. Cancellation charges may apply based on the time of cancellation before the journey.' },
    { id: '5', question: 'What vehicles are available?', answer: 'We offer sedans, SUVs, and premium cars for one way journeys. You can choose based on your budget and comfort preferences.' },
    { id: '6', question: 'Is advance booking required?', answer: 'We recommend booking at least 6 hours in advance for better availability. However, we also accept last-minute bookings subject to availability.' },
  ],
  faqsTitle: 'Frequently Asked Questions',
  faqsVisible: true,
  gallery: [],
  galleryTitle: 'Our Fleet',
  galleryVisible: false,
  customSections: [],
  ctaSection: {
    title: 'Ready to Travel?',
    subtitle: 'Book your one way cab today and enjoy hassle-free intercity travel.',
    buttonText: 'View Routes',
    buttonLink: '#routes',
    visible: true,
  },
};

async function getPopularRoutes() {
  try {
    const routes = await prisma.chauffeur_route_packages.findMany({
      where: {
        isActive: true,
        isPopular: true,
      },
      include: {
        locations_chauffeur_route_packages_fromLocationIdTolocations: {
          select: { id: true, name: true, slug: true, type: true },
        },
        locations_chauffeur_route_packages_toLocationIdTolocations: {
          select: { id: true, name: true, slug: true, type: true },
        },
      },
      distinct: ['fromLocationId', 'toLocationId'],
      orderBy: [{ isPopular: 'desc' }, { displayOrder: 'asc' }],
      take: 12,
    });

    // Group by route and get min price
    const routeMap = new Map();

    routes.forEach((route) => {
      const fromLocation = route.locations_chauffeur_route_packages_fromLocationIdTolocations;
      const toLocation = route.locations_chauffeur_route_packages_toLocationIdTolocations;

      if (!fromLocation || !toLocation) return;

      const routeKey = `${fromLocation.slug}-to-${toLocation.slug}`;

      if (!routeMap.has(routeKey)) {
        routeMap.set(routeKey, {
          fromCity: fromLocation.name,
          fromSlug: fromLocation.slug,
          toCity: toLocation.name,
          toSlug: toLocation.slug,
          distance: route.estimatedKm,
          time: route.estimatedDuration,
          price: route.basePrice,
        });
      } else {
        const existing = routeMap.get(routeKey);
        if (route.basePrice < existing.price) {
          existing.price = route.basePrice;
        }
      }
    });

    return Array.from(routeMap.values());
  } catch (error) {
    console.error('Error fetching popular routes:', error);
    return [];
  }
}

export default async function OneWayCabPage() {
  const popularRoutes = await getPopularRoutes();

  return (
    <>
      {/* Simple Hero */}
      <SimpleServiceHero
        badge="One Way Cab Service"
        title="One Way Drop Taxi"
        titleHighlight="Starting @₹9/km"
        description="Travel intercity with no return charges. Professional drivers, all inclusive pricing across 500+ routes in India."
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'No Return Charges', color: 'text-blue-600' },
          { icon: 'zap', text: 'Instant Booking', color: 'text-green-600' },
        ]}
        stats={[
          { value: '500+', label: 'Routes Available' },
          { value: '250+', label: 'Cities Covered' },
          { value: '75K+', label: 'Happy Customers' },
        ]}
        gradientFrom="emerald-50"
        gradientTo="teal-50"
        gradientAccent="from-emerald-600 to-teal-600"
      />

      {/* Popular Routes from Database */}
      {popularRoutes.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Popular One Way Cab Routes
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Explore our most booked intercity routes with transparent pricing
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularRoutes.map((route, index) => (
                <a
                  key={index}
                  href={`/one-way-cab/${route.fromSlug}-to-${route.toSlug}`}
                  className="group bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 hover:shadow-xl hover:border-emerald-400 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">From</p>
                      <p className="text-xl font-bold text-gray-900">{route.fromCity}</p>
                    </div>
                    <div className="text-emerald-600">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">To</p>
                      <p className="text-xl font-bold text-gray-900">{route.toCity}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-emerald-200">
                    <div>
                      <p className="text-sm text-gray-500">Distance</p>
                      <p className="font-semibold text-gray-700">{route.distance} km</p>
                    </div>
                    {route.time && (
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-semibold text-gray-700">{route.time}</p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Starting from</p>
                      <p className="text-xl font-bold text-emerald-600">₹{route.price}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 font-semibold group-hover:gap-3 transition-all">
                    Book Now
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>

            <div className="text-center mt-10">
              <a
                href="#all-routes"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-emerald-700 transition"
              >
                View All Routes
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* All Routes from Database */}
      <div id="all-routes">
        <OneWayCabRoutesGrid
          title="All One Way Cab Routes"
          showSearch={true}
        />
      </div>

      {/* Dynamic Content (Features, How It Works, FAQs, etc.) */}
      <DynamicServicePage
        slug="one-way-cab"
        fallbackContent={fallbackContent}
      />
    </>
  );
}
