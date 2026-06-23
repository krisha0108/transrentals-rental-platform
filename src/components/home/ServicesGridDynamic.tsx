'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SERVICES } from '@/lib/constants/services';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from '@/contexts/LocationContext';
import { cn } from '@/lib/utils';

// Unique gradient per service ID — makes each card visually distinct
const SERVICE_COLORS: Record<number, string> = {
  1:  'from-blue-500 to-cyan-500',       // Bike Rental
  2:  'from-emerald-500 to-teal-500',    // Car Rental
  3:  'from-teal-500 to-green-500',      // Self-Drive
  4:  'from-cyan-500 to-blue-400',       // One-Way Car
  5:  'from-amber-500 to-yellow-400',    // Luxury Car
  6:  'from-rose-500 to-pink-400',       // Wedding Car
  7:  'from-purple-500 to-violet-500',   // Tempo Traveller
  8:  'from-indigo-500 to-blue-500',     // Outstation Cab
  9:  'from-sky-500 to-cyan-400',        // Local Taxi
  10: 'from-violet-500 to-purple-400',   // Chauffeur
  11: 'from-slate-600 to-gray-500',      // Corporate Car
  12: 'from-green-600 to-emerald-400',   // Monthly Car
  13: 'from-stone-500 to-amber-600',     // Vintage Car
  14: 'from-red-500 to-orange-500',      // Sports Car
  15: 'from-purple-600 to-indigo-500',   // Bus Rental
  16: 'from-orange-500 to-amber-500',    // Truck Rental
  17: 'from-orange-600 to-red-500',      // Packers & Movers
  18: 'from-yellow-500 to-amber-400',    // Equipment Rental
  19: 'from-sky-600 to-blue-500',        // Airport Transfer
  20: 'from-cyan-600 to-teal-500',       // One Way Cab
  21: 'from-teal-600 to-green-500',      // Round Trip
  22: 'from-blue-400 to-sky-400',        // Activa
  23: 'from-zinc-600 to-gray-600',       // Royal Enfield
  24: 'from-pink-500 to-rose-400',       // Wedding Bus
  25: 'from-slate-500 to-blue-500',      // Corporate Bus
  26: 'from-orange-400 to-yellow-500',   // Mini Truck
  27: 'from-amber-600 to-yellow-600',    // JCB
  28: 'from-green-500 to-teal-400',      // Outstation Car
};

const MAIN_SERVICE_IDS = [1, 2, 3, 5, 15, 16, 17, 18];

function ServiceCard({ service, citySlug }: { service: typeof SERVICES[0]; citySlug: string }) {
  const gradient = SERVICE_COLORS[service.id] ?? 'from-primary to-primary/80';
  const cityServiceUrl = `${service.base_url}/${citySlug}`;

  return (
    <Link
      href={cityServiceUrl}
      className="group relative bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block h-full shadow-sm"
    >
      {/* Icon */}
      <div className={cn(
        'w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-md bg-gradient-to-br',
        gradient
      )}>
        {service.icon && <service.icon className="w-7 h-7 text-white" strokeWidth={1.5} />}
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold text-gray-900 mb-1.5 group-hover:text-primary transition-colors">
        {service.name}
      </h3>
      <p className="text-gray-500 text-sm mb-5 leading-relaxed">
        {service.description}
      </p>

      {/* Arrow */}
      <div className="flex items-center gap-1 text-primary font-semibold text-sm">
        <span>Explore</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

export function ServicesGridDynamic() {
  const [showAll, setShowAll] = useState(false);
  const { currentCity } = useLocation();

  const mainServices = SERVICES.filter(s => MAIN_SERVICE_IDS.includes(s.id));
  const additionalServices = SERVICES.filter(s => !MAIN_SERVICE_IDS.includes(s.id));

  return (
    <section className="section-padding bg-gray-50/60">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            More Services in {currentCity.name}
          </h2>
          <p className="text-gray-500">
            Explore our wide range of vehicle rental services across India
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mainServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ServiceCard service={service} citySlug={currentCity.slug} />
            </motion.div>
          ))}

          <AnimatePresence>
            {showAll && additionalServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: index * 0.04 }}
              >
                <ServiceCard service={service} citySlug={currentCity.slug} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Toggle Button */}
        <div className="text-center mt-10">
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="min-w-[200px] rounded-xl border-gray-300 hover:border-primary hover:text-primary"
          >
            {showAll ? (
              <><span>Show Less</span><ChevronUp className="w-4 h-4 ml-2" /></>
            ) : (
              <><span>View All Services ({additionalServices.length} more)</span><ChevronDown className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
