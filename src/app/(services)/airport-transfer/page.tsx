import React from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { SimpleServiceHero } from '@/components/services/SimpleServiceHero';
import { AirportRoutesGrid } from '@/components/services/AirportRoutesGrid';
import { DynamicServicePage } from '@/components/services/DynamicServicePage';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Airport Transfer - Cab Service Starting @₹499 | TransRentals'),
  description:
    formatPriceHighlight('Book airport transfer cab service across India. Airport pickup & drop service. Professional drivers, all inclusive pricing. 500+ airport routes available.'),
  keywords: [
    'airport transfer',
    'airport taxi',
    'airport cab',
    'airport pickup',
    'airport drop',
    'airport to city cab',
    'delhi airport taxi',
  ],
  openGraph: {
    title: formatPriceHighlight('Airport Transfer - Cab Service Starting @₹499 | TransRentals'),
    description: formatPriceHighlight('Book airport transfer service across India. Airport pickup & drop available.'),
    type: 'website',
    url: 'https://transrentals.in/airport-transfer',
    images: [
      {
        url: 'https://transrentals.in/images/og/airport-transfer.jpg',
        width: 1200,
        height: 630,
        alt: 'Airport Transfer Service - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: formatPriceHighlight('Airport Transfer - Cab Service Starting @₹499 | TransRentals'),
    description: formatPriceHighlight('Book airport transfer service across India.'),
    images: ['https://transrentals.in/images/og/airport-transfer.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/airport-transfer',
  },
};

const fallbackContent = {
  hero: {
    title: 'Airport Transfer Service',
    subtitle: 'Book airport pickup & drop across 50+ airports in India - Professional drivers, all inclusive pricing',
    backgroundImage: '',
    ctaText: 'Book Now',
    ctaLink: '#routes',
    overlayOpacity: 50,
  },
  introText: 'TransRentals offers the best airport transfer service across India. Travel from airport to city or city to airport with professional drivers. Transparent pricing with no hidden charges.',
  features: [
    { id: '1', icon: 'shield', title: '45 Min Free Waiting', description: 'Free waiting time at airport for flight delays.' },
    { id: '2', icon: 'credit-card', title: 'Fixed Pricing', description: 'Transparent pricing starting at just ₹499 with no hidden charges.' },
    { id: '3', icon: 'headphones', title: '24/7 Support', description: 'Round the clock customer support and assistance.' },
    { id: '4', icon: 'map-pin', title: '50+ Airports', description: 'Wide network covering major airports across India.' },
    { id: '5', icon: 'car', title: 'All Car Types', description: 'Sedans, SUVs, and premium cars available.' },
    { id: '6', icon: 'clock', title: 'On-Time Pickup', description: 'Guaranteed on-time pickup and drop service.' },
  ],
  featuresTitle: 'Why Choose Our Airport Transfer Service',
  featuresVisible: true,
  howItWorks: [
    { id: '1', stepNumber: 1, icon: 'map-pin', title: 'Select Route', description: 'Choose your airport and destination' },
    { id: '2', stepNumber: 2, icon: 'calendar', title: 'Pick Date & Time', description: 'Select your pickup date and time' },
    { id: '3', stepNumber: 3, icon: 'car', title: 'Choose Vehicle', description: 'Select from available car options' },
    { id: '4', stepNumber: 4, icon: 'check', title: 'Confirm Booking', description: 'Get instant confirmation and ride' },
  ],
  howItWorksTitle: 'How to Book Airport Transfer',
  howItWorksVisible: true,
  testimonials: [],
  testimonialsTitle: 'What Our Customers Say',
  testimonialsVisible: false,
  faqs: [
    { id: '1', question: 'What is airport transfer service?', answer: 'Airport transfer service provides cab service from airport to city or city to airport with professional drivers and fixed pricing.' },
    { id: '2', question: 'How much waiting time is included?', answer: '45 minutes of free waiting time is included for flight delays. Additional charges apply after that.' },
    { id: '3', question: 'Are drivers verified?', answer: 'Yes, all our drivers are verified, experienced, and trained for airport transfers.' },
    { id: '4', question: 'Can I cancel my booking?', answer: 'Yes, you can cancel your booking. Cancellation charges may apply based on the time of cancellation.' },
    { id: '5', question: 'What vehicles are available?', answer: 'We offer sedans, SUVs, and premium cars for airport transfers. You can choose based on your budget and luggage requirements.' },
    { id: '6', question: 'Is advance booking required?', answer: 'We recommend booking at least 3 hours in advance for better availability. Last-minute bookings are subject to availability.' },
  ],
  faqsTitle: 'Frequently Asked Questions',
  faqsVisible: true,
  gallery: [],
  galleryTitle: 'Our Fleet',
  galleryVisible: false,
  customSections: [],
  ctaSection: {
    title: 'Ready to Travel?',
    subtitle: 'Book your airport transfer today and enjoy hassle-free travel.',
    buttonText: 'View Routes',
    buttonLink: '#routes',
    visible: true,
  },
};

// Get popular airport routes from database
async function getPopularRoutes() {
  try {
    const routes = await prisma.chauffeur_route_packages.findMany({
      where: {
        isActive: true,
        isPopular: true,
        OR: [
          {
            locations_chauffeur_route_packages_fromLocationIdTolocations: {
              type: 'AIRPORT',
            },
          },
          {
            locations_chauffeur_route_packages_toLocationIdTolocations: {
              type: 'AIRPORT',
            },
          },
        ],
      },
      include: {
        locations_chauffeur_route_packages_fromLocationIdTolocations: {
          select: { id: true, name: true, slug: true, type: true, code: true },
        },
        locations_chauffeur_route_packages_toLocationIdTolocations: {
          select: { id: true, name: true, slug: true, type: true, code: true },
        },
      },
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
        // Determine if it's airport pickup or drop
        const isAirportPickup = fromLocation.type === 'AIRPORT';

        routeMap.set(routeKey, {
          fromCity: fromLocation.name,
          fromSlug: fromLocation.slug,
          fromCode: fromLocation.code,
          toCity: toLocation.name,
          toSlug: toLocation.slug,
          toCode: toLocation.code,
          distance: route.estimatedKm,
          time: route.estimatedDuration,
          price: route.basePrice,
          isAirportPickup,
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
    console.error('Error fetching popular airport routes:', error);
    return [];
  }
}

export default async function AirportTransferPage() {
  const popularRoutes = await getPopularRoutes();

  return (
    <>
      {/* Simple Hero */}
      <SimpleServiceHero
        badge="Airport Transfer Service"
        title="Airport Pickup & Drop"
        titleHighlight="Starting @₹499"
        description="Travel from airport to city or city to airport with professional drivers. Fixed pricing, 45 min free waiting time across 50+ airports in India."
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: '45 Min Free Wait', color: 'text-blue-600' },
          { icon: 'zap', text: 'On-Time Pickup', color: 'text-green-600' },
        ]}
        stats={[
          { value: '50+', label: 'Airports Covered' },
          { value: '500+', label: 'Routes Available' },
          { value: '100K+', label: 'Happy Customers' },
        ]}
        gradientFrom="blue-50"
        gradientTo="indigo-50"
        gradientAccent="from-blue-600 to-indigo-600"
      />

      {/* Popular Routes from Database */}
      {popularRoutes.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Popular Airport Transfer Routes
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Explore our most booked airport routes with transparent pricing
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularRoutes.map((route, index) => (
                <a
                  key={index}
                  href={`/airport-transfer/${route.fromSlug}-to-${route.toSlug}`}
                  className="group bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 hover:shadow-xl hover:border-blue-400 transition-all"
                >
                  {/* Route Direction Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${route.isAirportPickup
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                      }`}>
                      {route.isAirportPickup ? '✈️ Airport Pickup' : '🚗 Airport Drop'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">From</p>
                      <p className="text-lg font-bold text-gray-900">
                        {route.fromCode ? `${route.fromCode}` : route.fromCity}
                      </p>
                      <p className="text-xs text-gray-600">{route.fromCity}</p>
                    </div>
                    <div className="text-blue-600">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">To</p>
                      <p className="text-lg font-bold text-gray-900">
                        {route.toCode ? `${route.toCode}` : route.toCity}
                      </p>
                      <p className="text-xs text-gray-600">{route.toCity}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-blue-200">
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
                      <p className="text-xl font-bold text-blue-600">₹{route.price}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
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
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition"
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
        <AirportRoutesGrid
          title="All Airport Transfer Routes"
          showSearch={true}
        />
      </div>

      {/* Dynamic Content (Features, How It Works, FAQs, etc.) */}
      <DynamicServicePage
        slug="airport-transfer"
        fallbackContent={fallbackContent}
      />
    </>
  );
}
