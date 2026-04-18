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

  // ─── Group Trips ──────────────────────────────────────────────────────────

  createGroup: async (data) => {
    const res = await api.post('/wander/groups', data);
    return res.data;
  },

  getGroup: async (groupCode) => {
    const res = await api.get(`/wander/groups/${groupCode}`);
    return res.data;
  },

  joinGroup: async (groupCode, data) => {
    const res = await api.post(`/wander/groups/${groupCode}/join`, data);
    return res.data;
  },

  proposeTrip: async (groupCode, data) => {
    const res = await api.post(`/wander/groups/${groupCode}/trips`, data);
    return res.data;
  },

  respondToTrip: async (groupCode, tripId, data) => {
    const res = await api.post(`/wander/groups/${groupCode}/trips/${tripId}?action=respond`, data);
    return res.data;
  },

  submitGroupTrip: async (groupCode, tripId, data) => {
    const res = await api.post(`/wander/groups/${groupCode}/trips/${tripId}?action=submit`, data);
    return res.data;
  },

  getMyGroups: async (customerId) => {
    const res = await api.get('/customer/wander-groups', { params: { customer_id: customerId } });
    return res.data;
  },

  leaveGroup: async (groupCode, memberId) => {
    const res = await api.delete(`/wander/groups/${groupCode}/leave`, { data: { memberId } });
    return res.data;
  },

  sendChatMessage: async (groupCode, memberId, message) => {
    const res = await api.post(`/wander/groups/${groupCode}/chat`, { memberId, message });
    return res.data;
  },

  getChatMessages: async (groupCode) => {
    const res = await api.get(`/wander/groups/${groupCode}/chat`);
    return res.data;
  },

  addDateOption: async (groupCode, tripId, memberId, date) => {
    const res = await api.post(`/wander/groups/${groupCode}/trips/${tripId}/dates?action=add`, { memberId, date });
    return res.data;
  },

  voteDateOption: async (groupCode, tripId, memberId, optionId) => {
    const res = await api.post(`/wander/groups/${groupCode}/trips/${tripId}/dates?action=vote`, { memberId, optionId });
    return res.data;
  },

  // ─── Group Management ─────────────────────────────────────────────────────

  removeMember: async (groupCode, targetMemberId, adminMemberId) => {
    const res = await api.delete(`/wander/groups/${groupCode}/members/${targetMemberId}`, { data: { adminMemberId } });
    return res.data;
  },

  pinDate: async (groupCode, tripId, memberId, optionId) => {
    const res = await api.post(`/wander/groups/${groupCode}/trips/${tripId}/manage?action=pin-date`, { memberId, optionId });
    return res.data;
  },

  cancelTrip: async (groupCode, tripId, memberId) => {
    const res = await api.post(`/wander/groups/${groupCode}/trips/${tripId}/manage?action=cancel`, { memberId });
    return res.data;
  },

  deleteTrip: async (groupCode, tripId, memberId) => {
    const res = await api.delete(`/wander/groups/${groupCode}/trips/${tripId}`, { data: { memberId } });
    return res.data;
  },

  changeTour: async (groupCode, tripId, memberId, listingId, listingTitle) => {
    const res = await api.patch(`/wander/groups/${groupCode}/trips/${tripId}/manage?action=change-tour`, { memberId, listingId, listingTitle });
    return res.data;
  },

  nudgeMembers: async (groupCode, adminMemberId) => {
    const res = await api.post(`/wander/groups/${groupCode}/nudge`, { adminMemberId });
    return res.data;
  },

  reactToMessage: async (groupCode, memberId, messageId, emoji) => {
    const res = await api.post(`/wander/groups/${groupCode}/chat/react`, { memberId, messageId, emoji });
    return res.data;
  },

  markChatRead: async (groupCode, memberId) => {
    const res = await api.post(`/wander/groups/${groupCode}/chat/read`, { memberId });
    return res.data;
  },

  uploadGroupAvatar: async (groupCode, memberId, imageUri) => {
    const formData = new FormData();
    formData.append('memberId', memberId);
    formData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'avatar.jpg' });
    const res = await api.post(`/wander/groups/${groupCode}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  updateGroupSettings: async (groupCode, memberId, data) => {
    const res = await api.patch(`/wander/groups/${groupCode}`, { memberId, ...data });
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
