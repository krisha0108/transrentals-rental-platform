'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Star, Users, Fuel, Settings, Shield, Crown, ChevronRight } from 'lucide-react';

export interface LuxuryVehicle {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  type: string;
  basePrice: number;
  features: string[];
  specs: {
    engine?: string;
    mileage?: string;
    seating?: number;
    transmission?: string;
    fuelType?: string;
    horsepower?: string;
  };
  images: string[];
  imageUrl?: string;
  rating?: number;
  isPopular?: boolean;
}

interface LuxuryVehicleCardProps {
  vehicle: LuxuryVehicle;
  location?: string;
  locationSlug?: string;
  onBookNow?: (vehicle: LuxuryVehicle) => void;
  variant?: 'default' | 'featured' | 'compact';
}

export function LuxuryVehicleCard({
  vehicle,
  location,
  locationSlug,
  onBookNow,
  variant = 'default',
}: LuxuryVehicleCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getImageUrl = () => {
    if (imageError) {
      return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop';
    }
    return vehicle.imageUrl || vehicle.images?.[0] || `/images/fleet/${vehicle.slug}.jpg`;
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBookNow?.(vehicle);
  };

  if (variant === 'featured') {
    return (
      <div
        className="group relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleBookClick}
      >
        {/* Premium Badge */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Crown className="w-3 h-3" />
            Premium
          </span>
          {vehicle.isPopular && (
            <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
              Most Popular
            </span>
          )}
        </div>

        {/* Vehicle Image */}
        <div className="relative h-72 overflow-hidden">
          <Image
            src={getImageUrl()}
            alt={vehicle.name}
            fill
            className={`object-cover transition-all duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => setImageError(true)}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative p-6 -mt-20 z-10">
          {/* Brand */}
          <p className="text-amber-400 text-sm font-semibold uppercase tracking-widest mb-1">
            {vehicle.brand}
          </p>

          {/* Name */}
          <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-amber-400 transition-colors">
            {vehicle.name}
          </h3>

          {/* Specs */}
          <div className="flex flex-wrap gap-3 mb-4">
            {vehicle.specs.seating && (
              <span className="flex items-center gap-1.5 text-gray-300 text-sm">
                <Users className="w-4 h-4 text-amber-400" />
                {vehicle.specs.seating} Seats
              </span>
            )}
            {vehicle.specs.transmission && (
              <span className="flex items-center gap-1.5 text-gray-300 text-sm">
                <Settings className="w-4 h-4 text-amber-400" />
                {vehicle.specs.transmission}
              </span>
            )}
            {vehicle.specs.fuelType && (
              <span className="flex items-center gap-1.5 text-gray-300 text-sm">
                <Fuel className="w-4 h-4 text-amber-400" />
                {vehicle.specs.fuelType}
              </span>
            )}
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-4">
            {vehicle.features.slice(0, 3).map((feature, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300 border border-white/10"
              >
                {feature}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-end justify-end pt-4 border-t border-white/10">
            <button
              onClick={handleBookClick}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-gray-900 px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 group-hover:shadow-lg group-hover:shadow-amber-500/25"
            >
              Book Now
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleBookClick}
    >
      {/* Premium Ribbon */}
      <div className="absolute top-0 right-0 z-20">
        <div className="bg-gradient-to-r from-purple-900 to-purple-700 text-white px-4 py-1 text-xs font-bold uppercase tracking-wider transform rotate-0 origin-top-right rounded-bl-lg">
          Luxury
        </div>
      </div>

      {/* Rating Badge */}
      {vehicle.rating && (
        <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-sm font-bold text-gray-800">{vehicle.rating}</span>
        </div>
      )}

      {/* Vehicle Image */}
      <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        <Image
          src={getImageUrl()}
          alt={vehicle.name}
          fill
          className={`object-cover transition-all duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => setImageError(true)}
        />
        {/* Hover Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-purple-900/80 via-transparent to-transparent transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

        {/* Quick Book Button on Hover */}
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-500 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button
            onClick={handleBookClick}
            className="bg-white text-purple-900 px-6 py-2 rounded-full font-bold text-sm hover:bg-amber-400 hover:text-gray-900 transition-colors shadow-lg"
          >
            Quick Book
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Brand & Type */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-purple-700 text-xs font-bold uppercase tracking-widest">
            {vehicle.brand}
          </p>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {vehicle.type}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-900 transition-colors line-clamp-1">
          {vehicle.name}
        </h3>

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {vehicle.specs.seating && (
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <Users className="w-4 h-4 mx-auto text-purple-600 mb-1" />
              <p className="text-xs text-gray-600">{vehicle.specs.seating} Seats</p>
            </div>
          )}
          {vehicle.specs.transmission && (
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <Settings className="w-4 h-4 mx-auto text-purple-600 mb-1" />
              <p className="text-xs text-gray-600">{vehicle.specs.transmission}</p>
            </div>
          )}
          {vehicle.specs.fuelType && (
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <Fuel className="w-4 h-4 mx-auto text-purple-600 mb-1" />
              <p className="text-xs text-gray-600">{vehicle.specs.fuelType}</p>
            </div>
          )}
        </div>

        {/* Features Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {vehicle.features.slice(0, 2).map((feature, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700"
            >
              <Shield className="w-3 h-3" />
              {feature}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-4" />

        {/* Action */}
        <div className="flex items-end justify-end">
          <button
            onClick={handleBookClick}
            className="bg-gradient-to-r from-purple-900 to-purple-700 hover:from-purple-800 hover:to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-1.5 shadow-md hover:shadow-lg"
          >
            Book
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default LuxuryVehicleCard;
