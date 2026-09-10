import React from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { OneWayCabRoutesGrid } from '@/components/services/OneWayCabRoutesGrid';
import Link from 'next/link';
import {
  Car, Star, Shield, Clock, IndianRupee, MapPin, ArrowRight, CheckCircle2,
  Target, Wallet, UserCheck, Smartphone, Phone, Map, Calendar,
  MessageCircleQuestion, Plus,
} from 'lucide-react';
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';
import { HowToSchema } from '@/components/seo/schemas';

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

const WHY_CHOOSE = [
  { icon: Target, anim: 'pulse', title: 'No Return Charges', desc: 'Pay only for one side journey - no need to bear empty return km cost' },
  { icon: Wallet, anim: 'lift', title: 'Best Prices', desc: 'Transparent pricing starting at just ₹9/km with no hidden charges' },
  { icon: Car, anim: 'drive', title: 'All Car Types', desc: 'Choose from Sedans, SUVs, Innova and premium cars for your trip' },
  { icon: UserCheck, anim: 'lift', title: 'Professional Drivers', desc: 'Verified, experienced drivers ensuring safe and comfortable travel' },
  { icon: Smartphone, anim: 'pulse', title: 'Instant Booking', desc: 'Quick 2-minute booking process with instant confirmation' },
  { icon: Phone, anim: 'ring', title: '24/7 Support', desc: 'Round the clock customer support and roadside assistance' },
];

const HOW_IT_WORKS_STEPS = [
  { step: '01', title: 'Select Your Route', desc: 'Choose pickup and drop city from our 500+ available routes across India', icon: Map },
  { step: '02', title: 'Pick Date & Vehicle', desc: 'Select your travel date, pickup time, and car type — Sedan, SUV, or Innova', icon: Calendar },
  { step: '03', title: 'Book & Confirm', desc: 'Complete booking with advance payment and get instant confirmation on WhatsApp', icon: CheckCircle2 },
  { step: '04', title: 'Driver Assigned', desc: 'A verified, professional driver is assigned and details shared with you', icon: UserCheck },
  { step: '05', title: 'Doorstep Pickup', desc: 'Driver arrives at your doorstep on time — no running around to find your cab', icon: Car },
  { step: '06', title: 'Reach & Pay', desc: 'Enjoy a comfortable journey, reach your destination, and pay the balance', icon: Target },
];

const ONE_WAY_FAQS = [
  { q: 'What is one way cab service?', a: 'One way cab service allows you to travel from one city to another without paying return charges. You only pay for the distance traveled in one direction, making it significantly cheaper than round trip for one-way journeys.' },
  { q: 'How is the pricing calculated?', a: 'Pricing is based on the distance between cities and vehicle type. Our rates start at ₹9/km. The fare includes fuel, driver charges, and GST. Toll and parking charges are extra as applicable.' },
  { q: 'Are there any hidden charges?', a: 'No hidden charges. The price you see includes base fare, fuel, driver allowance, and GST. Only toll charges and parking fees (if any) are extra and paid as per actuals.' },
  { q: 'What vehicles are available?', a: 'We offer Sedans (Swift Dzire, Honda Amaze), SUVs (Ertiga, Innova Crysta), and Premium cars. Choose based on your group size, luggage, and comfort preferences.' },
  { q: 'Can I cancel or modify my booking?', a: 'Yes, you can cancel or modify your booking. Free cancellation is available up to 6 hours before the journey. Modifications to date/time are free of charge.' },
  { q: 'Is advance booking required?', a: 'We recommend booking at least 6 hours in advance for guaranteed availability. However, we also accept last-minute bookings subject to driver availability in your area.' },
];

/* Wahi "Why Choose Us" dashed-ring card language jo excavator-on-rent
   "Excavator Applications" section me hai. */
const OWC_CSS = `
.owc-card {
  opacity: 0;
  animation: owc-rise .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
}
@keyframes owc-rise {
  from { opacity: 0; transform: translateY(22px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
.owc-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px -12px rgba(16,185,129,.28);
  border-color: rgb(167 243 208);
}
.owc-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(16,185,129,.10) 50%, transparent 65%);
  transform: translateX(-100%);
  transition: transform .8s ease;
  pointer-events: none;
}
.owc-card:hover .owc-sheen { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) {
  .owc-card { opacity: 1; animation: none; }
  .owc-card:hover { transform: none; }
  .owc-sheen { display: none; }
}
`;

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  lift: 'group-hover:-translate-y-2',
  ring: 'group-hover:rotate-12',
};

