// helpdeskService.js - Helpdesk/Support APIs for TransRentals Customer App
import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Helpdesk Service - Customer support tickets
 */
const helpdeskService = {
  /**
   * Create support ticket
   */
  createTicket: async (subject, message, attachmentUri = null) => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const formData = new FormData();
    formData.append('customer_id', customer?.id);
    formData.append('customer_email', customer?.email);
    formData.append('customer_name', customer?.name);
    formData.append('subject', subject);
    formData.append('message', message);

    if (attachmentUri) {
      formData.append('attachment', {
        uri: attachmentUri,
        type: 'image/jpeg',
        name: 'attachment.jpg',
      });
    }

    const response = await api.post('/customer/helpdesk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get all tickets for customer
   */
  getTickets: async () => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.get('/customer/helpdesk', {
      params: { customer_id: customer?.id }
    });
    return response.data;
  },

  /**
   * Get ticket details
   */
  getTicketDetails: async (ticketId) => {
    const response = await api.get(`/customer/helpdesk/${ticketId}`);
    return response.data;
  },

  /**
   * Add reply to ticket
   */
  addReply: async (ticketId, message, attachmentUri = null) => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const formData = new FormData();
    formData.append('customer_id', customer?.id);
    formData.append('message', message);

    if (attachmentUri) {
      formData.append('attachment', {
        uri: attachmentUri,
        type: 'image/jpeg',
        name: 'attachment.jpg',
      });
    }

    const response = await api.post(`/customer/helpdesk/${ticketId}/reply`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Close ticket
   */
  closeTicket: async (ticketId) => {
    const response = await api.post(`/customer/helpdesk/${ticketId}/close`);
    return response.data;
  },
};

export default helpdeskService;
