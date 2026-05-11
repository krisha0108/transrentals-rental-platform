// chatService.js - Chat APIs for TransRentals Customer App
import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Chat Service - Real-time messaging with vendors
 */
const chatService = {
  /**
   * Start or get existing conversation with vendor
   */
  startConversation: async (vendorId, bookingId = null, bookingType = 'general') => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.post('/customer/chat/start', {
      customer_id: customer?.id,
      vendor_id: vendorId,
      booking_id: bookingId,
      booking_type: bookingType
    });
    return response.data;
  },

  /**
   * Get all chat conversations for customer
   */
  getConversations: async () => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.get('/customer/chat/conversations', {
      params: { customer_id: customer?.id }
    });
    return response.data;
  },

  /**
   * Get messages for a conversation
   */
  getMessages: async (conversationId, limit = 50, before = null) => {
    const params = { limit };
    if (before) params.before = before;

    const response = await api.get(`/customer/chat/${conversationId}/messages`, { params });
    return response.data;
  },

  /**
   * Send a message
   */
  sendMessage: async (conversationId, message, messageType = 'text') => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.post(`/customer/chat/${conversationId}/messages`, {
      message,
      sender_type: 'customer',
      sender_id: customer?.id,
      sender_name: customer?.name,
      message_type: messageType
    });
    return response.data;
  },

  /**
   * Send message with attachment
   */
  sendAttachment: async (conversationId, imageUri) => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const formData = new FormData();
    formData.append('sender_type', 'customer');
    formData.append('sender_id', customer?.id);
    formData.append('sender_name', customer?.name);
    formData.append('message_type', 'image');
    formData.append('attachment', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'attachment.jpg',
    });

    const response = await api.post(`/customer/chat/${conversationId}/messages`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Mark messages as read
   */
  markAsRead: async (conversationId) => {
    const response = await api.post(`/customer/chat/${conversationId}/read`);
    return response.data;
  },

  /**
   * Get bookings with active chat
   */
  getChatBookings: async () => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.get('/customer/chat/bookings', {
      params: {
        customer_id: customer?.id,
        email: customer?.email
      }
    });
    return response.data;
  },

  /**
   * Get live/active chats
   */
  getLiveChats: async () => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.get('/customer/chat/live-chats', {
      params: {
        customer_id: customer?.id,
        email: customer?.email
      }
    });
    return response.data;
  },

  /**
   * Get all conversations for customer (same endpoint as web, supports all booking types)
   */
  getCustomerConversations: async () => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);
    const params = { userType: 'customer' };
    if (customer?.phone) params.phone = customer.phone;
    else if (customer?.email) params.email = customer.email;
    const response = await api.get('/chat/conversations', { params });
    return response.data;
  },

  /**
   * Get quick reply templates
   */
  getQuickReplies: async () => {
    const response = await api.get('/customer/chat/quick-replies');
    return response.data;
  },

  /**
   * Get booking-specific chat messages and vendor info
   */
  getBookingChat: async (bookingId) => {
    const response = await api.get(`/customer/booking-chat/${bookingId}`);
    return response.data;
  },

  /**
   * Send message in booking chat
   */
  sendBookingMessage: async (bookingId, message, customerName) => {
    const response = await api.post(`/customer/booking-chat/${bookingId}`, {
      message,
      customer_name: customerName,
    });
    return response.data;
  },

  /**
   * Start or get existing driver conversation (customer initiates from booking detail)
   */
  startDriverConversation: async (bookingId, driverId = null, staffDriverId = null) => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);
    const response = await api.post('/customer/driver-chat', {
      bookingId,
      bookingType: 'chauffeur',
      customerId: customer?.id,
      driverId,
      staffDriverId,
    });
    return response.data;
  },

  /**
   * Get driver chat conversations for customer
   */
  getDriverConversations: async () => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);
    const params = {};
    if (customer?.phone) params.phone = customer.phone;
    else if (customer?.email) params.email = customer.email;
    const response = await api.get('/customer/driver-chat', { params });
    return response.data;
  },

  /**
   * Get messages for a driver conversation
   */
  getDriverMessages: async (conversationId, since = null) => {
    const params = {};
    if (since) params.since = since;
    const response = await api.get(`/customer/driver-chat/${conversationId}/messages`, { params });
    return response.data;
  },

  /**
   * Send message in driver conversation
   */
  sendDriverMessage: async (conversationId, content) => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);
    const response = await api.post(`/customer/driver-chat/${conversationId}/messages`, {
      content,
      customerId: customer?.id,
      senderName: customer?.name || 'Customer',
    });
    return response.data;
  },
};

export default chatService;
