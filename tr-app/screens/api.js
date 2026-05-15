// api.js - Main API Configuration for TransRentals Customer App
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const dev = false; // 🏠 LOCAL DEV MODE - App will call local backend

// For Android Emulator: Use 10.0.2.2 (this is the host machine's localhost)
// For Physical Device: Use your computer's IP address
// To find your IP: Run "ipconfig" in CMD and look for IPv4 Address

// CHANGE THIS BASED ON YOUR SETUP:
// const LOCAL_HOST = '192.168.29.58'; // Physical Device -> Your PC's WiFi IP Address ✅
const LOCAL_HOST = 'localhost'; // Physical Device -> Your PC's WiFi IP Address
// const LOCAL_HOST = '10.0.2.2'; // Android Emulator -> Use this for emulator
const LOCAL_PORT = 3000; // Next.js dev server port

// New Website API Base URL (transrentals-new backend)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
const API_BASE_URL = dev
  ? `http://${LOCAL_HOST}:${LOCAL_PORT}/api` // Development
  : 'https://transrentals.in/api'; // Production URL 

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Log API calls in dev mode
      if (dev) {
        console.log(`📡 API Call: ${config.method?.toUpperCase()} ${config.url}`);
        console.log(`📡 Full URL: ${config.baseURL}${config.url}`);
        console.log(`📡 Params:`, JSON.stringify(config.params));
        console.log(`📡 Data:`, JSON.stringify(config.data));
      }
    } catch (error) {
      console.log('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (dev) {
      console.log(`✅ API Response: ${response.config.url} - Status: ${response.status}`);
    }
    return response;
  },
  async (error) => {
    if (dev) {
      console.log(`❌ API Error: ${error.config?.url} - ${error.message}`);
      console.log(`❌ Error Code: ${error.code}`);
      console.log(`❌ Full URL attempted: ${error.config?.baseURL}${error.config?.url}`);
      console.log(`❌ Error Details:`, error);
      console.log(`❌ Error Response Body:`, error.response?.data);
    }
    if (error.response) {
      // Handle 401 Unauthorized - token expired
      if (error.response.status === 401) {
        await AsyncStorage.multiRemove(['token', 'customer', 'customer_id']);
        // Navigation to login will be handled by the app
      }
      // Handle rate limiting
      if (error.response.status === 429) {
        const retryAfter = error.response.data?.retryAfter || 60;
        console.log(`Rate limited. Retry after ${retryAfter} seconds`);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Export base URL for image paths etc
export const BASE_URL = dev
  ? `http://${LOCAL_HOST}:${LOCAL_PORT}`
  : 'https://transrentals.in';

export const IMAGE_BASE_URL = `${BASE_URL}/uploads`;

// Log the current API configuration
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔧 API CONFIGURATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   Mode:', dev ? '🏠 LOCAL DEVELOPMENT' : '🌐 PRODUCTION');
console.log('   API URL:', API_BASE_URL);
console.log('   Images:', IMAGE_BASE_URL);
if (dev) {
  console.log('   ⚠️  Make sure backend is running: npm run dev');
  console.log('   ⚠️  Make sure ADB reverse: adb reverse tcp:3000 tcp:3000');
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
 