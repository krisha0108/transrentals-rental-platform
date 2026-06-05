/**
 * Location Detection & Management System
 * Handles IP-based detection, browser geolocation, and manual selection
 */

import { City, ALL_CITIES } from '@/data/indian-cities';

export interface LocationData {
  city: City | null;
  detectionMethod: 'ip' | 'browser' | 'manual' | 'cookie' | 'default' | 'url';
  timestamp: number;
}

const LOCATION_STORAGE_KEY = 'transrentals_user_location';
const LOCATION_COOKIE_NAME = 'user_city';
const LAST_DETECTED_LOCATION_KEY = 'transrentals_last_detected_location';

/**
 * Get saved location from localStorage
 */
export function getSavedLocation(): LocationData | null {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!saved) return null;

    const data = JSON.parse(saved) as LocationData;

    // Check if saved location is less than 7 days old
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    if (data.timestamp < sevenDaysAgo) {
      // Location too old, clear it
      clearSavedLocation();
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading saved location:', error);
    return null;
  }
}

/**
 * Save location to localStorage and cookie
 */
export function saveLocation(locationData: LocationData): void {
  if (typeof window === 'undefined') return;

  try {
    // Save to localStorage
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));

    // Save to cookie (for SSR)
    if (locationData.city) {
      document.cookie = `${LOCATION_COOKIE_NAME}=${locationData.city.slug}; path=/; max-age=${7 * 24 * 60 * 60}`;
    }
  } catch (error) {
    console.error('Error saving location:', error);
  }
}

/**
 * Clear saved location
 */
export function clearSavedLocation(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(LOCATION_STORAGE_KEY);
    document.cookie = `${LOCATION_COOKIE_NAME}=; path=/; max-age=0`;
  } catch (error) {
    console.error('Error clearing location:', error);
  }
}

/**
 * Save the last detected location separately so we can resurrect it later
 */
export function saveLastDetectedLocation(locationData: LocationData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LAST_DETECTED_LOCATION_KEY, JSON.stringify(locationData));
  } catch (error) {
    console.error('Error saving last detected location:', error);
  }
}

export function getLastDetectedLocation(): LocationData | null {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem(LAST_DETECTED_LOCATION_KEY);
    if (!saved) return null;

    return JSON.parse(saved) as LocationData;
  } catch (error) {
    console.error('Error reading last detected location:', error);
    return null;
  }
}

/**
 * Detect location using IP-based geolocation API
 */
export async function detectLocationByIP(): Promise<City | null> {
  try {
    // Using ipapi.co free API (no key needed for basic usage)
    const response = await fetch('https://ipapi.co/json/');

    if (!response.ok) {
      throw new Error('IP geolocation failed');
    }

    const data = await response.json();
    const cityName = data.city?.toLowerCase();

    if (!cityName) return null;

    // Find matching city in our database
    const matchedCity = ALL_CITIES.find(city =>
      city.name.toLowerCase() === cityName ||
      city.slug === cityName ||
      city.keywords.some(keyword => keyword.toLowerCase() === cityName)
    );

    return matchedCity || null;
  } catch (error) {
    console.error('IP-based detection failed:', error);
    return null;
  }
}

/**
 * Detect location using browser Geolocation API
 * Requires user permission
 */
