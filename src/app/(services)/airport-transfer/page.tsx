import React from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { AirportRoutesGrid } from '@/components/services/AirportRoutesGrid';
import Link from 'next/link';
import {
  Plane, IndianRupee, ArrowRight, CheckCircle2,
  Clock, Wallet, UserCheck, Car, Phone, ClipboardList, Ticket, Target,
  MessageCircleQuestion, Plus,
} from 'lucide-react';
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';
import { HowToSchema } from '@/components/seo/schemas';

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

const WHY_CHOOSE = [
  { icon: Clock, anim: 'tick', title: '45 Min Free Waiting', desc: 'Free waiting time at airport for flight delays - no extra charge for late arrivals' },
  { icon: Wallet, anim: 'pulse', title: 'Fixed Pricing', desc: 'Transparent fixed pricing with no surge or hidden charges, know your fare upfront' },
  { icon: Plane, anim: 'drive', title: 'Flight Tracking', desc: 'We track your flight status and adjust pickup time automatically for delays' },
  { icon: UserCheck, anim: 'lift', title: 'Meet & Greet', desc: 'Driver meets you at arrival gate with name board for easy identification' },
  { icon: Car, anim: 'drive', title: 'All Car Types', desc: 'Choose from Sedans, SUVs, Innova and premium cars based on luggage needs' },
  { icon: Phone, anim: 'ring', title: '24/7 Availability', desc: 'Round the clock service for early morning or late night flights' },
];

const HOW_IT_WORKS_STEPS = [
  { step: '01', title: 'Select Airport & Route', desc: 'Choose your airport and city destination for pickup or drop service', icon: Plane },
  { step: '02', title: 'Enter Flight Details', desc: 'Provide your flight number and arrival/departure time for live tracking', icon: ClipboardList },
  { step: '03', title: 'Choose Vehicle & Book', desc: 'Select from Sedan, SUV, or Premium car and complete booking instantly', icon: CheckCircle2 },
  { step: '04', title: 'Driver Assigned', desc: 'A verified driver is assigned — you receive name, photo, and car details via SMS', icon: UserCheck },
  { step: '05', title: 'Meet at Terminal', desc: 'Driver waits at arrival gate with name board — 45 min free waiting included', icon: Ticket },
  { step: '06', title: 'Reach Safely', desc: 'Enjoy a comfortable ride to your hotel, home, or office with zero hassle', icon: Target },
];

const AIRPORT_FAQS = [
  { q: 'What is airport transfer service?', a: 'Airport transfer service provides cab pickup from airport to city or drop from city to airport with professional drivers, fixed pricing, and 45 minutes of free waiting time for flight delays.' },
  { q: 'How much free waiting time is included?', a: '45 minutes of free waiting time is included from the scheduled pickup time. For airport pickups, the timer starts after your flight lands. Additional waiting beyond 45 minutes is charged at ₹2-3/min.' },
  { q: 'Do you track my flight?', a: 'Yes, we track your flight status automatically. If your flight is delayed, the driver will be informed and the pickup time is adjusted accordingly at no extra charge.' },
  { q: 'What is included in the fixed fare?', a: 'The fixed fare includes base fare, fuel charges, driver charges, 45 min free waiting, meet & greet at terminal, and GST. Toll and parking charges are extra as applicable.' },
  { q: 'Can I book for early morning or late night flights?', a: 'Yes, our airport transfer service is available 24/7. You can book for any flight time - early morning, late night, or any hour. Night charges may apply for pickups between 10 PM and 6 AM.' },
  { q: 'How do I find my driver at the airport?', a: 'Your driver will wait at the arrival gate holding a name board with your name. You will also receive the driver\'s name, photo, car number, and phone number via SMS after booking.' },
];

/* Wahi "Why Choose Us" dashed-ring card language jo excavator-on-rent
   "Excavator Applications" section me hai. */
const ATR_CSS = `
.atr-card {
  opacity: 0;
  animation: atr-rise .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
}
@keyframes atr-rise {
  from { opacity: 0; transform: translateY(22px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
.atr-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px -12px rgba(16,185,129,.28);
  border-color: rgb(167 243 208);
}
.atr-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(16,185,129,.10) 50%, transparent 65%);
  transform: translateX(-100%);
  transition: transform .8s ease;
  pointer-events: none;
}
.atr-card:hover .atr-sheen { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) {
  .atr-card { opacity: 1; animation: none; }
  .atr-card:hover { transform: none; }
  .atr-sheen { display: none; }
}
`;

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  lift: 'group-hover:-translate-y-2',
  ring: 'group-hover:rotate-12',
};

export default async function AirportTransferPage() {
  const popularRoutes = await getPopularRoutes();

  return (
    <>
      <HowToSchema
        name="How to Book Airport Transfer on TransRentals"
        description="Book airport pickup or drop cab in 4 simple steps."
        totalTime="PT5M"
        steps={[
          { name: 'Enter Flight & Airport Details', text: 'Enter airport name, flight number, arrival/departure time, and pickup/drop address.' },
          { name: 'Choose Cab Type', text: 'Select hatchback, sedan, SUV, or luxury cab based on passenger count and luggage.' },
          { name: 'Review Fixed Price', text: 'Airport transfers are priced as fixed fares. No surge pricing. Includes driver, waiting time for arrivals.' },
          { name: 'Confirm & Relax', text: 'Pay advance to confirm. Driver tracks your flight. Meets you with name board at the arrival gate.' },
        ]}
      />
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
      <section className="atr relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <style dangerouslySetInnerHTML={{ __html: ATR_CSS }} />
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
              Why Choose Our <span className="text-emerald-600">Airport Transfer</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
            {WHY_CHOOSE.map((item, idx) => (
              <div
                key={item.title}
                className="atr-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <span aria-hidden className="atr-sheen" />
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

            {HOW_IT_WORKS_STEPS.map((item, idx) => (
              <div
                key={item.step}
                className="group relative bg-white rounded-3xl p-7 border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {/* Large watermark step number */}
                <span className="absolute -top-4 -right-3 text-[120px] font-black text-gray-50 leading-none select-none pointer-events-none group-hover:text-blue-50 transition-colors duration-500">
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
              Airport Transfer <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>

          <div className="max-w-5xl mx-auto space-y-3">
            {AIRPORT_FAQS.map((faq, idx) => (
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
              lowPrice: 499,
              highPrice: 5000,
              offerCount: 50,
            },
          }),
        }}
      />
    </>
  );
}
