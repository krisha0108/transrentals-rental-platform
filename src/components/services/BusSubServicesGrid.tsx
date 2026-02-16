import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const BUS_SUB_SERVICES = [
  {
    id: 'tempo-traveller',
    name: 'Tempo Traveller',
    icon: '🚐',
    description: '12-17 seater for group travel',
    price: 'Starting from ₹2499',
    url: '/tempo-traveller',
    gradient: 'from-blue-500 to-cyan-500',
    features: ['12-17 Seaters', 'AC Available', 'Perfect for groups'],
    popular: true,
  },
  {
    id: 'wedding-bus',
    name: 'Wedding Bus Rental',
    icon: '💒',
    description: 'Luxury buses for marriage guests',
    price: 'Starting from ₹3999',
    url: '/wedding-bus-rental',
    gradient: 'from-pink-500 to-rose-500',
    features: ['Guest transport', 'Decorated buses', 'All sizes'],
    popular: true,
  },
  {
    id: 'corporate-bus',
    name: 'Corporate Bus Rental',
    icon: '💼',
    description: 'Employee & event transportation',
    price: 'Starting from ₹4999',
    url: '/corporate-bus-rental',
    gradient: 'from-gray-700 to-gray-900',
    features: ['Daily commute', 'Office events', 'Flexible contracts'],
  },
];

const BUS_TYPES = [
  {
    id: 'mini-bus',
    name: 'Mini Bus',
    icon: '🚐',
    description: '20-30 seater mini buses',
    features: ['20-30 Seaters', 'AC/Non-AC', 'City tours'],
    price: 'Starting from ₹2999',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    id: 'standard-bus',
    name: 'Standard Bus',
    icon: '🚌',
    description: '35-40 seater buses',
    features: ['35-40 Seaters', 'Comfortable', 'Long distance'],
    price: 'Starting from ₹3999',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'luxury-bus',
    name: 'Luxury Coach',
    icon: '🚌',
    description: '40-50 seater luxury coaches',
    features: ['40-50 Seaters', 'Premium AC', 'Entertainment'],
    price: 'Starting from ₹5999',
    gradient: 'from-indigo-600 to-purple-600',
  },
];

export function BusSubServicesGrid() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Bus & Group Travel Options
          </h2>
          <p className="text-lg text-gray-600">
            Choose the right vehicle size for your group travel needs
          </p>
        </div>

        {/* Specialized Sub-Services */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Specialized Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BUS_SUB_SERVICES.map((service) => (
              <Link
                key={service.id}
                href={service.url}
                className="group relative bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex items-center gap-6"
              >
                {service.popular && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                      Popular
                    </span>
                  </div>
                )}

                <div className={`w-20 h-20 bg-gradient-to-br ${service.gradient} rounded-lg flex items-center justify-center text-5xl group-hover:scale-110 transition-transform flex-shrink-0`}>
                  {service.icon}
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {service.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {service.features.map((feature) => (
                      <span key={feature} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                  <p className="text-primary font-bold">
                    {service.price}
                  </p>
                </div>

                <div className="flex items-center text-primary font-medium">
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bus Types */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Bus Types by Capacity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BUS_TYPES.map((bus) => (
              <div
                key={bus.id}
                className="group relative bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${bus.gradient} rounded-lg flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform`}>
                  {bus.icon}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {bus.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {bus.description}
                </p>

                <ul className="space-y-1 mb-4">
                  {bus.features.map((feature) => (
                    <li key={feature} className="text-xs text-gray-600 flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <p className="text-primary font-bold text-sm">
                  {bus.price}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 max-w-4xl mx-auto bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h4 className="font-bold text-lg text-gray-900 mb-2">Need help choosing?</h4>
              <p className="text-gray-700">
                Use the main booking form to tell us your group size and destination. We'll recommend the perfect bus or tempo traveller for your needs!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
