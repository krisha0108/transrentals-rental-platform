'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Navigation } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { getPopularRoutes, getDestinationIcon } from '@/data/popular-routes';

export function PopularDestinationsDynamic() {
  const { currentCity } = useLocation();
  const destinations = getPopularRoutes(currentCity.slug);

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Popular Destinations from {currentCity.name}
          </h2>
          <p className="text-lg text-gray-600">
            Explore India's most loved destinations with our rental services starting from {currentCity.name}
          </p>
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((destination) => {
            const icon = getDestinationIcon(destination.type);

            return (
              <Link
                key={destination.slug}
                href={`/${destination.slug}`}
                className="group relative overflow-hidden rounded-xl bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative h-64 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />
                  {/* Placeholder - replace with actual Image component when images are added */}
                  <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                    <span className="text-8xl opacity-20">{icon}</span>
                  </div>

                  {/* Distance Badge */}
                  {destination.distance && (
                    <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                        <Navigation className="w-3.5 h-3.5 text-primary" />
                        <span>{destination.distance}</span>
                      </div>
                    </div>
                  )}

                  {/* Type Badge */}
                  <div className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <span className="text-xs font-medium text-white capitalize">{destination.type.replace('-', ' ')}</span>
                  </div>

                  {/* Overlay Content */}
                  <div className="absolute bottom-0 left-0 right-0 z-20 p-6 text-white">
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">{destination.vehicles}</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-1">
                      {destination.name}
                    </h3>
                    <p className="text-sm text-white/90">
                      {destination.description}
                    </p>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
