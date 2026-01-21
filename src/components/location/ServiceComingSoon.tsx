'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Clock, Bell, ArrowRight, Phone, Mail } from 'lucide-react';

interface ServiceComingSoonProps {
  serviceName: string;
  serviceSlug: string;
  locationName: string;
  locationSlug: string;
  nearbyLocations?: { name: string; slug: string; state?: string }[];
}

export function ServiceComingSoon({
  serviceName,
  serviceSlug,
  locationName,
  locationSlug,
  nearbyLocations = [],
}: ServiceComingSoonProps) {
  return (
    <div className="min-h-[70vh] flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href={`/${serviceSlug}`} className="hover:text-primary">{serviceName}</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gradient-to-b from-indigo-50 to-white">
        <div className="container-custom py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-8 shadow-lg">
              <Clock className="w-10 h-10 text-white" />
            </div>

            {/* Heading */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Coming Soon to {locationName}!
            </h1>

            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              We're working hard to bring our {serviceName.toLowerCase()} services to {locationName}.
              Stay tuned - we'll be there soon!
            </p>

            {/* Features Coming */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center justify-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                What to Expect
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-indigo-50 rounded-xl">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">🚗</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Wide Selection</h3>
                  <p className="text-sm text-gray-600">Premium vehicles for every need</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">💰</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Best Prices</h3>
                  <p className="text-sm text-gray-600">Competitive rates guaranteed</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">⭐</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Verified Vendors</h3>
                  <p className="text-sm text-gray-600">Trusted service partners</p>
                </div>
              </div>
            </div>

            {/* Contact for Early Access */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white mb-10">
              <h3 className="text-xl font-semibold mb-3">Need {serviceName} in {locationName} urgently?</h3>
              <p className="text-indigo-100 mb-6">Contact us and we'll try to arrange it for you!</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="tel:+919737965551"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  +91 9737965551
                </a>
                <a
                  href="mailto:book@transrentals.in"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/30"
                >
                  <Mail className="w-5 h-5" />
                  book@transrentals.in
                </a>
              </div>
            </div>

            {/* Nearby Available Locations */}
            {nearbyLocations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center justify-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  {serviceName} Available Nearby
                </h2>
                <p className="text-gray-600 mb-6">Check out our services in these nearby cities</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {nearbyLocations.map((city) => (
                    <Link
                      key={city.slug}
                      href={`/${serviceSlug}/${city.slug}`}
                      className="group p-4 bg-gray-50 hover:bg-indigo-50 rounded-xl transition-all border border-gray-200 hover:border-indigo-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {city.name}
                          </p>
                          {city.state && (
                            <p className="text-xs text-gray-500">{city.state}</p>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="mt-6">
                  <Link
                    href={`/${serviceSlug}`}
                    className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
                  >
                    View All Available Locations
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
