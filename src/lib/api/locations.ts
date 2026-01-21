import { apiClient, apiRequest } from './client';
import type { Location, APIResponse } from '@/types';

export const locationsAPI = {
  /**
   * Get all locations
   */
  getAllLocations: async (): Promise<Location[]> => {
    const response = await apiRequest<APIResponse<Location[]>>({
      method: 'GET',
      url: '/locations',
    });
    return response.data || [];
  },

  /**
   * Get location by slug
   */
  getLocationBySlug: async (slug: string): Promise<Location | null> => {
    const locations = await locationsAPI.getAllLocations();
    return locations.find((loc) => loc.slug === slug) || null;
  },

  /**
   * Get popular locations
   */
  getPopularLocations: async (): Promise<Location[]> => {
    const locations = await locationsAPI.getAllLocations();
    return locations.filter((loc) => loc.is_popular);
  },

  /**
   * Search locations by query
   */
  searchLocations: async (query: string): Promise<Location[]> => {
    const locations = await locationsAPI.getAllLocations();
    const lowerQuery = query.toLowerCase();
    return locations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(lowerQuery) ||
        loc.state?.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Get locations by state
   */
  getLocationsByState: async (state: string): Promise<Location[]> => {
    const locations = await locationsAPI.getAllLocations();
    return locations.filter(
      (loc) => loc.state_slug === state || loc.state?.toLowerCase() === state.toLowerCase()
    );
  },
};
