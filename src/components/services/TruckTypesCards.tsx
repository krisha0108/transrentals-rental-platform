import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const TRUCK_SUB_SERVICES = [
  {
    id: 'mini-truck',
    name: 'Mini Truck / Tata Ace',
    icon: '🚚',
    description: 'Compact trucks for city deliveries',
    features: ['750 KG - 1.5 TON', 'City delivery', 'Fuel efficient'],
    price: 'Starting @₹799/day',
    url: '/mini-truck-rental',
    gradient: 'from-blue-500 to-cyan-500',
    popular: true,
  },
];

const TRUCK_TYPES = [
  {
    id: 'tata-ace',
    name: 'Tata Ace / Mini Truck',
    icon: '🚚',
    description: 'Small goods transport',
    features: ['750 KG - 1 TON', 'City delivery', 'Compact size'],
    price: 'Starting @₹799/day',
    gradient: 'from-blue-500 to-cyan-500',
    popular: true,
  },
  {
    id: 'pickup',
    name: 'Pickup Truck',
    icon: '🚚',
    description: 'Open body goods carrier',
    features: ['1-2 TON', 'Open/Closed body', 'Flexible loading'],
    price: 'Starting @₹999/day',
    gradient: 'from-green-500 to-teal-500',
    popular: true,
  },
  {
    id: 'canter-14ft',
    name: '14 Feet Truck (Canter)',
    icon: '🚛',
    description: 'Medium goods transport',
    features: ['3-4 TON', 'Covered body', 'City & highway'],
    price: 'Starting @₹1499/day',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    id: 'canter-17ft',
    name: '17 Feet Truck (Canter)',
    icon: '🚛',
    description: 'Large capacity transport',
    features: ['5-6 TON', 'Full body', 'Long distance'],
    price: 'Starting @₹1799/day',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'canter-19ft',
    name: '19 Feet Truck',
    icon: '🚛',
    description: 'Extra large capacity',
    features: ['7-8 TON', 'Extended body', 'Bulk goods'],
    price: 'Starting @₹1999/day',
    gradient: 'from-indigo-600 to-purple-600',
  },
  {
    id: 'canter-22ft',
    name: '22 Feet Truck',
    icon: '🚛',
    description: 'Heavy duty transport',
    features: ['9-10 TON', 'Full container', 'Interstate'],
    price: 'Starting @₹2499/day',
    gradient: 'from-red-600 to-orange-500',
  },
  {
    id: 'container',
    name: '32 Feet Container',
    icon: '🚛',
    description: 'Heavy commercial transport',
    features: ['15-20 TON', 'Full container', 'Long haul'],
    price: 'Starting @₹3999/day',
    gradient: 'from-gray-700 to-gray-900',
  },
  {
    id: 'trailer',
    name: 'Trailer / Multi-Axle',
    icon: '🚛',
    description: 'Extra heavy transport',
    features: ['25+ TON', 'Multi-axle', 'Industrial'],
    price: 'Starting @₹5999/day',
    gradient: 'from-amber-700 to-orange-600',
  },
];

const SPECIALIZED_TRUCKS = [
  {
    id: 'refrigerated',
    name: 'Refrigerated Truck',
    icon: '❄️',
    description: 'Temperature controlled transport',
    features: ['Cold chain', 'Food grade', 'Temperature monitoring'],
    gradient: 'from-cyan-600 to-blue-600',
  },
  {
    id: 'tanker',
    name: 'Tanker Truck',
    icon: '🚰',
    description: 'Liquid goods transport',
    features: ['Water', 'Fuel', 'Chemical grade'],
    gradient: 'from-blue-700 to-indigo-700',
  },
  {
    id: 'tipper',
    name: 'Tipper Truck',
    icon: '🚜',
    description: 'Construction material transport',
    features: ['Auto-unloading', 'Sand/gravel', 'Construction sites'],
    gradient: 'from-yellow-600 to-orange-600',
  },
];

export function TruckTypesCards() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Truck Types by Size & Capacity
          </h2>
          <p className="text-lg text-gray-600">
            Choose the right truck size for your goods transport needs
          </p>
        </div>

        {/* Featured Sub-Service */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Popular Choice</h3>
          <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
            {TRUCK_SUB_SERVICES.map((service) => (
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

        {/* Standard Trucks */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">All Truck Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUCK_TYPES.map((truck) => (
              <div
                key={truck.id}
                className="group relative bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                {truck.popular && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                      Popular
                    </span>
                  </div>
                )}

                <div className={`w-16 h-16 bg-gradient-to-br ${truck.gradient} rounded-lg flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform`}>
                  {truck.icon}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {truck.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {truck.description}
                </p>

                <ul className="space-y-1 mb-4">
                  {truck.features.map((feature) => (
                    <li key={feature} className="text-xs text-gray-600 flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <p className="text-primary font-bold text-sm">
                  {truck.price}
                </p>

                <div className={`absolute inset-0 bg-gradient-to-br ${truck.gradient} opacity-0 group-hover:opacity-5 transition-opacity rounded-xl pointer-events-none`} />
              </div>
            ))}
          </div>
        </div>

        {/* Specialized Trucks */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Specialized Trucks</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SPECIALIZED_TRUCKS.map((truck) => (
              <div
                key={truck.id}
                className="group relative bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${truck.gradient} rounded-lg flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform`}>
                  {truck.icon}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {truck.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {truck.description}
                </p>

                <ul className="space-y-1 mb-4">
                  {truck.features.map((feature) => (
                    <li key={feature} className="text-xs text-gray-600 flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <p className="text-primary font-bold text-sm">
                  Contact for pricing
                </p>

                <div className={`absolute inset-0 bg-gradient-to-br ${truck.gradient} opacity-0 group-hover:opacity-5 transition-opacity rounded-xl pointer-events-none`} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 max-w-4xl mx-auto bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h4 className="font-bold text-lg text-gray-900 mb-2">Need help choosing the right truck?</h4>
              <p className="text-gray-700">
                Use the main booking form to tell us your goods type, weight, and route. We'll recommend the perfect truck size and provide competitive quotes from verified transporters!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
