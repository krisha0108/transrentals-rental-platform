// paymentService.js - Payment APIs for TransRentals Customer App
import api from '../api';

/**
 * Payment Service - Razorpay integration
 */
const paymentService = {
  /**
   * Create Razorpay order for booking payment
   */
  createOrder: async (bookingId, bookingType) => {
    const response = await api.post('/payments/create-order', {
      bookingId,
      bookingType,
    });
    return response.data;
  },

  /**
   * Verify payment after Razorpay callback
   */
  verifyPayment: async (razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId, bookingType) => {
    const response = await api.post('/payments/verify', {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      bookingId,
      bookingType,
    });
    return response.data;
  },

  /**
   * Get payment details/configuration
   */
  getPaymentDetails: async () => {
    const response = await api.get('/payment-details');
    return response.data;
  },

  /**
   * Get payment history for customer
   */
  getPaymentHistory: async (customerId) => {
    const response = await api.get('/customer/payments', {
      params: { customer_id: customerId }
    });
    return response.data;
  },

  /**
   * Request refund
   */
  requestRefund: async (bookingId, reason) => {
    const response = await api.post('/payments/refund-request', {
      bookingId,
      reason
    });
    return response.data;
  },
};

export default paymentService;
