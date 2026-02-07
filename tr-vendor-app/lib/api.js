import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Same URL config as screens/api/client.js
const DEFAULT_PROD = "https://transrentals.in";
const DEFAULT_DEV_ANDROID = "http://192.168.29.68:3000"; // Updated to correct IP
const DEFAULT_DEV_IOS = "http://localhost:3000";

function getBaseURL() {
  if (__DEV__) {
    return Platform.OS === "android" ? DEFAULT_DEV_ANDROID : DEFAULT_DEV_IOS;
  }
  return DEFAULT_PROD;
}

export const api = axios.create({
  baseURL: `${getBaseURL()}/api`,
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const vendorId = await AsyncStorage.getItem('vendor_id');
  const fcm = await AsyncStorage.getItem('fcm_token');
  const token = await AsyncStorage.getItem('vendor_token') || await AsyncStorage.getItem('nextauth_session_token');

  config.headers['X-Vendor-Id'] = vendorId || '';
  config.headers['X-Device-FCM'] = fcm || '';
  if (token) {
    config.headers['X-Session-Token'] = token;
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  if (config.method === 'get') {
    config.params = { ...(config.params || {}), vendor_id: vendorId };
  } else {
    config.data = { vendor_id: vendorId, ...(config.data || {}) };
  }
  return config;
});

export default api;
