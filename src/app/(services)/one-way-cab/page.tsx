import React from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { OneWayCabRoutesGrid } from '@/components/services/OneWayCabRoutesGrid';
import Link from 'next/link';
import { Car, Star, Shield, Clock, IndianRupee, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'One Way Cab - Drop Taxi Service Starting @₹9/km | TransRentals',
  description:
    'Book one way cab service across India. No return charges. Professional drivers, all inclusive pricing. Drop taxi service available in 500+ routes.',
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
    title: 'One Way Cab - Drop Taxi Service Starting @₹9/km | TransRentals',
    description: 'Book one way cab service across India. No return charges. Drop in different city.',
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
    title: 'One Way Cab - Drop Taxi Service Starting @₹9/km | TransRentals',
    description: 'Book one way cab service across India. No return charges.',
    images: ['https://transrentals.in/images/og/one-way-cab.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/one-way-cab',
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
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-700 text-white overflow-hidden">
        {/* Decorative Floating Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-300/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-3xl" />

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.07]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 backdrop-blur-md rounded-full text-sm font-medium mb-8 border border-white/20 shadow-lg shadow-emerald-900/20">
              <Car className="w-4 h-4" />
              One Way Cab Service
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight">
              Book One Way{' '}
              <span className="bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-300 bg-clip-text text-transparent">
                Drop Taxi
              </span>
            </h1>

            <p className="text-lg md:text-2xl mb-10 text-white/80 max-w-2xl mx-auto leading-relaxed">
              Pay Only One Side - No Return Charges Starting @₹9/km
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { icon: Star, label: '4.9/5 Rating' },
                { icon: Shield, label: 'No Return Charges' },
                { icon: MapPin, label: '500+ Routes' },
                { icon: IndianRupee, label: 'Starting @₹9/km' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 hover:bg-white/15 transition-all duration-300 hover:scale-105"
                >
                  <item.icon className="w-7 h-7 mx-auto mb-2.5 text-emerald-300" />
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
              ))}
            </div>

            <a
              href="#routes"
              className="inline-flex items-center gap-3 px-10 py-4 bg-white text-emerald-700 font-bold rounded-2xl hover:bg-emerald-50 transition-all duration-300 shadow-xl shadow-black/20 hover:shadow-2xl hover:scale-105 text-lg"
            >
              Explore Routes
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Why Choose One Way Cab */}
      <section className="py-20 bg-white">
        <div className="container-custom max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-emerald-600 font-semibold text-sm tracking-widest uppercase mb-3">Benefits</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Why Choose One Way Cab Service?
            </h2>
            <div className="w-20 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '🎯', title: 'No Return Charges', desc: 'Pay only for one side journey - no need to bear empty return km cost', color: 'emerald' },
              { icon: '💰', title: 'Best Prices', desc: 'Transparent pricing starting at just ₹9/km with no hidden charges', color: 'teal' },
              { icon: '🚗', title: 'All Car Types', desc: 'Choose from Sedans, SUVs, Innova and premium cars for your trip', color: 'cyan' },
              { icon: '👨‍✈️', title: 'Professional Drivers', desc: 'Verified, experienced drivers ensuring safe and comfortable travel', color: 'emerald' },
              { icon: '📱', title: 'Instant Booking', desc: 'Quick 2-minute booking process with instant confirmation', color: 'teal' },
              { icon: '📞', title: '24/7 Support', desc: 'Round the clock customer support and roadside assistance', color: 'cyan' },
            ].map((item) => (
              <div
                key={item.title}
                className="group relative bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color === 'emerald' ? 'from-emerald-400 to-emerald-600' : item.color === 'teal' ? 'from-teal-400 to-teal-600' : 'from-cyan-400 to-cyan-600'}`} />
                <div className="text-5xl mb-5 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes from Database */}
      {popularRoutes.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white" id="popular-routes">
          <div className="container-custom max-w-7xl">
            <div className="text-center mb-14">
              <p className="text-emerald-600 font-semibold text-sm tracking-widest uppercase mb-3">Top Routes</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
                Popular One Way Cab Routes
              </h2>
              <div className="w-20 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mx-auto mb-4" />
              <p className="text-gray-500 max-w-2xl mx-auto">
                Explore our most booked intercity routes with transparent pricing
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
              {popularRoutes.map((route, index) => (
                <Link
                  key={index}
                  href={`/one-way-cab/${route.fromSlug}-to-${route.toSlug}`}
                  className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

                  <div className="relative z-10">
                    {/* Route Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs font-bold tracking-wide uppercase">One Way</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    {/* Cities */}
                    <div className="mb-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-200">
                          A
                        </div>
                        <div>
                          <p className="font-bold text-lg text-gray-900">{route.fromCity}</p>
                          <p className="text-xs text-gray-400 font-medium">Pickup City</p>
                        </div>
                      </div>
                      {/* Connecting line */}
                      <div className="ml-5 border-l-2 border-dashed border-emerald-200 h-3" />
                      <div className="flex items-center gap-3 mt-1">
                        <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-teal-200">
                          B
                        </div>
                        <div>
                          <p className="font-bold text-lg text-gray-900">{route.toCity}</p>
                          <p className="text-xs text-gray-400 font-medium">Drop City</p>
                        </div>
                      </div>
                    </div>

                    {/* Route Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-gray-50 group-hover:bg-white rounded-xl p-3 text-center transition-colors">
                        <p className="text-xs text-gray-400 font-medium mb-0.5">Distance</p>
                        <p className="font-bold text-gray-900">{route.distance}km</p>
                      </div>
                      {route.time ? (
                        <div className="bg-gray-50 group-hover:bg-white rounded-xl p-3 text-center transition-colors">
                          <p className="text-xs text-gray-400 font-medium mb-0.5">Duration</p>
                          <p className="font-bold text-gray-900">{route.time}</p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 group-hover:bg-white rounded-xl p-3 text-center transition-colors">
                          <p className="text-xs text-gray-400 font-medium mb-0.5">Type</p>
                          <p className="font-bold text-gray-900">One Way</p>
                        </div>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-4 text-white text-center shadow-lg shadow-emerald-200/50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <IndianRupee className="w-5 h-5" />
                        <p className="text-3xl font-extrabold">{route.price.toLocaleString()}</p>
                      </div>
                      <p className="text-sm text-white/80">One Way Fare - No return charges</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <a
                href="#all-routes"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-10 py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-emerald-200/50 transition-all duration-300 hover:scale-105"
              >
                View All Routes
                <ArrowRight className="w-5 h-5" />
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

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
        <div className="container-custom max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-emerald-600 font-semibold text-sm tracking-widest uppercase mb-3">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              How One Way Cab Booking Works
            </h2>
            <div className="w-20 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mx-auto" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting arrows - desktop only */}
            <div className="hidden md:block absolute top-16 left-[33%] w-[2%] h-0.5 bg-gradient-to-r from-emerald-300 to-teal-300" />
            <div className="hidden md:block absolute top-16 right-[33%] w-[2%] h-0.5 bg-gradient-to-r from-teal-300 to-cyan-300" />

            {[
              { step: '01', title: 'Select Your Route', desc: 'Choose pickup and drop city from our 500+ available routes across India', icon: '🗺️', gradient: 'from-emerald-500 to-emerald-600' },
              { step: '02', title: 'Pick Date & Vehicle', desc: 'Select your travel date, pickup time, and car type — Sedan, SUV, or Innova', icon: '📅', gradient: 'from-teal-500 to-teal-600' },
              { step: '03', title: 'Book & Confirm', desc: 'Complete booking with advance payment and get instant confirmation on WhatsApp', icon: '✅', gradient: 'from-cyan-500 to-cyan-600' },
              { step: '04', title: 'Driver Assigned', desc: 'A verified, professional driver is assigned and details shared with you', icon: '👨‍✈️', gradient: 'from-emerald-500 to-teal-500' },
              { step: '05', title: 'Doorstep Pickup', desc: 'Driver arrives at your doorstep on time — no running around to find your cab', icon: '🚗', gradient: 'from-teal-500 to-cyan-500' },
              { step: '06', title: 'Reach & Pay', desc: 'Enjoy a comfortable journey, reach your destination, and pay the balance', icon: '🎯', gradient: 'from-cyan-500 to-emerald-500' },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative bg-white rounded-3xl p-7 border border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              >
                {/* Large watermark step number */}
                <span className="absolute -top-4 -right-3 text-[120px] font-black text-gray-50 leading-none select-none pointer-events-none group-hover:text-emerald-50 transition-colors duration-500">
                  {item.step}
                </span>

                <div className="relative z-10">
                  {/* Icon circle */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-3xl mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    {item.icon}
                  </div>

                  {/* Step label */}
                  <p className="text-xs font-bold text-emerald-500 tracking-widest uppercase mb-2">Step {item.step}</p>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{item.desc}</p>
                </div>

                {/* Bottom gradient accent on hover */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-white">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-14">
            <p className="text-emerald-600 font-semibold text-sm tracking-widest uppercase mb-3">Got Questions?</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <div className="w-20 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mx-auto" />
          </div>
          <div className="space-y-5">
            {[
              { q: 'What is one way cab service?', a: 'One way cab service allows you to travel from one city to another without paying return charges. You only pay for the distance traveled in one direction, making it significantly cheaper than round trip for one-way journeys.' },
              { q: 'How is the pricing calculated?', a: 'Pricing is based on the distance between cities and vehicle type. Our rates start at ₹9/km. The fare includes fuel, driver charges, and GST. Toll and parking charges are extra as applicable.' },
              { q: 'Are there any hidden charges?', a: 'No hidden charges. The price you see includes base fare, fuel, driver allowance, and GST. Only toll charges and parking fees (if any) are extra and paid as per actuals.' },
              { q: 'What vehicles are available?', a: 'We offer Sedans (Swift Dzire, Honda Amaze), SUVs (Ertiga, Innova Crysta), and Premium cars. Choose based on your group size, luggage, and comfort preferences.' },
              { q: 'Can I cancel or modify my booking?', a: 'Yes, you can cancel or modify your booking. Free cancellation is available up to 6 hours before the journey. Modifications to date/time are free of charge.' },
              { q: 'Is advance booking required?', a: 'We recommend booking at least 6 hours in advance for guaranteed availability. However, we also accept last-minute bookings subject to driver availability in your area.' },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-emerald-100 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-400 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">{faq.q}</h3>
                    <p className="text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'One Way Cab Service',
            description:
              'Book one way cab service across India. No return charges. Professional drivers, all inclusive pricing starting at ₹9/km.',
            provider: {
              '@type': 'Organization',
              name: 'TransRentals',
              url: 'https://transrentals.in',
            },
            areaServed: {
              '@type': 'Country',
              name: 'India',
            },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: '9',
              highPrice: '20',
              priceSuffix: '/km',
            },
          }),
        }}
      />
    </>
  );
}
