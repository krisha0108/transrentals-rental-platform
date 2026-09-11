import React from 'react';
import type { Metadata } from 'next';
import {
  Building2, Target, Mountain, Plane, Building, CalendarDays,
  MessageCircleQuestion, Plus, Check,
} from 'lucide-react';
import { CorporateBusRentalServiceHero } from '@/components/services/CorporateBusRentalServiceHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { BusFleetGrid } from '@/components/corporate-bus-rental/BusFleetGrid';
import { prisma } from '@/lib/db/prisma';
import { getBusRentalServiceId } from '@/lib/db/build-cache';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Corporate Bus Rental - Employee Transport & Office Events @₹4999 | TransRentals',
  description:
    'Corporate bus rental for employee transportation, office events & team outings. Daily, monthly & annual contracts. Professional service. Book now!',
  keywords: [
    'corporate bus rental',
    'employee transport bus',
    'office bus rental',
    'company bus hire',
    'staff transport',
    'corporate transport solutions',
    'business bus rental',
  ],
  openGraph: {
    title: 'Corporate Bus Rental - Starting @₹4999 | TransRentals',
    description: 'Professional corporate bus rental for employee transportation.',
  },
};

const FAQS = [
  { question: 'What are the corporate bus rental rates?', answer: 'Corporate bus rental starts from ₹4,999/day for employee transport routes, with rates depending on bus size, route distance, and contract length (daily vs. monthly vs. annual). Long-term contracts get preferential per-day pricing.' },
  { question: 'Can we get a monthly or annual employee transport contract?', answer: 'Yes, TransRentals arranges monthly and annual employee transport contracts with a dedicated fleet, fixed routes, and priority support. This works out cheaper per trip than ad-hoc daily bookings for regular office commutes.' },
  { question: 'Is GPS tracking available for corporate bus rentals?', answer: 'Yes, all corporate bus rentals include GPS tracking so HR/admin teams can monitor employee transport routes and pickup/drop timings in real time.' },
  { question: 'What bus sizes are available for corporate events and outings?', answer: 'From 12-seater mini buses for small team outings to 45–50 seater coaches for large conferences and offsites. AC buses are available across all sizes for executive comfort.' },
  { question: 'How is billing handled for long-term corporate contracts?', answer: 'Long-term contracts are billed monthly against a single consolidated invoice with GST, making it easy for finance teams to reconcile compared to multiple ad-hoc bookings.' },
];

export default async function CorporateBusRentalPage() {
  const busServiceId = await getBusRentalServiceId();
  const busModels = busServiceId ? await prisma.vehicle_models.findMany({
    where: { serviceId: busServiceId, isActive: true },
    select: {
      id: true, name: true, sideImage: true, basePricePerDay: true,
      rating: true, seatingCapacity: true, brands: { select: { name: true } },
    },
    orderBy: [{ isPopular: 'desc' }, { displayOrder: 'asc' }],
  }) : [];

  return (
    <div className="flex flex-col">
      <HowToSchema
        name="How to Book Corporate Bus Rental on TransRentals"
        description="Book corporate bus or employee transport in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Submit Requirements', text: 'Enter number of employees, pickup/drop locations, shift timings, and travel frequency (daily/weekly).' },
          { name: 'Choose Bus Type', text: 'Select from mini buses (12–20 seater) to full-size coaches (45–50 seater). AC buses available for executive travel.' },
          { name: 'Get Corporate Quote', text: 'Receive quotes from verified corporate transport vendors. Compare rates for daily, monthly, or annual contracts.' },
          { name: 'Finalize Contract & Start', text: 'Sign the transport contract, share employee lists and routes. Service starts on agreed date with GPS-tracked buses.' },
        ]}
      />
      <CorporateBusRentalServiceHero />

      {/* Use Cases */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/25 to-white">
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
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Corporate Bus Rental Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { Icon: Building2, title: 'Employee Transportation', desc: 'Daily pickup & drop for your staff', features: ['Fixed routes', 'Multiple shifts', 'GPS tracking'] },
              { Icon: Target, title: 'Corporate Events', desc: 'Conferences, seminars & workshops', features: ['Venue transfers', 'Multi-city events', 'Large groups'] },
              { Icon: Mountain, title: 'Team Outings', desc: 'Team building & recreational trips', features: ['Weekend trips', 'Hill stations', 'Adventure tours'] },
              { Icon: Plane, title: 'Airport Transfers', desc: 'Group airport pickup & drop', features: ['Flight tracking', 'Meet & greet', 'Luggage assistance'] },
              { Icon: Building, title: 'Hotel Shuttles', desc: 'Guest accommodation transport', features: ['Multiple pickups', 'Flexible timing', 'Professional drivers'] },
              { Icon: CalendarDays, title: 'Long-term Contracts', desc: 'Monthly & annual rental plans', features: ['Cost savings', 'Dedicated fleet', 'Priority support'] },
            ].map(({ Icon, title, desc, features }) => (
              <div key={title} className="group rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 p-6 text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[78deg] transition-transform duration-500" />
                  <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-emerald-600" strokeWidth={1.9} />
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 mb-4">{desc}</p>
                <ul className="flex flex-col items-start gap-1.5 max-w-[220px] mx-auto">
                  {features.map((feature) => (
                    <li key={feature} className="text-[13px] text-gray-600 flex items-center gap-2">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-50 grid place-items-center">
                        <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3.5} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>


      {busModels.length > 0 && <BusFleetGrid buses={busModels} />}

      <StaticServicePopularCitiesGrid serviceSlug="corporate-bus-rental" title="Corporate Bus Rental in Available Cities" />

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
              Corporate Bus Rental <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>

          <div className="max-w-5xl mx-auto space-y-3">
            {FAQS.map((faq, idx) => (
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
              { '@type': 'ListItem', position: 2, name: 'Bus Rental', item: 'https://transrentals.in/bus-rental' },
              { '@type': 'ListItem', position: 3, name: 'Corporate Bus Rental', item: 'https://transrentals.in/corporate-bus-rental' },
            ],
          }),
        }}
      />
    </div>
  );
}
