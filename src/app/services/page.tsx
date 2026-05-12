'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, ChevronDown } from 'lucide-react';
import { SERVICES } from '@/lib/constants/services';


//'wedding-car-rental', 'corporate-car-rental', 'monthly-car-rental',
       //'vintage-car-rental', 'sports-car-rental', 'outstation-car-rental'
//bike rental ka array, 'activa-on-rent', 'royal-enfield-on-rent' 
//'wedding-bus-rental', 'corporate-bus-rental'

// Group services by category
const serviceCategories = [
  {
    name: 'Car Rentals',
    description: 'Find the perfect car for every journey',
    services: SERVICES.filter(s =>
      ['car-rental', 'self-drive-car-rentals', 'one-way-car-rental', 'luxury-car-rental',
       ].includes(s.slug)
    ),
  },
  {
    name: 'Bike & Scooter Rentals',
    description: 'Two-wheelers for easy city travel',
    services: SERVICES.filter(s =>
      ['bike-on-rent'].includes(s.slug)
    ),
  },
  {
    name: 'Taxi & Cab Services',
    description: 'Reliable cab services across India',
    services: SERVICES.filter(s =>
      ['one-way-cab', 'round-trip', 'airport-transfer', 'outstation-cab', 'local-taxi', 'chauffeur-service'].includes(s.slug)
    ),
  },
  {
    name: 'Bus & Group Travel',
    description: 'Travel together with group transport',
    services: SERVICES.filter(s =>
      ['tempo-traveller', 'bus-rental', ].includes(s.slug)
    ),
  },
  {
    name: 'Truck & Logistics',
    description: 'Transport goods and cargo',
    services: SERVICES.filter(s =>
      ['truck-rental', 'mini-truck-rental', 'packers-and-movers'].includes(s.slug)
    ),
  },
  {
    name: 'Equipment Rental',
    description: 'Construction & industrial equipment',
    services: SERVICES.filter(s =>
      ['equipment-rental'].includes(s.slug)
    ),
  },
];

const BASE_URL = 'https://transrentals.in';

const servicesItemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Vehicle Rental Services — TransRentals',
  description: 'Complete range of vehicle rental and transportation services across India',
  url: `${BASE_URL}/services`,
  itemListElement: serviceCategories.flatMap((cat, catIndex) =>
    cat.services.map((s, i) => ({
      '@type': 'ListItem',
      position: catIndex * 10 + i + 1,
      name: s.name,
      url: `${BASE_URL}${s.base_url}`,
      description: s.description,
    }))
  ),
};

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const filteredServices = searchQuery
    ? SERVICES.filter(
        s =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesItemListSchema) }}
      />
      <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Our Services</h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              Discover our complete range of vehicle rental and transportation services across India
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-gray-900 placeholder-gray-500 shadow-lg focus:outline-none focus:ring-4 focus:ring-white/30"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {searchQuery && (
        <section className="py-8 bg-white border-b">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {filteredServices.length} {filteredServices.length === 1 ? 'result' : 'results'} for "{searchQuery}"
            </h2>
            {filteredServices.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredServices.map((service) => (
                  <Link
                    key={service.id}
                    href={service.base_url}
                    className="group bg-gray-50 hover:bg-green-50 rounded-xl p-4 transition-all duration-300 hover:shadow-lg border border-gray-100 hover:border-green-200"
                  >
                    <div className="text-3xl mb-2">{service.icon}</div>
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-green-700 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{service.description}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No services found matching your search.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* All Services Grid */}
      {!searchQuery && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            {/* Quick Links */}
            <div className="flex flex-wrap gap-2 mb-8">
              {serviceCategories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => {
                    const element = document.getElementById(category.name.toLowerCase().replace(/\s+/g, '-'));
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors border border-gray-200 hover:border-green-200"
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Categories */}
            <div className="space-y-12">
              {serviceCategories.map((category) => (
                <div
                  key={category.name}
                  id={category.name.toLowerCase().replace(/\s+/g, '-')}
                  className="scroll-mt-24"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                      <p className="text-gray-500">{category.description}</p>
                    </div>
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                      className="md:hidden flex items-center gap-1 text-green-600 font-medium"
                    >
                      {expandedCategory === category.name ? 'Show Less' : 'Show All'}
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedCategory === category.name ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${
                    expandedCategory !== category.name && 'max-md:[&>*:nth-child(n+5)]:hidden'
                  }`}>
                    {category.services.map((service) => (
                      <Link
                        key={service.id}
                        href={service.base_url}
                        className="group bg-white hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl border-2 border-gray-100 hover:border-green-200"
                      >
                        <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                          {service.icon}
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-green-700 transition-colors">
                          {service.name}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                          {service.description}
                        </p>
                        <div className="flex items-center gap-1 text-green-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Book Now
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Can't find what you need?</h2>
              <p className="text-gray-300">Contact us for custom vehicle rental solutions</p>
            </div>
            <Link
              href="/contact"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
            >
              Contact Us
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
      </main>
    </>
  );
}
