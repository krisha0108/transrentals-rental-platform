import { useState, useEffect } from 'react';

export interface Location {
  id: number | string;
  name: string;
  slug?: string;
  state?: string;
  type?: string;
  stateCode?: string;
  priority?: number;
  tier?: 1 | 2 | 3 | 4;
  keywords?: string[];
  latitude?: number | null;
  longitude?: number | null;
}

interface UseLocationsOptions {
  serviceSlug?: string | null; // If provided, fetch only locations assigned to this service
}

/**
 * Hook to fetch locations from LOCAL database only (trans_cms)
 * @param options.serviceSlug - If provided, fetches only locations assigned to this service
 *                              If null/undefined, fetches all locations
 */
export function useLocations(options: UseLocationsOptions = {}) {
  const { serviceSlug } = options;
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isServiceSpecific, setIsServiceSpecific] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build API URL - always use local API
        const apiUrl = serviceSlug
          ? `/api/locations?serviceSlug=${encodeURIComponent(serviceSlug)}`
          : '/api/locations';

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.success && data.locations && data.locations.length > 0) {
          setLocations(data.locations);
          setIsServiceSpecific(data.isServiceSpecific || false);
        } else {
          // No locations found
          setLocations([]);
          setIsServiceSpecific(false);
          setError('No locations available');
        }
      } catch (err) {
        console.error('Failed to fetch locations:', err);
        setError('Failed to load locations');
        setLocations([]);
        setIsServiceSpecific(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [serviceSlug]);

  return { locations, isLoading, error, isServiceSpecific };
}
