import React from 'react';
import type { Metadata } from 'next';
import { CorporateBusRentalServiceHero } from '@/components/services/CorporateBusRentalServiceHero';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { FAQSection } from '@/components/services/FAQSection';

import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
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

export default function CorporateBusRentalPage() {
  return (
    <div className="flex flex-col">
      <ServiceHeroWithChat
        badge="Corporate Bus Services in 250+ Cities"
        title="Corporate Bus Rental | Employee Transport"
        titleHighlight="Starting @₹4999/Day"
        description="Reliable bus rental for corporate events, employee transport, and business conferences. Comfortable AC buses with professional drivers."
        gradientFrom="blue-50"
        gradientTo="cyan-50"
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

      {/* Rental Plans */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Flexible Rental Plans
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Daily Rental',
                price: '₹4,999',
                period: 'per day',
                features: [
                  'Single day rental',
                  'Professional driver',
                  'Fuel included (up to 250km)',
                  'AC bus',
                  'Perfect for events',
                ],
              },
              {
                name: 'Monthly Contract',
                price: '₹99,999',
                period: 'per month',
                features: [
                  '30-day rental',
                  'Dedicated driver',
                  'Unlimited km',
                  'Maintenance included',
                  'Best for daily commute',
                  'Priority support',
                ],
                popular: true,
              },
              {
                name: 'Annual Contract',
                price: '₹9,99,999',
                period: 'per year',
                features: [
                  '365-day rental',
                  'Dedicated fleet',
                  'Unlimited usage',
                  'Full maintenance',
                  'Replacement vehicle',
                  'Maximum savings',
                ],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition ${
                  plan.popular ? 'border-4 border-primary' : 'border-2 border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-xs font-bold">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-gray-600 text-sm">/{plan.period}</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LocationsGrid service="corporate-bus-rental" />

      <FAQSection service="bus-rental" />

    </div>
  );
}
