'use client';

import Link from 'next/link';
import { Vehicle as StaticVehicle, getVehicleImage } from '@/data/fleet';
import { VehicleImage } from './VehicleImage';

// Dynamic vehicle type from API
export interface DynamicVehicle {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: {
    id: string;
    slug: string;
    name: string;
  };
  vehicleType: string;
  price: number;
  basePrice: number;
  shortDesc?: string;
  specs: any;
  features: any;
  primaryImage?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  availabilityType?: 'ALL_INDIA' | 'SPECIFIC_LOCATIONS';
}

interface VehicleCardProps {
  vehicle: StaticVehicle | DynamicVehicle;
  bgColor: string;
  location?: string; // For location-specific URLs
}

// Type guard to check if it's a static vehicle
function isStaticVehicle(vehicle: StaticVehicle | DynamicVehicle): vehicle is StaticVehicle {
  return 'category' in vehicle && typeof vehicle.category === 'string';
}

export function VehicleCard({ vehicle, bgColor, location }: VehicleCardProps) {
  const isStatic = isStaticVehicle(vehicle);

  // Get image URL
  const imageUrl = isStatic
    ? getVehicleImage(vehicle)
    : (vehicle.primaryImage || '/images/fleet/placeholder.jpg');

  // Get vehicle type
  const type = isStatic ? vehicle.type : vehicle.vehicleType;

  // Get category for emoji
  const categorySlug = isStatic ? vehicle.category : vehicle.category.slug;

  // Get display price
  const displayPrice = isStatic ? vehicle.basePrice : vehicle.price;

  // Get specs text
  const specsText = vehicle.specs?.engine ||
    (vehicle.specs?.seating ? `${vehicle.specs.seating} Seater` : '');

  // Build href
  const href = location
    ? `/fleet/${vehicle.slug}/${location}`
    : `/fleet/${vehicle.slug}`;

  return (
    <Link
      href={href}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition group"
    >
      <div className={`h-48 ${bgColor} relative overflow-hidden`}>
        <VehicleImage
          src={imageUrl}
          alt={vehicle.name}
          vehicleType={type}
          vehicleCategory={categorySlug as 'bike' | 'car' | 'bus' | 'truck' | 'equipment'}
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <span className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded text-xs font-medium">
          {type}
        </span>
        {!isStatic && vehicle.isFeatured && (
          <span className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded text-xs font-medium">
            Featured
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg group-hover:text-primary-600 transition">
          {vehicle.name}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{vehicle.brand}</p>
        {specsText && (
          <p className="text-sm text-gray-500 mt-2">{specsText}</p>
        )}
      </div>
    </Link>
  );
}
