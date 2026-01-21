'use client';

/**
 * Location Context Provider
 * Manages user's selected city across the entire application
 * Auto-detects user location using GPS on page load
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { City } from '@/data/indian-cities';
import {
  detectUserLocation,
  getSavedLocation,
  setUserLocation as saveUserLocation,
  LocationData,
  getDefaultCity,
  detectLocationByBrowserWithLocations,
  saveLocation,
  checkGeolocationPermission,
} from '@/lib/location';
import { bookingService } from '@/lib/api/services/bookingService';

interface LocationContextType {
  currentCity: City;
  locationData: LocationData | null;
  isDetecting: boolean;
  setCity: (city: City, detectionMethod?: LocationData['detectionMethod']) => void;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
  initialCity?: City;
}

export function LocationProvider({ children, initialCity }: LocationProviderProps) {
  const [currentCity, setCurrentCity] = useState<City>(initialCity || getDefaultCity());
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);

  // Detect location on mount - prioritize database locations with GPS
  useEffect(() => {
    const detectLocation = async () => {
      try {
        setIsDetecting(true);
        const saved = getSavedLocation();
        if (saved?.city && saved.detectionMethod !== 'manual') {
          setLocationData(saved);
          setCurrentCity(saved.city);
          return;
        }
        const data = await detectUserLocation({
          forceRefresh: saved?.detectionMethod === 'manual',
        });
        setLocationData(data);
        if (data.city) {
          setCurrentCity(data.city);
          console.log('✅ Fallback city:', data.city.name, 'method:', data.detectionMethod);
        }
      } catch (error) {
        console.error('❌ Location detection failed:', error);
        // Fall back to default
        setCurrentCity(getDefaultCity());
      } finally {
        setIsDetecting(false);
      }
    };

    detectLocation();
  }, []);

  // Update city and save to storage
  const setCity = (city: City, detectionMethod: LocationData['detectionMethod'] = 'manual') => {
    setCurrentCity(city);
    saveUserLocation(city, detectionMethod);

    const data: LocationData = {
      city,
      detectionMethod,
      timestamp: Date.now(),
    };

    saveLocation(data);

    // Update location data
    setLocationData(data);

    // Emit custom event for other components to listen
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cityChanged', { detail: city }));
    }
  };

  // Refresh location (re-detect)
  const refreshLocation = async () => {
    try {
      setIsDetecting(true);
      const data = await detectUserLocation({ forceRefresh: true });
      setLocationData(data);
      if (data.city) {
        setCurrentCity(data.city);
      }
    } catch (error) {
      console.error('Location refresh failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const value: LocationContextType = {
    currentCity,
    locationData,
    isDetecting,
    setCity,
    refreshLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

// Custom hook to use location context
export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

// Hook to get city-specific URL
export function useCityUrl(servicePath?: string): string {
  const { currentCity } = useLocation();

  if (!servicePath) {
    return `/${currentCity.slug}`;
  }

  // Remove leading slash if present
  const cleanPath = servicePath.startsWith('/') ? servicePath.slice(1) : servicePath;

  return `/${currentCity.slug}/${cleanPath}`;
}

// Hook to get city-specific metadata
export function useCityMetadata() {
  const { currentCity } = useLocation();

  return {
    title: (baseTitle: string) => `${baseTitle} in ${currentCity.name} | TransRentals`,
    description: (baseDescription: string) =>
      baseDescription.replace('{city}', currentCity.name).replace('{CITY}', currentCity.name),
    keywords: [...currentCity.keywords, currentCity.name.toLowerCase(), currentCity.slug],
  };
}
