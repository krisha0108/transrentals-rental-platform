import { apiRequest } from './client';

// ============================================
// TYPES
// ============================================

export interface Service {
  id: number;
  name: string;
  slug?: string;
  parent_id?: number;
  status: number;
  image?: string;
  description?: string;
}

export interface Location {
  id: number;
  name: string;
  slug?: string;
  type?: string;
  parent_id?: number;
  status: number;
  state?: string;
  state_slug?: string;
  latitude?: number;
  longitude?: number;
  is_popular?: boolean;
  image_url?: string;
}

export interface EquipmentType {
  id: number;
  name: string;
}

export interface VendorService {
  id: number;
  vendor_id: number;
  service_id: number;
  service_name: string;
  description?: string;
  min_price?: number;
  max_price?: number;
  images?: string[];
  inclusions?: string[];
  exclusions?: string[];
  terms?: string;
  cancellation_policy?: string;
  status: number;
}

// ============================================
// SERVICES API
// ============================================

export const servicesAPI = {
  /**
   * Get all active services from backend
   */
  getServices: async (): Promise<Service[]> => {
    const response = await apiRequest<{
      status: boolean;
      services: Service[];
    }>({
      method: 'GET',
      url: '/services',
    });
    return response.services || [];
  },

  /**
   * Get all active locations from backend
   */
  getLocations: async (): Promise<Location[]> => {
    const response = await apiRequest<{
      status: boolean;
      locations: Location[];
    }>({
      method: 'GET',
      url: '/locations',
    });
    return response.locations || [];
  },

  /**
   * Get equipment types
   */
  getEquipmentTypes: async (): Promise<EquipmentType[]> => {
    const response = await apiRequest<{
      status: boolean;
      equipment_types: EquipmentType[];
    }>({
      method: 'GET',
      url: '/equipment-types',
    });
    return response.equipment_types || [];
  },

  /**
   * Get vendor services (public listing)
   */
  getVendorServices: async (params?: {
    service_id?: number;
    location_id?: number;
    page?: number;
    per_page?: number;
  }): Promise<VendorService[]> => {
    const response = await apiRequest<{
      success: boolean;
      services: VendorService[];
    }>({
      method: 'GET',
      url: '/vendor-services',
      params,
    });
    return response.services || [];
  },

  /**
   * Get vendor service detail
   */
  getVendorServiceDetail: async (serviceId: number): Promise<VendorService | null> => {
    const response = await apiRequest<{
      success: boolean;
      service: VendorService;
    }>({
      method: 'GET',
      url: `/vendor-services/${serviceId}`,
    });
    return response.service || null;
  },

  /**
   * Get locations and services (combined endpoint)
   */
  getLocationsAndServices: async (): Promise<{
    locations: Location[];
    services: Service[];
  }> => {
    const response = await apiRequest<{
      success: boolean;
      locations: Location[];
      services: Service[];
    }>({
      method: 'GET',
      url: '/vendor/locations-services',
    });
    return {
      locations: response.locations || [],
      services: response.services || [],
    };
  },
};

// ============================================
// CALLBACK REQUEST API
// ============================================

export const callbackAPI = {
  /**
   * Submit callback request (lead generation)
   */
  submitCallbackRequest: async (data: {
    name: string;
    phone: string;
    email?: string;
    service_id?: number;
    location_id?: number;
    message?: string;
  }) => {
    return apiRequest<{
      success: boolean;
      message?: string;
    }>({
      method: 'POST',
      url: '/public-callback',
      data,
    });
  },
};
