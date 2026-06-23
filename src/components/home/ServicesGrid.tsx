'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SERVICES } from '@/lib/constants/services';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from '@/contexts/LocationContext';

// Main 8 booking types matching Trans_main
const MAIN_SERVICE_IDS = [1, 2, 3, 5, 15, 16, 17, 18];

export function ServicesGrid() {
  const [showAll, setShowAll] = useState(false);
  const { currentCity } = useLocation();

  const mainServices = SERVICES.filter(service => MAIN_SERVICE_IDS.includes(service.id));
  const additionalServices = SERVICES.filter(service => !MAIN_SERVICE_IDS.includes(service.id));
  const displayedServices = showAll ? SERVICES : mainServices;

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Services in {currentCity.name}
          </h2>
          <p className="text-lg text-gray-600">
            Choose from our wide range of vehicle rental services in {currentCity.name} and across India
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainServices.map((service, index) => {
            const cityServiceUrl = `/${currentCity.slug}${service.base_url}`;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={cityServiceUrl}
                  className="group relative bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block h-full"
                >
                {/* Icon */}
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  {service.icon && <service.icon className="w-8 h-8 text-primary" />}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {service.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {service.description}
                </p>

                {/* Arrow */}
                <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                  <span>Explore</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
              </Link>
            </motion.div>
            );
          })}

          {/* Additional Services - Shown when expanded */}
          <AnimatePresence>
            {showAll && additionalServices.map((service, index) => {
              const cityServiceUrl = `/${currentCity.slug}${service.base_url}`;

              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={cityServiceUrl}
                    className="group relative bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block h-full"
                  >
                  {/* Icon */}
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    {service.icon && <service.icon className="w-8 h-8 text-primary" />}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {service.description}
                  </p>

                  {/* Arrow */}
                  <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                </Link>
              </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* View All / Show Less Button */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="min-w-[200px]"
          >
            {showAll ? (
              <>
                Show Less
                <ChevronUp className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>
                View All Services ({additionalServices.length} more)
                <ChevronDown className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
