// locationService.js - Location APIs for TransRentals Customer App
import api from '../api';

/**
 * Location Service - Cities, areas, airports
 */
const locationService = {
  /**
   * Get all available locations (cities)
   */
  getLocations: async (type = 'CITY', includeAirports = false, serviceSlug = null) => {
    const params = { type, includeAirports };
    if (serviceSlug) params.serviceSlug = serviceSlug;

    const response = await api.get('/locations', { params });
    return response.data;
  },

  /**
   * Get airports
   */
  getAirports: async () => {
    const response = await api.get('/airports');
    return response.data;
  },

  /**
   * Get location by slug
   */
  getLocationBySlug: async (slug) => {
    const response = await api.get(`/locations/${slug}`);
    return response.data;
  },

  /**
   * Get service availability by location
   */
  getServiceLocations: async (serviceSlug) => {
    const response = await api.get('/service-locations', {
      params: { service: serviceSlug }
    });
    return response.data;
  },

  /**
   * Search locations
   */
  searchLocations: async (query) => {
    const response = await api.get('/locations/search', {
      params: { q: query }
    });
    return response.data;
  },

  // ==================== SERVICE-SPECIFIC LOCATIONS ====================
  /**
   * Get locations assigned to Bus Rental service
   */
  getBusLocations: async () => {
    const response = await api.get('/services/bus-rental/locations');
    return response.data;
  },

  /**
   * Search locations assigned to Bus Rental service
   */
  searchBusLocations: async (query) => {
    const response = await api.get('/services/bus-rental/locations', {
      params: { q: query, limit: 10 }
    });
    return response.data;
  },

  /**
   * Get locations assigned to Truck (Transporter) service
   */
  getTruckLocations: async () => {
    const response = await api.get('/services/transporter/locations');
    return response.data;
  },

  /**
   * Search locations assigned to Truck (Transporter) service
   */
  searchTruckLocations: async (query) => {
    const response = await api.get('/services/transporter/locations', {
      params: { q: query, limit: 10 }
    });
    return response.data;
  },

  /**
   * Get locations assigned to Packers & Movers service
   */
  getPackersLocations: async () => {
    const response = await api.get('/services/packers-and-movers/locations');
    return response.data;
  },

  /**
   * Search locations assigned to Packers & Movers service
   */
  searchPackersLocations: async (query) => {
    const response = await api.get('/services/packers-and-movers/locations', {
      params: { q: query, limit: 10 }
    });
    return response.data;
  },

  /**
   * Get locations assigned to Equipment Rental service
   */
  getEquipmentLocations: async () => {
    const response = await api.get('/services/equipment-rental/locations');
    return response.data;
  },

  /**
   * Search locations assigned to Equipment Rental service
   */
  searchEquipmentLocations: async (query) => {
    const response = await api.get('/services/equipment-rental/locations', {
      params: { q: query, limit: 10 }
    });
    return response.data;
  },
};

export default locationService;
