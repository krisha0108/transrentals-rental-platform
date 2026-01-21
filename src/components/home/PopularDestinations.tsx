import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';

const destinations = [
  {
    name: 'Goa',
    slug: 'goa',
    image: '/images/destinations/goa.jpg',
    description: 'Beach paradise with scenic coastal roads',
    vehicles: '200+ Bikes',
  },
  {
    name: 'Manali',
    slug: 'manali',
    image: '/images/destinations/manali.jpg',
    description: 'Mountain adventures in the Himalayas',
    vehicles: '150+ Bikes',
  },
  {
    name: 'Bangalore',
    slug: 'bangalore',
    image: '/images/destinations/bangalore.jpg',
    description: 'Silicon Valley of India',
    vehicles: '300+ Vehicles',
  },
  {
    name: 'Udaipur',
    slug: 'udaipur',
    image: '/images/destinations/udaipur.jpg',
    description: 'City of Lakes and Palaces',
    vehicles: '120+ Bikes',
  },
  {
    name: 'Leh-Ladakh',
    slug: 'leh',
    image: '/images/destinations/leh.jpg',
    description: 'Ultimate bike trip destination',
    vehicles: '100+ Bikes',
  },
  {
    name: 'Rishikesh',
    slug: 'rishikesh',
    image: '/images/destinations/rishikesh.jpg',
    description: 'Yoga capital with river adventures',
    vehicles: '80+ Bikes',
  },
];

export function PopularDestinations() {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Popular Destinations
          </h2>
          <p className="text-lg text-gray-600">
            Explore India's most loved destinations with our rental services
          </p>
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((destination) => (
            <Link
              key={destination.slug}
              href={`/bike-on-rent/${destination.slug}`}
              className="group relative overflow-hidden rounded-xl bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />
                {/* Placeholder - replace with actual Image component when images are added */}
                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600" />

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
          ))}
        </div>
      </div>
    </section>
  );
}
