// b2bService.js - All B2B APIs for TransRentals Customer App
import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const b2bService = {
  // ==================== AUTH & REGISTRATION ====================
  /**
   * Register as B2B customer with company details
   */
  register: async (data) => {
    const response = await api.post('/customer/auth', {
      action: 'register',
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      isB2B: true,
      companyName: data.companyName,
      gstin: data.gstin,
      businessType: data.businessType,
      companyAddress: data.companyAddress,
      companyPhone: data.companyPhone,
      companyEmail: data.companyEmail,
    });
    return response.data;
  },

  /**
   * Check B2B approval status
   */
  getB2BStatus: async () => {
    const customerData = await AsyncStorage.getItem('customer');
    if (!customerData) return null;
    const customer = JSON.parse(customerData);
    const response = await api.get('/customer/b2b-status', {
      params: { customer_id: customer.id },
    });
    return response.data;
  },

  // ==================== BOOKINGS ====================
  /**
   * Create new B2B booking
   */
  createBooking: async (bookingData) => {
    const response = await api.post('/b2b/bookings', bookingData);
    return response.data;
  },

  /**
   * Get all B2B bookings for customer
   */
  getBookings: async (params = {}) => {
    const customerData = await AsyncStorage.getItem('customer');
    if (!customerData) return { bookings: [] };
    const customer = JSON.parse(customerData);
    const response = await api.get('/b2b/bookings', {
      params: {
        customer_id: customer.id,
        ...params,
      },
    });
    return response.data;
  },

  /**
   * Get single booking detail
   */
  getBookingDetail: async (bookingId) => {
    const response = await api.get(`/b2b/bookings/${bookingId}`);
    return response.data;
  },

  /**
   * Cancel a booking
   */
  cancelBooking: async (bookingId, reason) => {
    const response = await api.patch(`/b2b/bookings/${bookingId}`, {
      action: 'cancel',
      reason,
    });
    return response.data;
  },

  // ==================== SUPER QUOTES ====================
  /**
   * Accept a super quote
   */
  acceptSuperQuote: async (superQuoteId) => {
    const response = await api.post(`/b2b/super-quotes/${superQuoteId}/accept`);
    return response.data;
  },

  // ==================== TRIPS ====================
  /**
   * Get trips for a booking
   */
  getTrips: async (bookingId) => {
    const response = await api.get('/b2b/trips', {
      params: { booking_id: bookingId },
    });
    return response.data;
  },

  /**
   * Verify OTP to start trip
   */
  verifyTripOtp: async (tripCode, otp) => {
    const response = await api.post(`/b2b/trips/${tripCode}/verify-otp`, { otp });
    return response.data;
  },

  // ==================== CHAT ====================
  /**
   * Get chat vendors for a booking
   */
  getChatVendors: async (bookingId) => {
    const response = await api.get(`/b2b/bookings/${bookingId}/chat`);
    return response.data;
  },

  /**
   * Get chat messages with a vendor
   */
  getChatMessages: async (bookingId, vendorId) => {
    const response = await api.get(`/b2b/bookings/${bookingId}/chat`, {
      params: { vendorId },
    });
    return response.data;
  },

  /**
   * Send chat message to vendor
   */
  sendChatMessage: async (bookingId, vendorId, message) => {
    const response = await api.post(`/b2b/bookings/${bookingId}/chat`, {
      vendorId,
      message,
    });
    return response.data;
  },

  // ==================== INVOICES ====================
  /**
   * Get all invoices
   */
  getInvoices: async (params = {}) => {
    const customerData = await AsyncStorage.getItem('customer');
    if (!customerData) return { invoices: [] };
    const customer = JSON.parse(customerData);
    const response = await api.get('/b2b/invoices', {
      params: {
        customer_id: customer.id,
        ...params,
      },
    });
    return response.data;
  },

  /**
   * Get single invoice detail
   */
  getInvoiceDetail: async (invoiceId) => {
    const response = await api.get(`/b2b/invoices/${invoiceId}`);
    return response.data;
  },

  /**
   * Create Razorpay payment order for invoice
   */
  createPaymentOrder: async (invoiceId) => {
    const response = await api.post(`/b2b/invoices/${invoiceId}/pay`);
    return response.data;
  },

  /**
   * Download invoice PDF as base64
   */
  downloadInvoicePDF: async (invoiceId) => {
    const response = await api.get(`/b2b/invoices/${invoiceId}/pdf`, {
      params: { format: 'base64' },
    });
    return response.data;
  },

  /**
   * Mark invoice as paid
   */
  markInvoicePaid: async (invoiceId, paymentData) => {
    const response = await api.patch(`/b2b/invoices/${invoiceId}`, {
      action: 'mark_paid',
      ...paymentData,
    });
    return response.data;
  },
};

export default b2bService;
