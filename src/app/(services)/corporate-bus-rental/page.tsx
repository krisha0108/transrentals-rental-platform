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

      <FAQSection service="bus-rental" />

    </div>
  );
}