export default async function OneWayCabPage() {
  const popularRoutes = await getPopularRoutes();

  return (
    <>
      <HowToSchema
        name="How to Book a One-Way Cab on TransRentals"
        description="Book a one-way drop taxi in 4 simple steps. No return charges."
        totalTime="PT8M"
        steps={[
          { name: 'Enter Pickup & Drop City', text: 'Enter your departure city and destination. One-way drop taxis available on 500+ routes across India.' },
          { name: 'Choose Car Type', text: 'Select from hatchback, sedan, SUV, or luxury car. All cars come with professional drivers.' },
          { name: 'Review Pricing', text: 'One-way pricing includes base fare, per-km rate, and driver allowance. No return journey charges.' },
          { name: 'Confirm & Travel', text: 'Pay booking amount. Driver picks you up at the scheduled time and drops at your destination.' },
        ]}
      />
      {/* Hero with booking form - same as /car-rental, defaults to the Outstation > One Way tab */}
      <CarRentalBookingHero
        city=""
        citySlug=""
        serviceSlug="car-rental"
        serviceTitle="One Way Cab"
        initialTripType="outstation"
        headingLine1="Book One Way"
        headingLine2="Drop Taxi"
        compact
      />

      {/* Why Choose One Way Cab */}
      <section className="owc relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <style dangerouslySetInnerHTML={{ __html: OWC_CSS }} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage:
              'radial-gradient(420px 320px at 6% 8%, #000 0%, transparent 70%), radial-gradient(420px 320px at 94% 92%, #000 0%, transparent 70%)',
            maskImage:
              'radial-gradient(420px 320px at 6% 8%, #000 0%, transparent 70%), radial-gradient(420px 320px at 94% 92%, #000 0%, transparent 70%)',
          }}
        />
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900">
              Why Choose <span className="text-emerald-600">One Way Cab</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
            {WHY_CHOOSE.map((item, idx) => (
              <div
                key={item.title}
                className="owc-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <span aria-hidden className="owc-sheen" />
                <div className="relative">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                    <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                      <item.icon
                        className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                      />
                    </span>
                  </div>
                  <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-snug">{item.title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-gray-500">{item.desc}</p>
                </div>
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

            {HOW_IT_WORKS_STEPS.map((item, idx) => (
              <div
                key={item.step}
                className="group relative bg-white rounded-3xl p-7 border border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {/* Large watermark step number */}
                <span className="absolute -top-4 -right-3 text-[120px] font-black text-gray-50 leading-none select-none pointer-events-none group-hover:text-emerald-50 transition-colors duration-500">
                  {item.step}
                </span>

                <div className="relative z-10">
                  {/* Icon circle */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Step label */}
                  <p className="text-xs font-bold text-emerald-600 tracking-widest uppercase mb-2">Step {item.step}</p>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{item.desc}</p>
                </div>

                {/* Bottom gradient accent on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

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
              One Way Cab <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>

          <div className="max-w-5xl mx-auto space-y-3">
            {ONE_WAY_FAQS.map((faq, idx) => (
              <details
                key={idx}
                open={idx === 0}
                className="group rounded-2xl bg-white border border-gray-100 shadow-sm open:border-emerald-200 open:shadow-md transition-all"
              >
                <summary className="flex items-center gap-4 px-4 sm:px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 grid place-items-center">
                    <MessageCircleQuestion className="w-[18px] h-[18px] text-emerald-600" />
                  </span>
                  <h3 className="flex-1 font-bold text-[15px] leading-snug text-gray-900">{faq.q}</h3>
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 text-gray-500 grid place-items-center transition-all duration-200 group-open:rotate-45 group-open:bg-emerald-600 group-open:text-white">
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
              lowPrice: 9,
              highPrice: 20,
              offerCount: 50,
            },
          }),
        }}
      />
    </>
  );
}
