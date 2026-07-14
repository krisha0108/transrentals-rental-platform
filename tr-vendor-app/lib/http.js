import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Same URL config as screens/api/client.js
const DEFAULT_PROD = "https://transrentals.in";
const DEFAULT_DEV_ANDROID = "http://localhost:3000"; // Physical device via ADB reverse
const DEFAULT_DEV_IOS = "http://localhost:3000";

const FORCE_PROD = true; // TEMP: testing against live API — flip back to false for local dev

function getBaseURL() {
  if (FORCE_PROD) return DEFAULT_PROD;
  if (__DEV__) {
    return Platform.OS === "android" ? DEFAULT_DEV_ANDROID : DEFAULT_DEV_IOS;
  }
  return DEFAULT_PROD;
}

export const API_BASE = `${getBaseURL()}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// inject vendor_id + tokens on every request (no middleware server-side)
api.interceptors.request.use(async (config) => {
  const vendorId   = await AsyncStorage.getItem('vendor_id');
  const token      = await AsyncStorage.getItem('vendor_token') || await AsyncStorage.getItem('nextauth_session_token');
  const fcmToken   = await AsyncStorage.getItem('fcm_token');

  // send both headers + query param (matches your style above)
  config.headers['X-Vendor-Id']   = vendorId || '';
  config.headers['X-Device-FCM']  = fcmToken || '';
  if (token) {
    config.headers['X-Session-Token'] = token;
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // also append vendor_id in query for GETs, or body for POSTs (backend friendly)
  if (config.method === 'get') {
    config.params = { ...(config.params || {}), vendor_id: vendorId };
  } else if (config.method === 'post' || config.method === 'put' || config.method === 'patch') {
    const isForm = config.headers?.['Content-Type']?.includes('multipart/form-data');
    if (!isForm) {
      config.data = { vendor_id: vendorId, ...(config.data || {}) };
    }
  }
  return config;
});
