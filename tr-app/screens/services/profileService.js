// profileService.js - Profile Management APIs for TransRentals Customer App
import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Profile Service - Customer profile management
 */
const profileService = {
  /**
   * Get customer profile
   */
  getProfile: async () => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.get('/customer/profile', {
      params: { customer_id: customer?.id }
    });
    return response.data;
  },

  /**
   * Update customer profile
   */
  updateProfile: async (profileData) => {
    /**
     * profileData can include:
     * - name, email, phone
     * - avatar (base64 or URL)
     * - dateOfBirth, gender
     * - address, city, state, pincode
     * - drivingLicenseNumber, drivingLicenseExpiry
     * - aadharNumber
     */
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.put('/customer/profile', {
      customer_id: customer?.id,
      ...profileData
    });

    // Update local storage with new data
    if (response.data.success && response.data.customer) {
      await AsyncStorage.setItem('customer', JSON.stringify(response.data.customer));
    }

    return response.data;
  },

  /**
   * Upload profile image
   */
  uploadProfileImage: async (imageUri) => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const formData = new FormData();
    formData.append('customer_id', customer?.id);
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    });

    const response = await api.post('/customer/profile/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Upload document (driving license, aadhar, etc.)
   */
  uploadDocument: async (documentType, imageUri) => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const formData = new FormData();
    formData.append('customer_id', customer?.id);
    formData.append('document_type', documentType);
    formData.append('document', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `${documentType}.jpg`,
    });

    const response = await api.post('/customer/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Get customer documents
   */
  getDocuments: async () => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.get('/customer/documents', {
      params: { customer_id: customer?.id }
    });
    return response.data;
  },

  /**
   * Update customer location (GPS)
   */
  updateLocation: async (latitude, longitude, city) => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.post('/customer/location', {
      customer_id: customer?.id,
      latitude,
      longitude,
      city
    });
    return response.data;
  },

  /**
   * Get customer expenses/spending history
   */
  getExpenses: async () => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.get('/customer/expenses', {
      params: { customer_id: customer?.id }
    });
    return response.data;
  },

  /**
   * Get customer financials summary
   */
  getFinancials: async () => {
    const customerData = await AsyncStorage.getItem('customer');
    const customer = JSON.parse(customerData);

    const response = await api.get('/customer/financials', {
      params: { customer_id: customer?.id }
    });
    return response.data;
  },
};

export default profileService;
