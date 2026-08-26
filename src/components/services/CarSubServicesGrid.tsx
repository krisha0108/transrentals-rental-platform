import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Star, Lightbulb } from 'lucide-react';

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
    <section className="relative py-16 md:py-20 bg-gray-50 overflow-hidden">
      {/* Subtle dot-grid pattern background */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(circle, #a7f3d0 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 90%)',
        }}
      />
      <div className="container-custom relative">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            Specialized Services
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
            Specialized Car Rental Services
          </h2>
          <p className="text-gray-500">
            Looking for something specific? Browse our specialized car rental services tailored to your needs
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CAR_SUB_SERVICES.map((service) => (
            <Link
              key={service.id}
              href={service.url}
              className="group relative rounded-2xl p-6 overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Soft pastel colour wash — same gradient, much lower intensity */}
              <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-[0.08] group-hover:opacity-[0.14] transition-opacity`} />

              {/* Popular Badge */}
              {service.popular && (
                <div className="absolute top-5 right-5 flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold rounded-full">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  Popular
                </div>
              )}

              {/* Content */}
              <div className="relative">
                <div className={`w-14 h-14 bg-gradient-to-br ${service.gradient} rounded-xl flex items-center justify-center text-3xl mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                  {service.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {service.name}
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  {service.description}
                </p>

                {/* Price + Arrow */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-[12.5px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                    {service.price}
                  </span>
                  <div className="flex items-center gap-1 text-gray-400 group-hover:text-emerald-600 font-semibold text-sm group-hover:gap-1.5 transition-all">
                    <span>Details</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-10 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-1 self-stretch rounded-full bg-gradient-to-b from-emerald-500 to-emerald-700 hidden sm:block" />
          <div className="w-12 h-12 rounded-xl bg-white shadow-md shadow-emerald-900/10 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-base text-gray-900 mb-1">Not sure which service to choose?</h4>
            <p className="text-sm text-gray-600 leading-relaxed mb-1.5">
              Use our general car rental booking form above to describe your requirements, and we&apos;ll match you with the best car rental service and vendors for your needs.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              <strong className="text-gray-700">Tip:</strong> Standard local/outstation trips use the main booking form; specialized needs like self-drive, luxury, or wedding cars have their own pages above.
            </p>
          </div>
          <a
            href="#booking"
            className="shrink-0 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors whitespace-nowrap"
          >
            Use Booking Form
            <ArrowRight className="w-4 h-4 -rotate-90" />
          </a>
        </div>
      </div>
    </section>
  );
}
