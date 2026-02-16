import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const CAR_SUB_SERVICES = [
  {
    id: 'self-drive',
    name: 'Self-Drive Car Rentals',
    icon: '🔑',
    description: 'Drive yourself, no driver needed',
    price: 'Starting from ₹899',
    url: '/self-drive-car-rentals',
    gradient: 'from-purple-500 to-blue-500',
    popular: true,
  },
  {
    id: 'luxury',
    name: 'Luxury Car Rental',
    icon: '💎',
    description: 'BMW, Mercedes, Audi & more',
    price: 'Starting from ₹4999',
    url: '/luxury-car-rental',
    gradient: 'from-purple-900 to-amber-600',
    popular: true,
  },
  {
    id: 'outstation',
    name: 'Outstation Car Rental',
    icon: '🗺️',
    description: 'Intercity trips & long distance travel',
    price: 'Starting from ₹10/km',
    url: '/outstation-car-rental',
    gradient: 'from-indigo-600 to-purple-600',
    popular: true,
  },
  {
    id: 'one-way',
    name: 'One-Way Car Rental',
    icon: '➡️',
    description: 'Rent in one city, drop in another',
    price: 'Starting from ₹1299',
    url: '/one-way-car-rental',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'wedding',
    name: 'Wedding Car Rental',
    icon: '💒',
    description: 'Premium cars for your special day',
    price: 'Starting from ₹5999',
    url: '/wedding-car-rental',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    id: 'corporate',
    name: 'Corporate Car Rental',
    icon: '💼',
    description: 'Fleet solutions for businesses',
    price: 'Starting from ₹1499',
    url: '/corporate-car-rental',
    gradient: 'from-gray-700 to-gray-900',
  },
  {
    id: 'monthly',
    name: 'Monthly Car Rental',
    icon: '📅',
    description: 'Long-term car subscription',
    price: 'Starting from ₹25,000/month',
    url: '/monthly-car-rental',
    gradient: 'from-green-500 to-teal-500',
  },
  {
    id: 'vintage',
    name: 'Vintage Car Rental',
    icon: '🎩',
    description: 'Classic cars for weddings & shoots',
    price: 'Starting from ₹7999',
    url: '/vintage-car-rental',
    gradient: 'from-amber-700 to-orange-600',
  },
  {
    id: 'sports',
    name: 'Sports Car Rental',
    icon: '🏎️',
    description: 'Supercars & performance vehicles',
    price: 'Starting from ₹9999',
    url: '/sports-car-rental',
    gradient: 'from-red-600 to-orange-500',
  },
];

export function CarSubServicesGrid() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Specialized Car Rental Services
          </h2>
          <p className="text-lg text-gray-600">
            Looking for something specific? Browse our specialized car rental services tailored to your needs
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CAR_SUB_SERVICES.map((service) => (
            <Link
              key={service.id}
              href={service.url}
              className="group relative bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
            >
              {/* Popular Badge */}
              {service.popular && (
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                    Popular
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className="relative">
                <div className={`w-16 h-16 bg-gradient-to-br ${service.gradient} rounded-lg flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform`}>
                  {service.icon}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {service.name}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {service.description}
              </p>
              <p className="text-primary font-bold text-sm mb-4">
                {service.price}
              </p>

              {/* Arrow */}
              <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                <span>View Details</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Hover Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity rounded-xl pointer-events-none`} />
            </Link>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-12 max-w-4xl mx-auto bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h4 className="font-bold text-lg text-gray-900 mb-2">Not sure which service to choose?</h4>
              <p className="text-gray-700 mb-3">
                Use our general car rental booking form above to describe your requirements, and we'll match you with the best car rental service and vendors for your needs.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Tip:</strong> For standard car rentals with a driver for local/outstation trips, use the main booking form. For specialized needs like self-drive, luxury, or wedding cars, explore the specific services above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
