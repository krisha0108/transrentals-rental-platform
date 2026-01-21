// bookingService.js - All Booking APIs for TransRentals Customer App
import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Booking Service - Handles all booking types
 */
const bookingService = {
  /**
   * Get all customer bookings with unified API
   */
  getBookings: async (status = 'all') => {
    const customerData = await AsyncStorage.getItem('customer');
    if (!customerData) return { success: false, bookings: [] };
    const customer = JSON.parse(customerData);

    const response = await api.get('/customer/bookings', {
      params: {
        identifier: customer?.email || customer?.phone,
        customer_id: customer?.id,
        status: status === 'all' ? 'All' : status
      }
    });
    return response.data;
  },

  /**
   * Get booking details by ID
   */
  getBookingDetails: async (bookingId) => {
    const response = await api.get(`/customer/bookings/${bookingId}`);
    return response.data;
  },

  /**
   * Get customer stats (open, completed, upcoming counts)
   */
  getStats: async () => {
    const customerData = await AsyncStorage.getItem('customer');
    if (!customerData) return { success: false, stats: { total: 0 } };
    const customer = JSON.parse(customerData);

    const response = await api.get('/customer/stats', {
      params: {
        identifier: customer?.email || customer?.phone,
        customer_id: customer?.id
      }
    });
    return response.data;
  },

  // ==================== BIKE BOOKING ====================
  createBikeBooking: async (bookingData) => {
    const response = await api.post('/bike-bookings', bookingData);
    return response.data;
  },

  // ==================== CAR WITH DRIVER (CHAUFFEUR) ====================
  createChauffeurBooking: async (bookingData) => {
    // Map mobile payload to unified API payload
    const payload = {
      tripType: bookingData.tripType === 'one_way' || bookingData.tripType === 'round_trip' ? 'outstation' : bookingData.tripType,
      carCategory: bookingData.vehicleCategoryId,
      carCategoryName: bookingData.vehicleCategory,
      pickupCity: bookingData.pickupCity,
      pickupLocationId: bookingData.pickupLocationId, // Ensure this is passed
      dropCity: bookingData.dropCity,
      pickupAddress: bookingData.pickupAddress,
      dropAddress: bookingData.dropAddress,
      pickupDate: bookingData.pickupDate,
      pickupTime: bookingData.pickupTime,
      returnDate: bookingData.returnDate,
      localPackageId: bookingData.packageId,
      localPackageHours: bookingData.estimatedHours,
      localPackageKm: bookingData.estimatedKm,
      mode: bookingData.tripType === 'round_trip' ? 'round-trip' : (bookingData.tripType === 'one_way' ? 'one-way' : undefined),
      airportMode: bookingData.airportType,
      customerName: bookingData.customerName,
      customerPhone: bookingData.customerPhone,
      customerEmail: bookingData.customerEmail,
      baseFare: bookingData.baseFare,
      gstAmount: bookingData.gstAmount,
      grandTotal: bookingData.estimatedAmount,
      // Advance Payment (Mobile specific)
      advancePaid: bookingData.advancePaid,
      transactionId: bookingData.transactionId,
      paymentMethod: bookingData.paymentMethod,
    };
    const response = await api.post('/car-rental/bookings', payload);
    return response.data;
  },

  // ==================== SELF-DRIVE CAR ====================
  createSelfDriveBooking: async (bookingData) => {
    /**
     * bookingData should include:
     * - customerName, customerEmail, customerPhone, customerId
     * - locationId, locationName, pickupAddress
     * - vehicleId, vehicleName, vehicleBrand, vehicleCategory
     * - vehicleTransmission, vehicleFuelType, vehicleSeats
     * - pickupDate, pickupTime, dropDate, dropTime
     * - dailyRate, kmLimitPerDay, extraKmRate, securityDeposit
     * - customerNotes, licenseNumber
     */
    const response = await api.post('/self-drive-bookings', bookingData);
    return response.data;
  },

  // ==================== LUXURY CAR ====================
  createLuxuryBooking: async (bookingData) => {
    /**
     * bookingData should include:
     * - customerName, customerEmail, customerPhone, customerId
     * - vehicleCategory, vehiclePreference
     * - serviceType: 'city-tour' | 'airport-transfer' | 'event'
     * - tripType: 'hourly' | 'daily' | 'multi-day'
     * - withChauffeur: true/false
     * - pickupCity, pickupAddress, pickupDate, pickupTime
     * - dropCity, dropAddress, returnDate, returnTime (optional)
     * - needAirportPickup, flightNumber, terminalNumber (optional)
     * - needDecoration, decorationType (optional)
     * - needPhotographer (optional)
     * - specialRequests, occasionType, budgetMin, budgetMax
     */
    const response = await api.post('/luxury-bookings', bookingData);
    return response.data;
  },

  getLuxuryBookings: async (status = 'all') => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.get('/luxury-bookings', {
      params: {
        customerId: customer?.id,
        email: customer?.email,
        status
      }
    });
    return response.data;
  },

  // ==================== BUS BOOKING (Quote Request) ====================
  createBusQuoteRequest: async (requestData) => {
    /**
     * requestData should include:
     * - customerName, customerEmail, customerPhone, customerId
     * - tripType: 'local' | 'outstation' | 'pilgrimage' | 'wedding' | 'corporate' | 'school'
     * - vehicleCategory: bus category ID
     * - vehicleCategoryName: bus category name
     * - passengers: number of passengers
     * - pickupCity, pickupAddress, pickupDate, pickupTime
     * - dropCity, dropAddress (for non-local trips)
     * - returnDate, returnTime (for round trip)
     * - tripDays: calculated trip duration
     * - requirements: special requests
     * - needAC, needLuxury, needSleeper: boolean preferences
     * - budgetMin, budgetMax: optional budget range
     */
    const response = await api.post('/bus-quote-requests', requestData);
    return response.data;
  },

  getBusQuotes: async (requestId) => {
    const response = await api.get(`/customer/quote-requests/bus/${requestId}`);
    return response.data;
  },

  // ==================== TRUCK BOOKING (Quote Request) ====================
  createTruckQuoteRequest: async (requestData) => {
    /**
     * requestData should include:
     * - customerName, customerEmail, customerPhone, customerId
     * - vehicleCategory, vehicleCategoryName
     * - goodsType, goodsDescription, estimatedWeight
     * - pickupCity, pickupAddress, pickupDate, pickupTime
     * - dropCity, dropAddress
     * - requirements, needInsurance, needPackaging
     */
    const response = await api.post('/truck-quote-requests', requestData);
    return response.data;
  },

  getTruckQuotes: async (requestId) => {
    const response = await api.get(`/customer/quote-requests/truck/${requestId}`);
    return response.data;
  },

  // ==================== EQUIPMENT RENTAL (Quote Request) ====================
  createEquipmentQuoteRequest: async (requestData) => {
    /**
     * requestData should include:
     * - customerName, customerEmail, customerPhone, customerId
     * - equipmentCategory, equipmentType, equipmentName
     * - quantity, rentalDuration, rentalDays
     * - deliveryCity, deliveryAddress, siteType
     * - startDate, endDate
     * - needOperator, needDelivery, needInstallation
     * - requirements, budgetMin, budgetMax
     */
    const response = await api.post('/equipment-quote-requests', requestData);
    return response.data;
  },

  getEquipmentQuotes: async (requestId) => {
    const response = await api.get(`/customer/quote-requests/equipment/${requestId}`);
    return response.data;
  },

  // ==================== PACKERS & MOVERS (Quote Request) ====================
  createPackersQuoteRequest: async (requestData) => {
    /**
     * requestData should include:
     * - customerName, customerEmail, customerPhone, customerId
     * - serviceType, shiftingType, propertySize
     * - pickupCity, pickupAddress, pickupFloor
     * - dropCity, dropAddress, dropFloor
     * - preferredDate, isFlexibleDate
     * - inventoryList, hasHeavyItems, hasFragileItems
     * - needPacking, needUnpacking, needStorage, needInsurance
     * - requirements, budgetMin, budgetMax
     */
    const response = await api.post('/packers-quote-requests', requestData);
    return response.data;
  },

  getPackersQuotes: async (requestId) => {
    const response = await api.get(`/customer/quote-requests/packers/${requestId}`);
    return response.data;
  },

  // ==================== GET BOOKINGS BY TYPE ====================
  getBusBookings: async (status = 'all') => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    // Fetch both quote requests and bookings
    const [quoteResponse, bookingResponse] = await Promise.all([
      api.get('/bus-quote-requests', {
        params: {
          customerId: customer?.id,
          email: customer?.email,
          status: status === 'all' ? undefined : status
        }
      }),
      api.get('/bus-bookings', {
        params: {
          customerId: customer?.id,
          email: customer?.email,
          status: status === 'all' ? undefined : status
        }
      })
    ]);

    return {
      success: true,
      quoteRequests: quoteResponse.data.requests || [],
      bookings: bookingResponse.data.bookings || []
    };
  },

  getTruckBookings: async (status = 'all') => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    // Fetch both quote requests and bookings
    const [quoteResponse, bookingResponse] = await Promise.all([
      api.get('/truck-quote-requests', {
        params: {
          customerId: customer?.id,
          email: customer?.email,
          status: status === 'all' ? undefined : status
        }
      }),
      api.get('/truck-bookings', {
        params: {
          customerId: customer?.id,
          email: customer?.email,
          status: status === 'all' ? undefined : status
        }
      })
    ]);

    return {
      success: true,
      quoteRequests: quoteResponse.data.requests || [],
      bookings: bookingResponse.data.bookings || []
    };
  },

  getEquipmentBookings: async (status = 'all') => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    // Fetch both quote requests and bookings
    const [quoteResponse, bookingResponse] = await Promise.all([
      api.get('/equipment-quote-requests', {
        params: {
          customerId: customer?.id,
          email: customer?.email,
          status: status === 'all' ? undefined : status
        }
      }),
      api.get('/equipment-bookings', {
        params: {
          customerId: customer?.id,
          email: customer?.email,
          status: status === 'all' ? undefined : status
        }
      })
    ]);

    return {
      success: true,
      quoteRequests: quoteResponse.data.requests || [],
      bookings: bookingResponse.data.bookings || []
    };
  },

  getPackersBookings: async (status = 'all') => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    // Fetch both quote requests and bookings
    const [quoteResponse, bookingResponse] = await Promise.all([
      api.get('/packers-quote-requests', {
        params: {
          customerId: customer?.id,
          email: customer?.email,
          status: status === 'all' ? undefined : status
        }
      }),
      api.get('/packers-bookings', {
        params: {
          customerId: customer?.id,
          email: customer?.email,
          status: status === 'all' ? undefined : status
        }
      })
    ]);

    return {
      success: true,
      quoteRequests: quoteResponse.data.requests || [],
      bookings: bookingResponse.data.bookings || []
    };
  },

  getChauffeurBookings: async (status = 'all') => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.get('/car-rental/bookings', {
      params: {
        customerId: customer?.id,
        email: customer?.email,
        phone: customer?.phone,
        status
      }
    });
    return response.data;
  },

  getCarRentalBookingDetails: async (bookingNumber) => {
    const response = await api.get(`/car-rental/bookings/${bookingNumber}`);
    return response.data;
  },

  getSelfDriveBookings: async (status = 'all') => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.get('/self-drive-bookings', {
      params: {
        customerId: customer?.id,
        email: customer?.email,
        status
      }
    });
    return response.data;
  },

  getBikeBookings: async (status = 'all') => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.get('/bike-bookings', {
      params: {
        customerId: customer?.id,
        email: customer?.email,
        status
      }
    });
    return response.data;
  },

  // ==================== QUOTE MANAGEMENT ====================
  /**
   * Accept a vendor quote
   */
  acceptQuote: async (quoteId, bookingType) => {
    const response = await api.post('/customer/quotes/accept', {
      quoteId,
      bookingType
    });
    return response.data;
  },

  /**
   * Get all quote requests for customer
   */
  getQuoteRequests: async () => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.get('/customer/quote-requests', {
      params: { customerId: customer?.id }
    });
    return response.data;
  },

  // ==================== REVIEWS ====================
  /**
   * Submit review for completed booking
   */
  submitReview: async (reviewData) => {
    /**
     * reviewData should include:
     * - booking_id, customer_id, receiver_id (vendor)
     * - overall_rating (1-5)
     * - heading, comment
     * - categories: { categoryName: { rating, comment } }
     */
    const response = await api.post('/customer/reviews', reviewData);
    return response.data;
  },

  /**
   * Check if review exists for booking
   */
  checkReviewExists: async (bookingId) => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.get(`/customer/reviews/check/${bookingId}`, {
      params: { customer_id: customer?.id }
    });
    return response.data;
  },

  /**
   * Get review categories for a service
   */
  getReviewCategories: async (serviceId) => {
    const response = await api.get('/customer/review-categories', {
      params: { service_id: serviceId }
    });
    return response.data;
  },

  // ==================== CHAUFFEUR FLEET & PRICING ====================
  /**
   * Get all chauffeur vehicle categories (fleet)
   */
  getChauffeurVehicleCategories: async () => {
    const response = await api.get('/admin/chauffeur/vehicles');
    return response.data;
  },

  /**
   * Get local packages for a city/vehicle
   */
  getChauffeurLocalPackages: async (params = {}) => {
    const response = await api.get('/admin/chauffeur/packages', { params });
    return response.data;
  },

  /**
   * Calculate chauffeur pricing
   * @param {Object} params - Pricing parameters
   * @param {string} params.tripType - 'local' | 'one_way' | 'round_trip' | 'airport'
   * @param {string} params.vehicleCategory - Vehicle category ID
   * @param {string} [params.from] - From location ID (for outstation/airport)
   * @param {string} [params.to] - To location ID (for outstation/airport)
   * @param {string} [params.packageId] - Package ID (for local trips)
   * @param {string} [params.startDate] - Start date
   * @param {string} [params.endDate] - End date (for round trip)
   * @param {string} [params.pickupTime] - Pickup time (for night charges)
   */
  getChauffeurPricing: async (params) => {
    const response = await api.get('/chauffeur-pricing', { params });
    return response.data;
  },
};

export default bookingService;
