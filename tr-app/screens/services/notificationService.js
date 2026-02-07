// notificationService.js - Notification APIs for TransRentals Customer App
import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Notification Service - Push notifications and in-app notifications
 */
const notificationService = {
  /**
   * Get all notifications for customer
   */
  getNotifications: async () => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    console.log('[notificationService] Customer data:', customer);
    console.log('[notificationService] Customer ID:', customer?.id);

    // Manually construct URL with query params (workaround for axios params issue)
    const url = `/customer/notifications?customer_id=${customer?.id}`;
    console.log('[notificationService] Calling URL:', url);

    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async () => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    // Manually construct URL with query params
    const url = `/customer/notifications/unread-count?customer_id=${customer?.id}`;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId) => {
    const response = await api.post(`/customer/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.post('/customer/notifications/read-all', {
      customer_id: customer?.id
    });
    return response.data;
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/customer/notifications/${notificationId}`);
    return response.data;
  },

  /**
   * Update notification preferences
   */
  updatePreferences: async (preferences) => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.put('/customer/notification-preferences', {
      customer_id: customer?.id,
      ...preferences
    });
    return response.data;
  },
};

export default notificationService;
