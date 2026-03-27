// fleetService.js - Fleet/Vehicle APIs for TransRentals Customer App
import api from '../api';

/**
 * Fleet Service - Vehicles, categories, availability
 */
const fleetService = {
  /**
   * Get fleet by service type
   */
  getFleetByService: async (serviceSlug, limit = 20, subService = null) => {
    const params = { limit };
    if (subService) params.subService = subService;

    const response = await api.get(`/services/${serviceSlug}/fleet`, { params });
    return response.data;
  },

  /**
   * Get fleet details by slug
   */
  getFleetDetails: async (slug) => {
    const response = await api.get(`/fleet/${slug}`);
    return response.data;
  },

  /**
   * Get fleet locations/availability
   */
  getFleetLocations: async (fleetId) => {
    const response = await api.get('/fleet/locations', {
      params: { fleetId }
    });
    return response.data;
  },

  /**
   * Get self-drive cars by location
   */
  getSelfDriveCars: async (locationSlug) => {
    const response = await api.get(`/self-drive-cars/${locationSlug}`);
    return response.data;
  },

  /**
   * Check vehicle availability
   */
  checkAvailability: async (vehicleId, pickupDate, dropDate, locationId) => {
    const response = await api.post('/fleet/check-availability', {
      vehicleId,
      pickupDate,
      dropDate,
      locationId
    });
    return response.data;
  },

  /**
   * Get vehicle categories
   */
  getCategories: async (serviceType) => {
    const response = await api.get('/fleet/categories', {
      params: { serviceType }
    });
    return response.data;
  },

  /**
   * Get equipment types
   */
  getEquipmentTypes: async () => {
    const response = await api.get('/equipment-types');
    return response.data;
  },

  /**
   * Get featured vendors
   */
  getFeaturedVendors: async () => {
    const response = await api.get('/vendors/featured');
    return response.data;
  },

  /**
   * Get vendor services
   */
  getVendorServices: async (vendorId) => {
    const response = await api.get(`/vendors/${vendorId}/services`);
    return response.data;
  },

  // ==================== BIKE FLEET APIs ====================

  /**
   * Get bikes available at a location with vendor prices
   * @param {string} locationSlug - Location slug or name (e.g., 'delhi', 'mumbai')
   * @param {object} filters - Optional filters { category, brand, sort, minPrice, maxPrice }
   * @returns {object} { location, bikes, totalCount, filters }
   */
  getBikesByLocation: async (locationSlug, filters = {}) => {
    const params = {};
    if (filters.category) params.category = filters.category;
    if (filters.brand) params.brand = filters.brand;
    if (filters.sort) params.sort = filters.sort; // price_low, price_high, vendors, name
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;

    const response = await api.get(`/bikes/${locationSlug}`, { params });
    return response.data;
  },

  /**
   * Create a bike booking
   * @param {object} bookingData - Booking details
   * @returns {object} Created booking with PENDING_PAYMENT status
   */
  createBikeBooking: async (bookingData) => {
    const response = await api.post('/bike-bookings', { ...bookingData, source: 'app' });
    return response.data;
  },

  /**
   * Get customer's bike bookings
   * @param {object} params - { customerId, phone, email, status, page, limit }
   * @returns {object} List of bookings with pagination
   */
  getBikeBookings: async (params = {}) => {
    const response = await api.get('/bike-bookings', { params });
    return response.data;
  },

  /**
   * Get single bike booking details
   * @param {string} bookingId - Booking ID or booking number
   * @returns {object} Booking details
   */
  getBikeBookingDetails: async (bookingId) => {
    const response = await api.get(`/bike-bookings/${bookingId}`);
    return response.data;
  },

  /**
   * Update bike booking (cancel, rate, submit payment)
   * @param {string} bookingId - Booking ID
   * @param {object} updateData - { action: 'cancel' | 'rate' | 'submit_payment', ... }
   * @returns {object} Updated booking
   */
  updateBikeBooking: async (bookingId, updateData) => {
    const response = await api.patch(`/bike-bookings/${bookingId}`, updateData);
    return response.data;
  },

  /**
   * Create a bike quote request
   * @param {object} requestData - Quote request details
   * @returns {object} Created quote request
   */
  createBikeQuoteRequest: async (requestData) => {
    const response = await api.post('/bike-quote-requests', { ...requestData, source: 'app' });
    return response.data;
  },

  /**
   * Get customer's bike quote requests
   * @param {object} params - { customerId, phone, email, status }
   * @returns {array} List of quote requests
   */
  getBikeQuoteRequests: async (params = {}) => {
    const response = await api.get('/bike-quote-requests', { params });
    return response.data;
  },

  // ==================== SELF-DRIVE CAR APIs ====================

  /**
   * Get self-drive cars by location with vendor prices
   * @param {string} locationSlug - Location slug or ID
   * @param {object} filters - Optional filters { category, brand, sort, minPrice, maxPrice }
   * @returns {object} { location, cars, totalCount, filters }
   */
  getSelfDriveCarsByLocation: async (locationSlug, filters = {}) => {
    const params = {};
    if (filters.category) params.category = filters.category;
    if (filters.brand) params.brand = filters.brand;
    if (filters.sort) params.sort = filters.sort;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;

    const response = await api.get(`/self-drive-cars/${locationSlug}`, { params });
    return response.data;
  },

  /**
   * Create a self-drive quote request
   * @param {object} requestData - Quote request details
   * @returns {object} Created quote request
   */
  createSelfDriveQuoteRequest: async (requestData) => {
    const response = await api.post('/self-drive-quote-requests', { ...requestData, source: 'app' });
    return response.data;
  },

  /**
   * Get customer's self-drive quote requests
   * @param {object} params - { customerId, phone, email, status }
   * @returns {object} { requests: [...] }
   */
  getSelfDriveQuoteRequests: async (params = {}) => {
    const response = await api.get('/self-drive-quote-requests', { params });
    return response.data;
  },

  /**
   * Get single self-drive quote request details
   * @param {string} requestId - Quote request ID
   * @returns {object} Quote request details with quotes
   */
  getSelfDriveQuoteRequestDetails: async (requestId) => {
    const response = await api.get(`/self-drive-quote-requests/${requestId}`);
    return response.data;
  },

  /**
   * Get customer's self-drive bookings
   * @param {object} params - { customerId, phone, email, status }
   * @returns {object} { bookings: [...] }
   */
  getSelfDriveBookings: async (params = {}) => {
    console.log('🚗 getSelfDriveBookings called with:', params);
    const response = await api.get('/bookings', {
      params: { ...params, type: 'selfdrive' }  // Changed from serviceType to type
    });
    console.log('🚗 Self-Drive Bookings Response:', response.data);
    return response.data;
  },

  /**
   * Get single self-drive booking details
   * @param {string} bookingId - Booking ID
   * @returns {object} Booking details
   */
  getSelfDriveBookingDetails: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },
};

export default fleetService;
