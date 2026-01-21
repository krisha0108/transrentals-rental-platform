'use client';

import { useState } from 'react';
import Image from 'next/image';

// Fallback images by vehicle type/category - reliable placeholder images
const FALLBACK_IMAGES: Record<string, string> = {
  // Bikes by type
  'cruiser': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
  'adventure': 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&h=600&fit=crop',
  'naked sport': 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&h=600&fit=crop',
  'scooter': 'https://images.unsplash.com/photo-1558980664-10e7170b5df9?w=800&h=600&fit=crop',
  'commuter': 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&h=600&fit=crop',

  // Cars by type
  'hatchback': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
  'sedan': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=600&fit=crop',
  'suv': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&h=600&fit=crop',
  'premium suv': 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop',
  'muv': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&h=600&fit=crop',
  'luxury sedan': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop',
  'luxury suv': 'https://images.unsplash.com/photo-1519245659620-e859806a8d3b?w=800&h=600&fit=crop',

  // Buses
  'mini bus': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop',
  'luxury coach': 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&h=600&fit=crop',

  // Category fallbacks
  'bike': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
  'car': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
  'bus': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop',
  'truck': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=600&fit=crop',
  'equipment': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop',

  // Default
  'default': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
};


interface VehicleImageProps {
  src: string;
  alt: string;
  vehicleType: string;
  vehicleCategory: 'bike' | 'car' | 'bus' | 'truck' | 'equipment';
  className?: string;
  sizes?: string;
}

export function VehicleImage({
  src,
  alt,
  vehicleType,
  vehicleCategory,
  className = "object-cover",
}: VehicleImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const getFallbackImage = () => {
    const typeKey = vehicleType.toLowerCase();

    // Try to match by vehicle type first
    if (FALLBACK_IMAGES[typeKey]) {
      return FALLBACK_IMAGES[typeKey];
    }

    // Fall back to category
    if (FALLBACK_IMAGES[vehicleCategory]) {
      return FALLBACK_IMAGES[vehicleCategory];
    }

    // Ultimate fallback
    return FALLBACK_IMAGES['default'];
  };

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(getFallbackImage());
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
      onError={handleError}
    />
  );
}
