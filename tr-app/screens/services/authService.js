// authService.js - Authentication APIs for TransRentals Customer App
import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Customer Authentication Service
 * All auth endpoints use single /customer/auth endpoint with action parameter
 */
const authService = {
  /**
   * Login with email and password
   */
  login: async (email, password) => {
    const response = await api.post('/customer/auth', {
      action: 'login',
      email,
      password,
    });
    return response.data;
  },

  /**
   * Register new customer directly (without OTP)
   */
  register: async (name, email, phone, password) => {
    const response = await api.post('/customer/auth', {
      action: 'register',
      name,
      email,
      phone,
      password,
    });
    return response.data;
  },

  /**
   * Register new customer - sends OTP to email
   */
  sendOtp: async (name, email, phone, password) => {
    const response = await api.post('/customer/auth', {
      action: 'send-otp',
      name,
      email,
      phone,
      password,
    });
    return response.data;
  },

  /**
   * Verify OTP and complete registration
   */
  verifyOtp: async (email, otp) => {
    const response = await api.post('/customer/auth', {
      action: 'verify-otp',
      email,
      otp,
    });
    return response.data;
  },

  /**
   * Google login/signup
   */
  googleLogin: async (idToken, email, name) => {
    const response = await api.post('/customer/auth', {
      action: 'google-login',
      idToken,
      email,
      name,
    });
    return response.data;
  },

  /**
   * Check if customer exists
   */
  checkExists: async (email, phone) => {
    const response = await api.post('/customer/auth', {
      action: 'check-exists',
      email,
      phone,
    });
    return response.data;
  },

  /**
   * Forgot password - send OTP
   */
  forgotPassword: async (email) => {
    const response = await api.post('/customer/auth', {
      action: 'forgot-password',
      email,
    });
    return response.data;
  },

  /**
   * Reset password with OTP
   */
  resetPassword: async (email, otp, password) => {
    const response = await api.post('/customer/auth', {
      action: 'reset-password',
      email,
      otp,
      password,
    });
    return response.data;
  },

  /**
   * Set password for customers without password (Google signup)
   */
  setPassword: async (email, password, customerId) => {
    const response = await api.post('/customer/auth', {
      action: 'set-password',
      email,
      password,
      customerId,
    });
    return response.data;
  },

  /**
   * Save FCM token for push notifications
   */
  saveFcmToken: async (customerId, fcmToken) => {
    const response = await api.post('/customer/fcm-token', {
      customer_id: customerId,
      fcm_token: fcmToken,
    });
    return response.data;
  },

  /**
   * Logout - clear local storage
   */
  logout: async () => {
    await AsyncStorage.multiRemove(['token', 'customer', 'customer_id']);
    return { success: true };
  },

  /**
   * Get current customer from storage
   */
  getCurrentCustomer: async () => {
    const customerData = await AsyncStorage.getItem('customer');
    return customerData ? JSON.parse(customerData) : null;
  },

  /**
   * Save customer data to storage after login/register
   */
  saveCustomerData: async (customer, token) => {
    await AsyncStorage.setItem('customer', JSON.stringify(customer));
    await AsyncStorage.setItem('customer_id', customer.id);
    await AsyncStorage.setItem('token', token);
  },
};

export default authService;
