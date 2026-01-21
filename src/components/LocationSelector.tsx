'use client';

/**
 * Location Selector Component
 * Appears in header - allows users to select/change their city
 *
 * Behavior:
 * - On homepage/general pages: Shows ALL locations from database
 * - On service pages (e.g., /bike-on-rent/ahmedabad): Shows ONLY locations assigned to that service
 * - When location is selected on a service page: Redirects to the same service with new location
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Search, Loader2, Navigation, Check } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { City } from '@/data/indian-cities';
import { detectLocationByBrowser, detectLocationByIP } from '@/lib/location';
import { useLocations } from '@/components/booking/useLocations';
import { usePathname, useRouter } from 'next/navigation';

// List of service routes that support location-based URLs
const SERVICE_ROUTES = [
  'bike-on-rent',
  'car-rental',
  'bus-rental',
  'transporter',
  'equipment-rental',
  'activa-on-rent',
  'royal-enfield-on-rent',
  'airport-transfer',
  'chauffeur-service',
  'corporate-bus-rental',
  'corporate-car-rental',
  'jcb-on-rent',
  'local-taxi',
  'luxury-car-rental',
  'mini-truck-rental',
  'monthly-car-rental',
  'one-way-car-rental',
  'outstation-cab',
  'outstation-car-rental',
  'packers-and-movers',
  'sports-car-rental',
  'tempo-traveller',
  'trailer-on-rent',
  'vintage-car-rental',
  'wedding-bus-rental',
  'wedding-car-rental',
  'self-drive-car-rentals',
];

// Map URL service slugs to database service slugs (if different)
const SERVICE_SLUG_MAP: Record<string, string> = {
  'bike-on-rent': 'bike-rental',
  'activa-on-rent': 'scooter-rental',
  'royal-enfield-on-rent': 'cruiser-rental',
  'self-drive-car-rentals': 'self-drive-car-rental',
  'jcb-on-rent': 'jcb-rental',
  'trailer-on-rent': 'trailer-rental',
  // Add more mappings as needed
};

export function LocationSelector() {
  const { currentCity, setCity, isDetecting } = useLocation();
  const pathname = usePathname();
  const router = useRouter();

  // Extract service and location from current URL
  const { serviceSlug, urlLocationSlug } = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && SERVICE_ROUTES.includes(segments[0])) {
      const urlService = segments[0];
      // Map to database service slug if different
      const dbServiceSlug = SERVICE_SLUG_MAP[urlService] || urlService;
      return {
        serviceSlug: dbServiceSlug,
        urlServiceSlug: urlService,
        urlLocationSlug: segments[1] || null,
      };
    }
    return { serviceSlug: null, urlServiceSlug: null, urlLocationSlug: null };
  }, [pathname]);

  // Fetch locations - service-specific if on a service page, all locations otherwise
  const { locations, isLoading: isLoadingLocations, isServiceSpecific } = useLocations({
    serviceSlug: serviceSlug,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectionFeedback, setDetectionFeedback] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Convert database locations to City format - memoized to prevent infinite loops
  const dbLocationsAsCity: City[] = useMemo(() => {
    return locations.map((loc) => ({
      name: loc.name,
      slug: loc.slug || loc.name.toLowerCase().replace(/\s+/g, '-'),
      state: loc.state ?? '',
      stateCode: loc.stateCode ?? '',
      priority: loc.priority ?? 5,
      tier: (loc.tier ?? 1) as 1 | 2 | 3 | 4,
      keywords: loc.keywords ?? [],
    }));
  }, [locations]);

  // Update current city from URL location if on a service page
  useEffect(() => {
    if (urlLocationSlug && dbLocationsAsCity.length > 0) {
      const matchingCity = dbLocationsAsCity.find(
        (city) => city.slug === urlLocationSlug || city.name.toLowerCase().replace(/\s+/g, '-') === urlLocationSlug
      );
      if (matchingCity && matchingCity.slug !== currentCity.slug) {
        setCity(matchingCity, 'url');
      }
    }
  }, [urlLocationSlug, dbLocationsAsCity, currentCity.slug, setCity]);



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter cities from database as user types
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const query = searchQuery.toLowerCase();
      const results = dbLocationsAsCity.filter(city =>
        city.name.toLowerCase().includes(query)
      ).slice(0, 10);
      setFilteredCities(results);
    } else {
      setFilteredCities([]);
    }
  }, [searchQuery, dbLocationsAsCity]); // dbLocationsAsCity is now memoized, safe to use

  // Get the URL service slug (for navigation, we need the URL slug, not DB slug)
  const getUrlServiceSlug = (): string | null => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && SERVICE_ROUTES.includes(segments[0])) {
      return segments[0];
    }
    return null;
  };

  // Handle city selection - navigate to new location URL if on a service page
  const handleCitySelect = (city: City) => {
    setCity(city);
    setIsOpen(false);
    setSearchQuery('');
    setFilteredCities([]);
    setDetectionFeedback(null);

    // Check if we're on a service page and navigate to the new location
    const urlService = getUrlServiceSlug();
    if (urlService) {
      const newUrl = `/${urlService}/${city.slug}`;
      router.push(newUrl);
    }
  };

  // Detect user's location using browser API
  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    setDetectionFeedback('Checking your location...');
    try {
      const detected = await detectLocationByBrowser();
      if (detected) {
        // Check if detected location is available for this service
        const isAvailable = dbLocationsAsCity.some(
          (city) => city.slug === detected.slug || city.name.toLowerCase() === detected.name.toLowerCase()
        );

        if (isAvailable || !serviceSlug) {
          setCity(detected, 'browser');
          setIsOpen(false);
          setDetectionFeedback(`Detected location: ${detected.name}${detected.state ? `, ${detected.state}` : ''}`);
          // Navigate to new location if on a service page
          const urlService = getUrlServiceSlug();
          if (urlService) {
            router.push(`/${urlService}/${detected.slug}`);
          }
          return;
        } else {
          setDetectionFeedback(`${detected.name} is not available for this service. Please select from available cities.`);
          return;
        }
      } else {
        setDetectionFeedback('Browser location access was blocked. Falling back to IP-based detection...');
      }
      const fallback = await detectLocationByIP();
      if (fallback) {
        // Check if fallback location is available for this service
        const isAvailable = dbLocationsAsCity.some(
          (city) => city.slug === fallback.slug || city.name.toLowerCase() === fallback.name.toLowerCase()
        );

        if (isAvailable || !serviceSlug) {
          setCity(fallback, 'ip');
          setIsOpen(false);
          setDetectionFeedback(`Detected location: ${fallback.name}${fallback.state ? `, ${fallback.state}` : ''}`);
          // Navigate to new location if on a service page
          const urlService = getUrlServiceSlug();
          if (urlService) {
            router.push(`/${urlService}/${fallback.slug}`);
          }
          return;
        } else {
          setDetectionFeedback(`${fallback.name} is not available for this service. Please select from available cities.`);
          return;
        }
      }
      setDetectionFeedback('Unable to detect your location. Please select manually.');
    } catch (error) {
      console.error('Location detection failed:', error);
      setDetectionFeedback('Location detection failed. Please select manually.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Show top 12 cities when not searching, filtered results when searching
  const citiesToShow = searchQuery.trim().length >= 2 ? filteredCities : dbLocationsAsCity.slice(0, 12);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current City Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20
                   text-white transition-all duration-200 border border-white/20"
        aria-label="Select city"
      >
        {isDetecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium hidden sm:inline">Detecting...</span>
          </>
        ) : (
          <>
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:inline">{currentCity.name}</span>
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[340px] bg-white rounded-xl shadow-2xl
                        border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <h3 className="font-semibold text-base">Select Your City</h3>
            <p className="text-xs text-orange-100 mt-1">
              {isServiceSpecific
                ? 'Showing cities where this service is available'
                : "We'll show you relevant services in your city"}
            </p>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for your city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
           focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
           text-sm text-gray-900 placeholder-gray-400"

                autoFocus
              />
            </div>
          </div>

          {/* Detect Location Button */}
          <div className="p-3 border-b border-gray-200 space-y-2">
            <button
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
              className="w-full flex items-center justify-center gap-2 px-4 py-2
                         bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg
                         transition-colors duration-200 text-sm font-medium
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDetectingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Detecting your location...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  Detect My Location
                </>
              )}
            </button>
            {detectionFeedback && (
              <p className="text-xs text-center text-gray-500" aria-live="polite">
                {detectionFeedback}
              </p>
            )}
          </div>

          {/* Cities List */}
          <div className="max-h-[320px] overflow-y-auto">
            {isLoadingLocations ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-500" />
                <p className="text-sm text-gray-500 mt-2">Loading locations...</p>
              </div>
            ) : searchQuery.trim().length >= 2 && filteredCities.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">No cities found matching "{searchQuery}"</p>
              </div>
            ) : (
              <>
                {!searchQuery && (
                  <div className="px-4 py-2 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {isServiceSpecific
                        ? `Service Available in ${dbLocationsAsCity.length} Cities`
                        : `Available Cities (${dbLocationsAsCity.length})`}
                    </p>
                  </div>
                )}

                <div className="divide-y divide-gray-100">
                  {citiesToShow.map((city) => (
                    <button
                      key={city.slug}
                      onClick={() => handleCitySelect(city)}
                      className="w-full flex items-center justify-between px-4 py-3
                                 hover:bg-orange-50 transition-colors duration-150 text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8
                                        rounded-lg bg-gray-100 group-hover:bg-orange-100
                                        transition-colors duration-150">
                          <MapPin className="h-4 w-4 text-gray-600 group-hover:text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{city.name}</p>
                          <p className="text-xs text-gray-500">{city.state}</p>
                        </div>
                      </div>

                      {currentCity.slug === city.slug && (
                        <Check className="h-5 w-5 text-orange-600" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {searchQuery.trim().length < 2 && (
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                {isServiceSpecific
                  ? "Can't find your city? This service may not be available there yet."
                  : "Can't find your city? We're expanding soon!"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
