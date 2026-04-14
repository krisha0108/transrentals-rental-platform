// wanderService.js - Wander Tours API Service for TransRentals Customer App
import api from '../api';

const wanderService = {
  // ─── Browse ───────────────────────────────────────────────────────────────

  // GET /api/wander/categories — returns a plain array
  getCategories: async () => {
    const res = await api.get('/wander/categories');
    const data = res.data;
    // Normalise: API returns array directly, wrap for consistent usage
    return { categories: Array.isArray(data) ? data : (data?.categories || []) };
  },

  // GET /api/wander/experiences — returns a plain array
  getExperiences: async () => {
    const res = await api.get('/wander/experiences');
    const data = res.data;
    return { experiences: Array.isArray(data) ? data : (data?.experiences || []) };
  },

  // GET /api/wander/listings — returns { listings, total, page, totalPages }
  getListings: async (filters = {}) => {
    const res = await api.get('/wander/listings', { params: filters });
    return res.data;
  },

  // GET /api/wander/listings/[id] — returns { listing }
  getListingById: async (id) => {
    const res = await api.get(`/wander/listings/${id}`);
    return res.data;
  },

  // GET /api/wander/experiences/[slug]
  getExperienceBySlug: async (slug) => {
    const res = await api.get(`/wander/experiences/${slug}`);
    return res.data;
  },

  // ─── Quote Request ─────────────────────────────────────────────────────────

  // POST /api/wander/quote-requests
  createQuoteRequest: async (data) => {
    const res = await api.post('/wander/quote-requests', data);
    return res.data;
  },

  // ─── Customer Bookings ────────────────────────────────────────────────────

  getMyQuoteRequests: async (customerId) => {
    const res = await api.get('/customer/wander-quote-requests', {
      params: { customer_id: customerId },
    });
    return res.data;
  },

  getQuoteRequestById: async (id) => {
    const res = await api.get(`/customer/wander-quote-requests/${id}`);
    return res.data;
  },

  acceptQuote: async (requestId, quoteId) => {
    const res = await api.post(`/customer/wander-quote-requests/${requestId}/accept`, { quoteId });
    return res.data;
  },

  getMyBookings: async (customerId, status) => {
    const res = await api.get('/customer/wander-bookings', {
      params: { customer_id: customerId, ...(status ? { status } : {}) },
    });
    return res.data;
  },

  // ─── Wishlist ─────────────────────────────────────────────────────────────

  toggleWishlist: async (listingId, customerId) => {
    const res = await api.post('/wander/wishlist', { listingId, customerId });
    return res.data;
  },

  getWishlist: async (customerId) => {
    const res = await api.get('/wander/wishlist', { params: { customerId } });
    return res.data;
  },
};

export default wanderService;
