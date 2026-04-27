import React from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { AirportRoutesGrid } from '@/components/services/AirportRoutesGrid';
import Link from 'next/link';
import { Plane, IndianRupee, ArrowRight, CheckCircle2 } from 'lucide-react';
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';

export const metadata: Metadata = {
  title: 'Airport Transfer - Cab Service Starting @₹499 | TransRentals',
  description:
    'Book airport transfer cab service across India. Airport pickup & drop service. Professional drivers, all inclusive pricing. 500+ airport routes available.',
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
    title: 'Airport Transfer - Cab Service Starting @₹499 | TransRentals',
    description: 'Book airport transfer service across India. Airport pickup & drop available.',
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
    title: 'Airport Transfer - Cab Service Starting @₹499 | TransRentals',
    description: 'Book airport transfer service across India.',
    images: ['https://transrentals.in/images/og/airport-transfer.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/airport-transfer',
  },
};

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

    const routeMap = new Map();

    routes.forEach((route) => {
      const fromLocation = route.locations_chauffeur_route_packages_fromLocationIdTolocations;
      const toLocation = route.locations_chauffeur_route_packages_toLocationIdTolocations;

      if (!fromLocation || !toLocation) return;

      const routeKey = `${fromLocation.slug}-to-${toLocation.slug}`;

      if (!routeMap.has(routeKey)) {
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
      <CarRentalBookingHero
        serviceSlug="car-rental"
        serviceTitle="Airport Transfer"
        initialTripType="airport"
        hideTabs
        headingLine1="Airport Pickup & Drop"
        headingLine2="Starting @₹499"
        subheading="Fixed price airport transfers with 45 min free waiting. Professional meet & greet at 50+ airports."
      />

      {/* Why Choose Airport Transfer */}
      <section className="py-20 bg-white">
        <div className="container-custom max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-blue-600 font-semibold text-sm tracking-widest uppercase mb-3">Benefits</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Why Choose Our Airport Transfer Service?
            </h2>
            <div className="w-20 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '⏱️', title: '45 Min Free Waiting', desc: 'Free waiting time at airport for flight delays - no extra charge for late arrivals', color: 'blue' },
              { icon: '💰', title: 'Fixed Pricing', desc: 'Transparent fixed pricing with no surge or hidden charges, know your fare upfront', color: 'indigo' },
              { icon: '✈️', title: 'Flight Tracking', desc: 'We track your flight status and adjust pickup time automatically for delays', color: 'violet' },
              { icon: '👨‍✈️', title: 'Meet & Greet', desc: 'Driver meets you at arrival gate with name board for easy identification', color: 'blue' },
              { icon: '🚗', title: 'All Car Types', desc: 'Choose from Sedans, SUVs, Innova and premium cars based on luggage needs', color: 'indigo' },
              { icon: '📞', title: '24/7 Availability', desc: 'Round the clock service for early morning or late night flights', color: 'violet' },
            ].map((item) => (
              <div
                key={item.title}
                className="group relative bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color === 'blue' ? 'from-blue-400 to-blue-600' : item.color === 'indigo' ? 'from-indigo-400 to-indigo-600' : 'from-violet-400 to-violet-600'}`} />
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
              <p className="text-blue-600 font-semibold text-sm tracking-widest uppercase mb-3">Top Routes</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
                Popular Airport Transfer Routes
              </h2>
              <div className="w-20 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto mb-4" />
              <p className="text-gray-500 max-w-2xl mx-auto">
                Explore our most booked airport routes with fixed pricing
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
              {popularRoutes.map((route, index) => (
                <Link
                  key={index}
                  href={`/airport-transfer/${route.fromSlug}-to-${route.toSlug}`}
                  className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

                  <div className="relative z-10">
                    {/* Route Header */}
                    <div className="flex items-center justify-between mb-5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase px-3 py-1.5 rounded-full ${
                        route.isAirportPickup
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        <Plane className={`w-3.5 h-3.5 ${route.isAirportPickup ? '' : 'rotate-45'}`} />
                        {route.isAirportPickup ? 'Airport Pickup' : 'Airport Drop'}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    {/* Cities */}
                    <div className="mb-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-11 h-11 ${route.isAirportPickup ? 'bg-gradient-to-br from-blue-500 to-indigo-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'} rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg ${route.isAirportPickup ? 'shadow-blue-200' : 'shadow-emerald-200'}`}>
                          {route.isAirportPickup ? <Plane className="w-5 h-5" /> : 'A'}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-gray-900">{route.fromCode || route.fromCity}</p>
                          {route.fromCode && <p className="text-xs text-gray-400 font-medium">{route.fromCity}</p>}
                        </div>
                      </div>
                      {/* Connecting line */}
                      <div className="ml-5 border-l-2 border-dashed border-blue-200 h-3" />
                      <div className="flex items-center gap-3 mt-1">
                        <div className={`w-11 h-11 ${route.isAirportPickup ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'} rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg ${route.isAirportPickup ? 'shadow-emerald-200' : 'shadow-blue-200'}`}>
                          {route.isAirportPickup ? 'B' : <Plane className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-gray-900">{route.toCode || route.toCity}</p>
                          {route.toCode && <p className="text-xs text-gray-400 font-medium">{route.toCity}</p>}
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
                          <p className="text-xs text-gray-400 font-medium mb-0.5">Wait Time</p>
                          <p className="font-bold text-gray-900">45 Min Free</p>
                        </div>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white text-center shadow-lg shadow-blue-200/50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <IndianRupee className="w-5 h-5" />
                        <p className="text-3xl font-extrabold">{route.price.toLocaleString()}</p>
                      </div>
                      <p className="text-sm text-white/80">Fixed Fare - 45 min free waiting</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <a
                href="#all-routes"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 hover:scale-105"
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
        <AirportRoutesGrid
          title="All Airport Transfer Routes"
          showSearch={true}
        />
      </div>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
        <div className="container-custom max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-semibold text-sm tracking-widest uppercase mb-3">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              How Airport Transfer Booking Works
            </h2>
            <div className="w-20 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting arrows - desktop only */}
            <div className="hidden md:block absolute top-16 left-[33%] w-[2%] h-0.5 bg-gradient-to-r from-blue-300 to-indigo-300" />
            <div className="hidden md:block absolute top-16 right-[33%] w-[2%] h-0.5 bg-gradient-to-r from-indigo-300 to-violet-300" />

            {[
              { step: '01', title: 'Select Airport & Route', desc: 'Choose your airport and city destination for pickup or drop service', icon: '✈️', gradient: 'from-blue-500 to-blue-600' },
              { step: '02', title: 'Enter Flight Details', desc: 'Provide your flight number and arrival/departure time for live tracking', icon: '📋', gradient: 'from-indigo-500 to-indigo-600' },
              { step: '03', title: 'Choose Vehicle & Book', desc: 'Select from Sedan, SUV, or Premium car and complete booking instantly', icon: '✅', gradient: 'from-violet-500 to-violet-600' },
              { step: '04', title: 'Driver Assigned', desc: 'A verified driver is assigned — you receive name, photo, and car details via SMS', icon: '👨‍✈️', gradient: 'from-blue-500 to-indigo-500' },
              { step: '05', title: 'Meet at Terminal', desc: 'Driver waits at arrival gate with name board — 45 min free waiting included', icon: '🎫', gradient: 'from-indigo-500 to-violet-500' },
              { step: '06', title: 'Reach Safely', desc: 'Enjoy a comfortable ride to your hotel, home, or office with zero hassle', icon: '🎯', gradient: 'from-violet-500 to-blue-500' },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative bg-white rounded-3xl p-7 border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              >
                {/* Large watermark step number */}
                <span className="absolute -top-4 -right-3 text-[120px] font-black text-gray-50 leading-none select-none pointer-events-none group-hover:text-blue-50 transition-colors duration-500">
                  {item.step}
                </span>

                <div className="relative z-10">
                  {/* Icon circle */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-3xl mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    {item.icon}
                  </div>

                  {/* Step label */}
                  <p className="text-xs font-bold text-blue-500 tracking-widest uppercase mb-2">Step {item.step}</p>

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
            <p className="text-blue-600 font-semibold text-sm tracking-widest uppercase mb-3">Got Questions?</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <div className="w-20 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto" />
          </div>
          <div className="space-y-5">
            {[
              { q: 'What is airport transfer service?', a: 'Airport transfer service provides cab pickup from airport to city or drop from city to airport with professional drivers, fixed pricing, and 45 minutes of free waiting time for flight delays.' },
              { q: 'How much free waiting time is included?', a: '45 minutes of free waiting time is included from the scheduled pickup time. For airport pickups, the timer starts after your flight lands. Additional waiting beyond 45 minutes is charged at ₹2-3/min.' },
              { q: 'Do you track my flight?', a: 'Yes, we track your flight status automatically. If your flight is delayed, the driver will be informed and the pickup time is adjusted accordingly at no extra charge.' },
              { q: 'What is included in the fixed fare?', a: 'The fixed fare includes base fare, fuel charges, driver charges, 45 min free waiting, meet & greet at terminal, and GST. Toll and parking charges are extra as applicable.' },
              { q: 'Can I book for early morning or late night flights?', a: 'Yes, our airport transfer service is available 24/7. You can book for any flight time - early morning, late night, or any hour. Night charges may apply for pickups between 10 PM and 6 AM.' },
              { q: 'How do I find my driver at the airport?', a: 'Your driver will wait at the arrival gate holding a name board with your name. You will also receive the driver\'s name, photo, car number, and phone number via SMS after booking.' },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-blue-100 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-400 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
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
            name: 'Airport Transfer Service',
            description:
              'Book airport transfer cab service across India. Airport pickup & drop with professional drivers, fixed pricing, and 45 min free waiting time.',
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
              lowPrice: '499',
              highPrice: '5000',
            },
          }),
        }}
      />
    </>
  );
}