export async function detectLocationByBrowser(): Promise<City | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Use reverse geocoding via our API proxy to avoid CORS issues
          const response = await fetch(
            `/api/geolocation?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(
              longitude
            )}`
          );

          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            console.error('Reverse lookup proxy error:', errorBody);
            resolve(null);
            return;
          }

          const data = await response.json();
          console.log('📍 Geolocation API response:', JSON.stringify(data).slice(0, 200));

          if (!data.success && !data.address) {
            console.error('📍 Geolocation API returned no data');
            resolve(null);
            return;
          }

          const addr = data.address || {};
          const stateName = addr.state || addr.region || 'India';

          // Collect all possible location names from nominatim (most specific to least)
          const candidates = [
            addr.city,           // Major city (Mumbai, Delhi, Ahmedabad)
            addr.town,           // Smaller town
            addr.county,         // County/district
            addr.state_district, // State district (Thane, Pune district)
            addr.village,
            addr.hamlet,
            addr.suburb,         // Suburb name
          ].filter(Boolean).map((s: string) => s.toLowerCase());

          console.log('📍 GPS location candidates:', candidates, '| State:', stateName);

          if (candidates.length === 0) {
            console.error('📍 Could not extract any location from geolocation data');
            resolve(null);
            return;
          }

          // Try to match against ALL_CITIES — check each candidate
          // Priority: exact name match > slug match > keyword match
          for (const candidate of candidates) {
            const match = ALL_CITIES.find(city =>
              city.name.toLowerCase() === candidate ||
              city.slug === candidate ||
              city.keywords.some(kw => kw.toLowerCase() === candidate)
            );
            if (match) {
              console.log('📍 Matched city:', match.name, 'from candidate:', candidate);
              resolve(match);
              return;
            }
          }

          // Try partial match — candidate contains city name or vice versa
          for (const candidate of candidates) {
            const match = ALL_CITIES.find(city =>
              candidate.includes(city.name.toLowerCase()) ||
              city.name.toLowerCase().includes(candidate) ||
              city.keywords.some(kw => candidate.includes(kw.toLowerCase()))
            );
            if (match) {
              console.log('📍 Partial matched city:', match.name, 'from candidate:', candidate);
              resolve(match);
              return;
            }
          }

          // Try matching by state — find highest priority city in same state
          const stateMatch = ALL_CITIES
            .filter(city => city.state.toLowerCase() === stateName.toLowerCase())
            .sort((a, b) => b.priority - a.priority)[0];

          if (stateMatch) {
            console.log('📍 State fallback city:', stateMatch.name, 'for state:', stateName);
            resolve(stateMatch);
            return;
          }

          console.log('📍 No match found, using default');
          resolve(null);
        } catch (error) {
          console.error('Browser geolocation reverse lookup failed:', error);
          resolve(null);
        }
      },
      (error) => {
        console.error('Browser geolocation denied:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Check if geolocation permission is already granted
 */
export async function checkGeolocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (typeof window === 'undefined' || !navigator.permissions) {
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch {
    return 'prompt';
  }
}

/**
 * Detect location using browser Geolocation API with custom locations list
 * For matching against database locations
 * Only auto-detects if permission was already granted
 */
export async function detectLocationByBrowserWithLocations<T extends { name: string; state?: string }>(
  locations: T[],
  requirePermissionGranted: boolean = false
): Promise<T | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null;
  }

  // If requirePermissionGranted is true, check permission first
  if (requirePermissionGranted) {
    const permission = await checkGeolocationPermission();
    console.log('🔐 Geolocation permission status:', permission);
    if (permission !== 'granted') {
      console.log('⚠️ Geolocation permission not granted, skipping auto-detect');
      return null;
    }
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Use our API route to avoid CORS issues
          const response = await fetch(
            `/api/geocode?lat=${latitude}&lon=${longitude}`
          );

          if (!response.ok) {
            resolve(null);
            return;
          }

          const data = await response.json();

          if (!data.success) {
            resolve(null);
            return;
          }

          const detectedCity = data.city?.toLowerCase().trim() || '';
          const detectedState = data.state?.toLowerCase().trim() || '';
          const detectedDistrict = data.district?.toLowerCase().trim() || '';

          if (!detectedCity && !detectedState) {
            resolve(null);
            return;
          }

          // Helper function to normalize names
          const normalize = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ');

          // Find best match using priority logic
          let matchedLocation: T | undefined;

          // 1. Try exact city name match
          matchedLocation = locations.find(loc =>
            normalize(loc.name) === detectedCity
          );

          // 2. Try city name contains detected city or vice versa
          if (!matchedLocation) {
            matchedLocation = locations.find(loc => {
              const locName = normalize(loc.name);
              return locName.includes(detectedCity) || detectedCity.includes(locName);
            });
          }

          // 3. Try matching with district
          if (!matchedLocation && detectedDistrict) {
            matchedLocation = locations.find(loc => {
              const locName = normalize(loc.name);
              return locName.includes(detectedDistrict) || detectedDistrict.includes(locName);
            });
          }

          // 4. Try matching by state
          if (!matchedLocation && detectedState) {
            matchedLocation = locations.find(loc => {
              const locState = normalize(loc.state || '');
              return locState.includes(detectedState) || detectedState.includes(locState);
            });
          }

          // 5. Partial word match
          if (!matchedLocation) {
            const words = detectedCity.split(/\s+/).filter((w: string) => w.length > 2);
            matchedLocation = locations.find(loc => {
              const locName = normalize(loc.name);
              return words.some((word: string) => locName.includes(word));
            });
          }

          resolve(matchedLocation || null);
        } catch (error) {
          console.error('Browser geolocation reverse lookup failed:', error);
          resolve(null);
        }
      },
      (error) => {
        console.error('Browser geolocation denied:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Get city by slug
 */
export function getCityBySlug(slug: string): City | null {
  return ALL_CITIES.find(city => city.slug === slug) || null;
}

/**
 * Get default city (Mumbai as fallback)
 */
export function getDefaultCity(): City {
  return ALL_CITIES.find(city => city.slug === 'mumbai') || ALL_CITIES[0];
}

/**
 * Search cities by query
 */
export function searchCities(query: string, limit: number = 10): City[] {
  if (!query || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();

  return ALL_CITIES
    .filter(city =>
      city.name.toLowerCase().includes(lowerQuery) ||
      city.slug.includes(lowerQuery) ||
      city.state.toLowerCase().includes(lowerQuery) ||
      city.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
    )
    .sort((a, b) => b.priority - a.priority) // Sort by priority
    .slice(0, limit);
}

/**
 * Get popular cities (Tier 1 & top Tier 2)
 */
export function getPopularCities(limit: number = 12): City[] {
  return ALL_CITIES
    .filter(city => city.tier === 1 || (city.tier === 2 && city.priority >= 7))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

/**
 * Get location from cookie (for SSR)
 */
export function getLocationFromCookie(cookieString?: string): City | null {
  if (typeof window === 'undefined' && !cookieString) return null;

  const cookies = cookieString || document.cookie;
  const match = cookies.match(new RegExp(`(^| )${LOCATION_COOKIE_NAME}=([^;]+)`));

  if (!match) return null;

  const citySlug = match[2];
  return getCityBySlug(citySlug);
}

/**
 * Main location detection flow
 * 1. Check localStorage
 * 2. Check cookie
 * 3. Try browser GPS detection (most accurate)
 * 4. Try IP detection
 * 5. Fall back to default city
 */
export async function detectUserLocation(options?: { forceRefresh?: boolean }): Promise<LocationData> {
  const forceRefresh = options?.forceRefresh ?? false;
  const saved = forceRefresh ? null : getSavedLocation();
  // 1. Check saved location
  if (saved?.city) {
    if (saved.detectionMethod === 'manual') {
      const lastDetected = getLastDetectedLocation();
      if (lastDetected?.city && lastDetected.timestamp >= saved.timestamp) {
        saveLocation(lastDetected);
        return lastDetected;
      }
    }
    return saved;
  }

  // 2. Check cookie
  const cookieCity = getLocationFromCookie();
  if (cookieCity) {
    const data: LocationData = {
      city: cookieCity,
      detectionMethod: 'cookie',
      timestamp: Date.now(),
    };
    saveLocation(data);
    return data;
  }

  // 3. Try browser GPS detection first (most accurate) - only if already granted
  try {
    const permission = await checkGeolocationPermission();
    if (permission === 'granted') {
      const browserCity = await detectLocationByBrowser();
      if (browserCity) {
        const data: LocationData = {
          city: browserCity,
          detectionMethod: 'browser',
          timestamp: Date.now(),
        };
        saveLocation(data);
        return data;
      }
    } else {
      console.log('🔐 Geolocation permission status is not granted, skipping automatic GPS prompt');
    }
  } catch (error) {
    console.error('Browser geolocation failed:', error);
  }

  // 4. Try IP-based detection as fallback
  try {
    const ipCity = await detectLocationByIP();
    if (ipCity) {
      const data: LocationData = {
        city: ipCity,
        detectionMethod: 'ip',
        timestamp: Date.now(),
      };
      saveLastDetectedLocation(data);
      saveLocation(data);
      return data;
    }
  } catch (error) {
    console.error('IP detection failed, using default:', error);
  }

  // 5. Fall back to default city
  const data: LocationData = {
    city: getDefaultCity(),
    detectionMethod: 'default',
    timestamp: Date.now(),
  };
  saveLocation(data);
  return data;
}

/**
 * Manually set user location
 */
export function setUserLocation(
  city: City,
  detectionMethod: LocationData['detectionMethod'] = 'manual'
): void {
  const data: LocationData = {
    city,
    detectionMethod,
    timestamp: Date.now(),
  };
  if (detectionMethod === 'browser' || detectionMethod === 'ip') {
    saveLastDetectedLocation(data);
  }
  saveLocation(data);
}
