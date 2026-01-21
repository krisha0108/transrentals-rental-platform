'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Plane,
  Train,
  Building2,
  ShoppingBag,
  Car,
  Bike,
  Navigation,
  Phone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { RentalHub, getHubsByCity, getHubsByCityAndService, ALL_RENTAL_HUBS, getCitiesWithSelfDrive, getCitiesWithBikeRental } from '@/data/rental-hubs';
import { ALL_CITIES } from '@/data/indian-cities';

interface HubsGridProps {
  citySlug?: string;
  serviceType: 'self-drive' | 'bike';
  title?: string;
}

const hubTypeIcons: Record<string, React.ReactNode> = {
  airport: <Plane className="w-5 h-5" />,
  railway: <Train className="w-5 h-5" />,
  metro: <Navigation className="w-5 h-5" />,
  mall: <ShoppingBag className="w-5 h-5" />,
  hub: <Building2 className="w-5 h-5" />,
  office: <Building2 className="w-5 h-5" />,
};

const hubTypeColors: Record<string, string> = {
  airport: 'bg-blue-100 text-blue-600',
  railway: 'bg-orange-100 text-orange-600',
  metro: 'bg-green-100 text-green-600',
  mall: 'bg-purple-100 text-purple-600',
  hub: 'bg-gray-100 text-gray-600',
  office: 'bg-yellow-100 text-yellow-600',
};

function HubCard({ hub, serviceType }: { hub: RentalHub; serviceType: 'self-drive' | 'bike' }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${hubTypeColors[hub.type]}`}>
          {hubTypeIcons[hub.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{hub.name}</h3>
            {hub.operatingHours.is24x7 && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">24/7</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{hub.address}</p>
          {hub.landmark && (
            <p className="text-xs text-gray-500 mb-2">📍 {hub.landmark}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {hub.operatingHours.is24x7
                ? 'Open 24 hours'
                : `${hub.operatingHours.open} - ${hub.operatingHours.close}`
              }
            </span>
          </div>
          {hub.amenities && hub.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {hub.amenities.slice(0, 3).map((amenity) => (
                <span key={amenity} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {amenity}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hub.address + ', ' + hub.city)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          Get Directions
        </a>
        <Link
          href={`/${serviceType === 'bike' ? 'bike-on-rent' : 'car-rental'}/${hub.citySlug}?hub=${hub.slug}`}
          className="flex-1 text-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          View Vehicles
        </Link>
      </div>
    </div>
  );
}

export function HubsGrid({ citySlug, serviceType, title }: HubsGridProps) {
  const [expandedCities, setExpandedCities] = useState<string[]>(citySlug ? [citySlug] : []);

  // If citySlug is provided, show hubs for that city
  // Otherwise, show all cities with hubs
  const citiesWithHubs = serviceType === 'bike' ? getCitiesWithBikeRental() : getCitiesWithSelfDrive();

  const toggleCity = (city: string) => {
    setExpandedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  if (citySlug) {
    const hubs = getHubsByCityAndService(citySlug, serviceType);
    const cityName = ALL_CITIES.find(c => c.slug === citySlug)?.name || citySlug;

    if (hubs.length === 0) {
      return (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Pickup Points in {cityName}</h2>
              <p className="text-gray-600">
                We're expanding to {cityName} soon. Meanwhile, check nearby cities.
              </p>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {title || `Pickup Points in ${cityName}`}
            </h2>
            <p className="text-gray-600">
              {hubs.length} convenient locations to pick up your {serviceType === 'bike' ? 'bike' : 'car'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hubs.map((hub) => (
              <HubCard key={hub.id} hub={hub} serviceType={serviceType} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Show all cities with hubs
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {title || `${serviceType === 'bike' ? 'Bike Rental' : 'Self-Drive Car'} Locations`}
          </h2>
          <p className="text-gray-600">
            Available in {citiesWithHubs.length} cities with {ALL_RENTAL_HUBS.filter(h => h.services.includes(serviceType)).length}+ pickup points
          </p>
        </div>

        <div className="space-y-4">
          {citiesWithHubs.map((citySlug) => {
            const city = ALL_CITIES.find(c => c.slug === citySlug);
            const hubs = getHubsByCityAndService(citySlug, serviceType);

            return (
              <div key={citySlug} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleCity(citySlug)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">{city?.name || citySlug}</h3>
                      <p className="text-sm text-gray-500">{city?.state} • {hubs.length} pickup points</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/${serviceType === 'bike' ? 'bike-on-rent' : 'car-rental'}/${citySlug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium hidden md:block"
                    >
                      View All Vehicles →
                    </Link>
                    {expandedCities.includes(citySlug) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {expandedCities.includes(citySlug) && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {hubs.map((hub) => (
                        <div key={hub.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${hubTypeColors[hub.type]}`}>
                              {hubTypeIcons[hub.type]}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-medium text-gray-900 text-sm truncate">{hub.name}</h4>
                              <p className="text-xs text-gray-500">{hub.landmark || hub.address}</p>
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {hub.operatingHours.is24x7 ? '24/7' : `${hub.operatingHours.open}-${hub.operatingHours.close}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 md:hidden">
                      <Link
                        href={`/${serviceType === 'bike' ? 'bike-on-rent' : 'car-rental'}/${citySlug}`}
                        className="block w-full text-center py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        View All Vehicles in {city?.name}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Quick hub selector for booking forms
export function HubSelector({
  citySlug,
  serviceType,
  selectedHub,
  onSelect,
}: {
  citySlug: string;
  serviceType: 'self-drive' | 'bike';
  selectedHub?: string;
  onSelect: (hubSlug: string) => void;
}) {
  const hubs = getHubsByCityAndService(citySlug, serviceType);

  if (hubs.length === 0) {
    return <p className="text-sm text-gray-500">No pickup points available in this city</p>;
  }

  return (
    <div className="space-y-2">
      {hubs.map((hub) => (
        <label
          key={hub.id}
          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
            selectedHub === hub.slug
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="pickup-hub"
            value={hub.slug}
            checked={selectedHub === hub.slug}
            onChange={() => onSelect(hub.slug)}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{hub.name}</span>
              {hub.operatingHours.is24x7 && (
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">24/7</span>
              )}
            </div>
            <p className="text-xs text-gray-500">{hub.address}</p>
          </div>
        </label>
      ))}
    </div>
  );
}
