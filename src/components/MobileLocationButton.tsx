'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, X, Search, Navigation, Loader2, Check } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { City } from '@/data/indian-cities';
import { useLocations } from '@/components/booking/useLocations';
import { usePathname, useRouter } from 'next/navigation';
import { detectLocationByBrowser, detectLocationByIP } from '@/lib/location';
import { createPortal } from 'react-dom';

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

const SERVICE_SLUG_MAP: Record<string, string> = {
  'bike-on-rent': 'bike-rental',
  'activa-on-rent': 'scooter-rental',
  'royal-enfield-on-rent': 'cruiser-rental',
  'self-drive-car-rentals': 'self-drive-car-rental',
  'jcb-on-rent': 'jcb-rental',
  'trailer-on-rent': 'trailer-rental',
};

export function MobileLocationButton() {
  const { currentCity, setCity, isDetecting } = useLocation();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectionFeedback, setDetectionFeedback] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // For SSR safety
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      // Cleanup on unmount
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  // Extract service from URL
  const serviceSlug = React.useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && SERVICE_ROUTES.includes(segments[0])) {
      const urlService = segments[0];
      return SERVICE_SLUG_MAP[urlService] || urlService;
    }
    return null;
  }, [pathname]);

  const { locations, isLoading: isLoadingLocations } = useLocations({
    serviceSlug: serviceSlug,
  });

  // Convert locations to City format
  const dbLocationsAsCity: City[] = React.useMemo(() => {
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

  // Filter cities
  const filteredCities = React.useMemo(() => {
    if (searchQuery.trim().length >= 2) {
      const query = searchQuery.toLowerCase();
      return dbLocationsAsCity
        .filter((city) => city.name.toLowerCase().includes(query))
        .slice(0, 20);
    }
    return dbLocationsAsCity.slice(0, 20);
  }, [searchQuery, dbLocationsAsCity]);

  // Handle city selection
  const handleCitySelect = (city: City) => {
    setCity(city);
    setIsOpen(false);
    setSearchQuery('');
    setDetectionFeedback(null);

    // Navigate if on service page
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && SERVICE_ROUTES.includes(segments[0])) {
      router.push(`/${segments[0]}/${city.slug}`);
    }
  };

  // Detect location
  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    setDetectionFeedback('Detecting location...');
    try {
      const detected = await detectLocationByBrowser();
      if (detected) {
        const isAvailable = dbLocationsAsCity.some(
          (city) =>
            city.slug === detected.slug ||
            city.name.toLowerCase() === detected.name.toLowerCase()
        );

        if (isAvailable || !serviceSlug) {
          setCity(detected, 'browser');
          setIsOpen(false);
          setDetectionFeedback(`Detected: ${detected.name}`);

          const segments = pathname.split('/').filter(Boolean);
          if (segments.length > 0 && SERVICE_ROUTES.includes(segments[0])) {
            router.push(`/${segments[0]}/${detected.slug}`);
          }
          return;
        } else {
          setDetectionFeedback(
            `${detected.name} not available for this service`
          );
          return;
        }
      }

      const fallback = await detectLocationByIP();
      if (fallback) {
        const isAvailable = dbLocationsAsCity.some(
          (city) =>
            city.slug === fallback.slug ||
            city.name.toLowerCase() === fallback.name.toLowerCase()
        );

        if (isAvailable || !serviceSlug) {
          setCity(fallback, 'ip');
          setIsOpen(false);
          setDetectionFeedback(`Detected: ${fallback.name}`);

          const segments = pathname.split('/').filter(Boolean);
          if (segments.length > 0 && SERVICE_ROUTES.includes(segments[0])) {
            router.push(`/${segments[0]}/${fallback.slug}`);
          }
          return;
        } else {
          setDetectionFeedback(`${fallback.name} not available for this service`);
          return;
        }
      }
      setDetectionFeedback('Unable to detect location');
    } catch (error) {
      console.error('Location detection failed:', error);
      setDetectionFeedback('Detection failed');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  return (
    <>
      {/* Compact Location Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(true);
        }}
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200"
        aria-label="Select location"
      >
        {isDetecting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MapPin className="w-4 h-4 text-primary" />
        )}
        <span className="text-xs font-medium max-w-[80px] truncate">
          {currentCity.name}
        </span>
      </button>

      {/* Full-screen Mobile Modal - Portaled to body */}
      {isMounted && isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 9998 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Modal - Always slides from bottom */}
          <div
            className="fixed left-0 right-0 bottom-0 flex items-end justify-center"
            style={{ zIndex: 9999, top: '10vh' }}
          >
            <div className="bg-white w-full h-[90vh] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary to-primary/80 text-white shrink-0">
                <div>
                  <h3 className="text-lg font-semibold">Select Your City</h3>
                  <p className="text-xs text-white/80 mt-0.5">
                    {dbLocationsAsCity.length} cities available
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-200 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for your city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    autoFocus
                  />
                </div>
              </div>

              {/* Detect Location */}
              <div className="px-4 py-3 border-b border-gray-200 shrink-0">
                <button
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isDetectingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Detecting...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" />
                      Use My Current Location
                    </>
                  )}
                </button>
                {detectionFeedback && (
                  <p className="text-xs text-center text-gray-500 mt-2">
                    {detectionFeedback}
                  </p>
                )}
              </div>

              {/* Cities List */}
              <div className="flex-1 overflow-y-auto">
                {isLoadingLocations ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-gray-500 mt-2">Loading...</p>
                  </div>
                ) : filteredCities.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-sm">No cities found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredCities.map((city) => (
                      <button
                        key={city.slug}
                        onClick={() => handleCitySelect(city)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <MapPin className="w-5 h-5 text-gray-600 group-hover:text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {city.name}
                            </p>
                            <p className="text-xs text-gray-500">{city.state}</p>
                          </div>
                        </div>
                        {currentCity.slug === city.slug && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0">
                <p className="text-xs text-gray-500 text-center">
                  Select your city to see available services
                </p>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
