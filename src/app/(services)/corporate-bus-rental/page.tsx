import React from 'react';
import type { Metadata } from 'next';
import { CorporateBusRentalServiceHero } from '@/components/services/CorporateBusRentalServiceHero';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { FAQSection } from '@/components/services/FAQSection';
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
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Corporate Bus Rental Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🏢',
                title: 'Employee Transportation',
                desc: 'Daily pickup & drop for your staff',
                features: ['Fixed routes', 'Multiple shifts', 'GPS tracking'],
              },
              {
                icon: '🎯',
                title: 'Corporate Events',
                desc: 'Conferences, seminars & workshops',
                features: ['Venue transfers', 'Multi-city events', 'Large groups'],
              },
              {
                icon: '🌄',
                title: 'Team Outings',
                desc: 'Team building & recreational trips',
                features: ['Weekend trips', 'Hill stations', 'Adventure tours'],
              },
              {
                icon: '✈️',
                title: 'Airport Transfers',
                desc: 'Group airport pickup & drop',
                features: ['Flight tracking', 'Meet & greet', 'Luggage assistance'],
              },
              {
                icon: '🏨',
                title: 'Hotel Shuttles',
                desc: 'Guest accommodation transport',
                features: ['Multiple pickups', 'Flexible timing', 'Professional drivers'],
              },
              {
                icon: '📅',
                title: 'Long-term Contracts',
                desc: 'Monthly & annual rental plans',
                features: ['Cost savings', 'Dedicated fleet', 'Priority support'],
              },
            ].map((service) => (
              <div key={service.title} className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl shadow-md hover:shadow-xl transition border-2 border-gray-200">
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.desc}</p>
                <ul className="space-y-1">
                  {service.features.map((feature) => (
                    <li key={feature} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-primary">✓</span>
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

      <LocationsGrid service="corporate-bus-rental" />

      <FAQSection service="corporate-bus-rental" customFaqs={FAQS} />

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
