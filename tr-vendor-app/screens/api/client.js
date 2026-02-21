// src/api/client.js
// Updated for Next.js backend with NextAuth
import axios from "axios";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Next.js Backend Configuration
 * Base URL points to the Next.js app (not the old Laravel API)
 */
const DEFAULT_PROD = "https://transrentals.in";
// For physical Android device use ADB reverse: adb reverse tcp:3000 tcp:3000
const DEFAULT_DEV_ANDROID = "http://192.168.29.73:3000"; // WiFi IP
const DEFAULT_DEV_IOS = "http://localhost:3000";

function inferLocalBase() {
  return Platform.OS === "android" ? DEFAULT_DEV_ANDROID : DEFAULT_DEV_IOS;
}

let cachedBaseURL = null;

export async function getBaseURL() {
  if (cachedBaseURL) return cachedBaseURL;

  // 1) App-level override (changeable at runtime)
  const saved = await AsyncStorage.getItem("api_base_url");
  if (saved) {
    cachedBaseURL = saved;
    return cachedBaseURL;
  }

  // 2) ENV (optional)
  const ENV_URL = process.env.API_BASE_URL;
  if (ENV_URL) {
    cachedBaseURL = ENV_URL;
    return cachedBaseURL;
  }
<<<<<<< Updated upstream
  // 3) default - use prod unless in dev mode
  cachedBaseURL = __DEV__ ? inferLocalBase() : DEFAULT_PROD;
  // 3) default - always use production URL (transrentals.in)
  // cachedBaseURL = DEFAULT_PROD;
=======
  // 3) default - use localhost in dev (with ADB reverse), production otherwise
  cachedBaseURL = __DEV__ ? inferLocalBase() : DEFAULT_PROD;
>>>>>>> Stashed changes
  return cachedBaseURL;
}

export async function setBaseURL(newUrl) {
  cachedBaseURL = newUrl;
  await AsyncStorage.setItem("api_base_url", newUrl);
}

export function clearBaseURLCache() {
  cachedBaseURL = null;
}

// Store session token from NextAuth
let sessionToken = null;
let tokenLoadPromise = null;

async function loadTokenFromStorage() {
  if (tokenLoadPromise) return tokenLoadPromise;

  tokenLoadPromise = AsyncStorage.getItem("nextauth_session_token").then(stored => {
    sessionToken = stored;
    return stored;
  });

  return tokenLoadPromise;
}

export async function getSessionToken() {
  // If token is already in memory, return it
  if (sessionToken) return sessionToken;

  // Load from storage
  const stored = await loadTokenFromStorage();
  return stored;
}

export async function setSessionToken(token) {
  sessionToken = token;
  tokenLoadPromise = null; // Reset the load promise

  if (token) {
    await AsyncStorage.setItem("nextauth_session_token", token);
    console.log('[Auth] Token saved to storage');
  } else {
    await AsyncStorage.removeItem("nextauth_session_token");
    console.log('[Auth] Token removed from storage');
  }
}

export async function clearSession() {
  sessionToken = null;
  tokenLoadPromise = null;
  await AsyncStorage.removeItem("nextauth_session_token");
  await AsyncStorage.removeItem("vendor");
  await AsyncStorage.removeItem("vendor_id");
  await AsyncStorage.removeItem("vendor_email");
  console.log('[Auth] Session cleared');
}

// Debug: Check current auth state
export async function debugAuthState() {
  const token = await getSessionToken();
  const vendor = await AsyncStorage.getItem("vendor");
  const vendorId = await AsyncStorage.getItem("vendor_id");

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[Auth Debug] Current State:');
  console.log('  Token exists:', !!token);
  if (token) {
    console.log('  Token length:', token.length);
    console.log('  Token preview:', token.substring(0, 30) + '...');
  }
  console.log('  Vendor in storage:', !!vendor);
  console.log('  Vendor ID:', vendorId);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return { hasToken: !!token, hasVendor: !!vendor, vendorId };
}

// Axios instance builder for Next.js API routes
async function createInstance() {
  const baseURL = await getBaseURL();
  const instance = axios.create({
    baseURL: `${baseURL}/api`,
    timeout: 30000,
    withCredentials: true,
  });

  // Attach session cookie/token if present
  instance.interceptors.request.use(
    async (config) => {
      const token = await getSessionToken();
      if (token) {
        // NextAuth uses cookie-based sessions, but for mobile we send as header
        config.headers['Authorization'] = `Bearer ${token}`;
        config.headers['X-Session-Token'] = token;
        console.log('[Auth] ✅ Request with token to:', config.url);
        console.log('[Auth] Token (first 20 chars):', token.substring(0, 20) + '...');
      } else {
        console.log('[Auth] ❌ No token available for request to:', config.url);
        // Try to load vendor data from storage
        const vendorData = await AsyncStorage.getItem('vendor');
        const vendorId = await AsyncStorage.getItem('vendor_id');
        console.log('[Auth] Vendor in storage:', vendorData ? 'Yes' : 'No');
        console.log('[Auth] Vendor ID:', vendorId);
      }

      // IMPORTANT: For FormData, don't set Content-Type - let axios handle it
      if (config.data instanceof FormData) {
        console.log('[Auth] Detected FormData, removing Content-Type header');
        delete config.headers['Content-Type'];
      }

      return config;
    },
    (error) => {
      console.error('[Auth] Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Handle 401 responses and log errors
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error.response?.status;
      const url = error.config?.url;

      // Log all errors for debugging
      console.error('[API Error]', {
        url,
        status,
        message: error.message,
        code: error.code,
        data: error.response?.data,
      });

      if (status === 401) {
        console.error('[Auth] 401 Unauthorized for:', url);
        console.error('[Auth] Response:', error.response?.data);

        // Don't clear session for login/register endpoints
        if (!url?.includes('/auth/mobile-login') && !url?.includes('/register')) {
          console.log('[Auth] Clearing session due to 401');
          await clearSession();
        }
      }

      // Network errors
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        console.error('[Network] Connection issue:', {
          baseURL: error.config?.baseURL,
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout,
        });
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

// Simple wrappers
export async function apiGet(path, config = {}) {
  const api = await createInstance();
  return api.get(path, config);
}

export async function apiPost(path, data, config = {}) {
  const api = await createInstance();

  // If data is FormData, ensure Content-Type is set correctly
  if (data instanceof FormData) {
    console.log('[API] Sending FormData to:', path);
    // Don't set Content-Type manually - let axios handle it with boundary
    // But ensure we have the right transformers
    config = {
      ...config,
      headers: {
        ...config.headers,
        // Remove any Content-Type to let axios auto-detect
      },
      transformRequest: (data, headers) => {
        // For FormData, don't transform and let browser/axios handle it
        return data;
      },
    };
  }

  return api.post(path, data, config);
}

export async function apiPut(path, data, config = {}) {
  const api = await createInstance();

  // If data is FormData, ensure Content-Type is set correctly
  if (data instanceof FormData) {
    console.log('[API] Sending FormData (PUT) to:', path);
    config = {
      ...config,
      headers: {
        ...config.headers,
      },
      transformRequest: (data, headers) => {
        return data;
      },
    };
  }

  return api.put(path, data, config);
}

export async function apiPatch(path, data, config = {}) {
  const api = await createInstance();
  return api.patch(path, data, config);
}

export async function apiDelete(path, config = {}) {
  const api = await createInstance();
  return api.delete(path, config);
}

// ==================== AUTH APIs ====================

/**
 * Login vendor using NextAuth credentials
 */
export async function loginVendor(email, password, fcmToken = null) {
  const baseURL = await getBaseURL();

  // First, get CSRF token from NextAuth
  const csrfRes = await axios.get(`${baseURL}/api/vendor/auth/csrf`);
  const csrfToken = csrfRes.data?.csrfToken;

  // Then authenticate with credentials
  const res = await axios.post(
    `${baseURL}/api/vendor/auth/callback/vendor-credentials`,
    new URLSearchParams({
      email,
      password,
      csrfToken: csrfToken || '',
      callbackUrl: `${baseURL}/vendor/dashboard`,
      json: 'true',
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      withCredentials: true,
    }
  );

  // Check for session
  if (res.data?.url && !res.data?.error) {
    // Get session info
    const sessionRes = await axios.get(`${baseURL}/api/vendor/auth/session`, {
      withCredentials: true,
    });

    if (sessionRes.data?.user) {
      const vendor = sessionRes.data.user;
      // Store vendor info
      await AsyncStorage.setItem("vendor", JSON.stringify(vendor));
      await AsyncStorage.setItem("vendor_id", String(vendor.id));
      await AsyncStorage.setItem("vendor_email", vendor.email || '');

      // If we have a token from cookies, store it
      const cookies = res.headers['set-cookie'];
      if (cookies) {
        const sessionCookie = cookies.find(c => c.includes('next-auth.session-token-vendor'));
        if (sessionCookie) {
          const tokenMatch = sessionCookie.match(/next-auth\.session-token-vendor=([^;]+)/);
          if (tokenMatch) {
            await setSessionToken(tokenMatch[1]);
          }
        }
      }

      // Update FCM token if provided
      if (fcmToken) {
        try {
          await saveVendorFcmToken(fcmToken);
        } catch (e) {
          console.log('Failed to update FCM token:', e);
        }
      }

      return { success: true, vendor };
    }
  }

  throw new Error(res.data?.error || 'Login failed');
}

/**
 * Alternative login - direct API call for mobile
 */
export async function loginVendorDirect(email, password, fcmToken = null) {
  const baseURL = await getBaseURL();

  console.log('[Login] Attempting login for:', email);

  const res = await axios.post(`${baseURL}/api/vendor/auth/mobile-login`, {
    email,
    password,
    fcmToken,
  });

  console.log('[Login] Response received:', {
    success: res.data?.success,
    hasVendor: !!res.data?.vendor,
    hasToken: !!res.data?.token,
  });

  if (res.data?.success && res.data?.vendor) {
    const { vendor, token } = res.data;

    console.log('[Login] Saving vendor data to storage...');
    await AsyncStorage.setItem("vendor", JSON.stringify(vendor));
    await AsyncStorage.setItem("vendor_id", String(vendor.id));
    await AsyncStorage.setItem("vendor_email", vendor.email || '');

    if (token) {
      console.log('[Login] Saving token, length:', token.length);
      await setSessionToken(token);

      // Verify token was saved
      const savedToken = await getSessionToken();
      console.log('[Login] Token verification:', savedToken === token ? '✅ Match' : '❌ Mismatch');
    } else {
      console.warn('[Login] ⚠️ No token received from backend!');
    }

    return { success: true, vendor, token };
  }

  throw new Error(res.data?.error || 'Login failed');
}

/**
 * Register new vendor
 */
export async function registerVendor(data) {
  const res = await apiPost('/vendor/register', {
    email: data.email,
    password: data.password,
    phone: data.phone,
    businessName: data.businessName,
    businessType: data.businessType || null,
    ownerName: data.ownerName,
    gstNumber: data.gstNumber || null,
    panNumber: data.panNumber || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    pincode: data.pincode || null,
  });

  return res.data;
}

/**
 * Logout vendor
 */
export async function logoutVendor() {
  try {
    const baseURL = await getBaseURL();
    await axios.post(`${baseURL}/api/vendor/auth/signout`, {}, { withCredentials: true });
  } catch (e) {
    console.log('Logout API error (non-critical):', e);
  }

  // Clear local storage
  await setSessionToken(null);
  await AsyncStorage.multiRemove([
    'vendor',
    'vendor_id',
    'vendor_email',
    'vendor_token',
    'vendor_phone',
  ]);
}

/**
 * Get current vendor profile
 */
export async function getVendorProfile() {
  const res = await apiGet('/vendor/profile');
  return res.data;
}

// ==================== DOCUMENT APIs ====================

/**
 * Get vendor documents
 */
export async function getVendorDocuments() {
  const res = await apiGet('/vendor/documents');
  return res.data;
}

/**
 * Upload vendor document
 * Uses fetch API for better React Native compatibility
 */
export async function uploadVendorDocument(formData) {
  try {
    console.log('[Upload] Starting document upload with fetch API...');
    console.log('[Upload] FormData parts:', formData._parts);

    const baseURL = await getBaseURL();
    const sessionToken = await getSessionToken();

    if (!sessionToken) {
      throw new Error('No session token found');
    }

    console.log('[Upload] Making fetch request to:', `${baseURL}/api/vendor/documents`);

    // Use fetch API instead of axios for better React Native compatibility
    const response = await fetch(`${baseURL}/api/vendor/documents`, {
      method: 'POST',
      headers: {
        'X-Session-Token': sessionToken,
        // Don't set Content-Type - let fetch handle it for FormData
      },
      body: formData,
    });

    console.log('[Upload] Document response status:', response.status);

    const data = await response.json();
    console.log('[Upload] Document response data:', data);

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Document upload failed');
    }

    console.log('[Upload] Document uploaded successfully');
    return data;
  } catch (error) {
    console.error('[Upload] Document error:', error);
    console.error('[Upload] Error details:', {
      message: error.message,
      name: error.name,
    });
    throw error;
  }
}

/**
 * Delete vendor document
 */
export async function deleteVendorDocument(docId) {
  const res = await apiDelete(`/vendor/documents/${docId}`);
  return res.data;
}

/**
 * Upload vendor logo/profile image
 */
export async function uploadVendorLogo(formData) {
  try {
    console.log('[Upload] Starting upload with fetch API...');
    console.log('[Upload] FormData parts:', formData._parts);

    const baseURL = await getBaseURL();
    const sessionToken = await getSessionToken();

    if (!sessionToken) {
      throw new Error('No session token found');
    }

    console.log('[Upload] Making fetch request to:', `${baseURL}/api/vendor/profile/upload-logo`);
    console.log('[Upload] Session token (first 20):', sessionToken.substring(0, 20) + '...');

    // Use fetch API instead of axios for better React Native compatibility
    const response = await fetch(`${baseURL}/api/vendor/profile/upload-logo`, {
      method: 'POST',
      headers: {
        'X-Session-Token': sessionToken,
        // Don't set Content-Type - let fetch handle it for FormData
      },
      body: formData,
    });

    console.log('[Upload] Response status:', response.status);
    console.log('[Upload] Response headers:', response.headers);

    const data = await response.json();
    console.log('[Upload] Response data:', data);

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Upload failed');
    }

    return data;
  } catch (error) {
    console.error('[Upload] Error:', error);
    console.error('[Upload] Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    throw error;
  }
}

// ==================== SERVICE APIs ====================

/**
 * Get vendor services (approved and requests)
 */
export async function getVendorServices() {
  const res = await apiGet('/vendor/services');
  return res.data;
}

/**
 * Request a new service
 */
export async function requestService(serviceId, message = '') {
  const res = await apiPost('/vendor/services', { serviceId, message });
  return res.data;
}

/**
 * Get all available services list
 */
export async function getAvailableServices() {
  const res = await apiGet('/admin/services/list');
  return res.data;
}

// ==================== LOCATION APIs ====================

/**
 * Get vendor locations (approved and requests)
 */
export async function getVendorLocations() {
  const res = await apiGet('/vendor/locations');
  return res.data;
}

/**
 * Request a new location
 */
export async function requestLocation(locationId, message = '') {
  const res = await apiPost('/vendor/locations', { locationId, message });
  return res.data;
}

/**
 * Request multiple locations at once
 */
export async function requestLocationsBulk(locationIds, message = '') {
  const res = await apiPost('/vendor/locations/bulk', { locationIds, message });
  return res.data;
}

/**
 * Get all available locations
 */
export async function getAvailableLocations() {
  const res = await apiGet('/locations');
  return res.data;
}

// ==================== BOOKING APIs (Service-specific) ====================

/**
 * Map service type to backend endpoint format
 * No mapping needed - all services use their original names
 */
function mapServiceTypeForBackend(serviceType) {
  // Currently no mapping needed, backend uses same names
  // Keep this function for future mappings if needed
  return serviceType;
}

/**
 * Get bookings by service type
 * serviceType: 'car', 'bike', 'bus', 'luxury', 'equipment', 'truck', 'packers', 'self-drive'
 */
export async function getBookingsByService(serviceType, params = {}) {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/${mappedServiceType}-bookings${queryString ? `?${queryString}` : ''}`;
  console.log('[API] Fetching bookings:', { serviceType, mappedServiceType, fullEndpoint: `/vendor${endpoint}` });
  const res = await apiGet(`/vendor${endpoint}`);
  return res.data;
}

/**
 * Simplified helper for getBookingsByService
 * Used by service-specific BookingsScreen components
 * @param {string} serviceType - The service type (bike, bus, equipment, etc.)
 * @param {object|string} filterOrParams - Either a filter string (legacy) or params object with pagination
 */
export async function getBookings(serviceType, filterOrParams = null) {
  try {
    let params = {};

    // Support both legacy filter string and new params object
    if (typeof filterOrParams === 'string') {
      params = { filter: filterOrParams };
    } else if (typeof filterOrParams === 'object' && filterOrParams !== null) {
      params = filterOrParams;
    }

    const response = await getBookingsByService(serviceType, params);
    return {
      success: true,
      bookings: response.bookings || [],
      pagination: response.pagination || null,
    };
  } catch (error) {
    console.error(`Failed to fetch ${serviceType} bookings:`, error);
    console.error('Error response data:', error.response?.data);
    console.error('Error status:', error.response?.status);
    return { success: false, bookings: [], pagination: null };
  }
}

/**
 * Get single booking by service type
 */
export async function getBookingById(serviceType, bookingId) {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  const res = await apiGet(`/vendor/${mappedServiceType}-bookings/${bookingId}`);
  return res.data;
}

/**
 * Accept a booking
 */
export async function acceptBooking(serviceType, bookingId) {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  const res = await apiPost(`/vendor/${mappedServiceType}-bookings/${bookingId}/accept`);
  return res.data;
}

/**
 * Reject a booking
 */
export async function rejectBooking(serviceType, bookingId, reason = '') {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  const res = await apiPost(`/vendor/${mappedServiceType}-bookings/${bookingId}/reject`, { reason });
  return res.data;
}

/**
 * Complete a booking
 */
export async function completeBooking(serviceType, bookingId) {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  const res = await apiPost(`/vendor/${mappedServiceType}-bookings/${bookingId}/complete`);
  return res.data;
}

/**
 * Generate trip OTP for booking
 * Used when customer arrives for pickup
 */
export async function generateTripOtp(serviceType, bookingId) {
  // Bike uses general bookings endpoint, others use vendor-specific endpoints
  let endpoint;
  if (serviceType === 'bike') {
    endpoint = `/bookings/${bookingId}/otp`;
  } else {
    const mappedServiceType = mapServiceTypeForBackend(serviceType);
    endpoint = `/vendor/${mappedServiceType}-bookings/${bookingId}/otp`;
  }
  const res = await apiGet(endpoint);
  return res.data;
}

/**
 * Verify trip OTP and start/end trip
 * action: 'start' or 'end'
 */
export async function verifyTripOtp(serviceType, bookingId, otp, action = 'start') {
  // Bike uses general bookings endpoint, others use vendor-specific endpoints
  let endpoint;
  if (serviceType === 'bike') {
    endpoint = `/bookings/${bookingId}/otp`;
  } else {
    const mappedServiceType = mapServiceTypeForBackend(serviceType);
    endpoint = `/vendor/${mappedServiceType}-bookings/${bookingId}/otp`;
  }
  const res = await apiPost(endpoint, { otp, action });
  return res.data;
}

/**
 * Assign operator/driver to a booking
 */
export async function assignOperator(serviceType, bookingId, operatorData) {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  // Use correct action based on service type
  // Equipment uses 'assign_operator', others use 'assign_driver'
  const action = serviceType === 'equipment' ? 'assign_operator' : 'assign_driver';

  const res = await apiPatch(`/vendor/${mappedServiceType}-bookings/${bookingId}`, {
    action,
    ...operatorData,
  });
  return res.data;
}

/**
 * Update driver/operator details for a booking
 */
export async function updateAssignment(serviceType, bookingId, assignmentData) {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  // Use correct action based on service type
  const action = serviceType === 'equipment' ? 'update_operator' : 'update_driver';

  const res = await apiPatch(`/vendor/${mappedServiceType}-bookings/${bookingId}`, {
    action,
    ...assignmentData,
  });
  return res.data;
}

// ==================== QUOTE REQUEST APIs ====================

/**
 * Get quote requests by service type
 */
export async function getQuoteRequests(serviceType, params = {}) {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/${mappedServiceType}-quote-requests${queryString ? `?${queryString}` : ''}`;
  const res = await apiGet(`/vendor${endpoint}`);
  return res.data;
}

/**
 * Get single quote request
 */
export async function getQuoteRequestById(serviceType, requestId) {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  const res = await apiGet(`/vendor/${mappedServiceType}-quote-requests/${requestId}`);
  return res.data;
}

/**
 * Submit quote for a request
 */
export async function submitQuote(serviceType, quoteData) {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  const res = await apiPost(`/vendor/${mappedServiceType}-quotes`, quoteData);
  return res.data;
}

/**
 * Get vendor's submitted quotes
 */
export async function getVendorQuotes(serviceType, params = {}) {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/${mappedServiceType}-quotes${queryString ? `?${queryString}` : ''}`;
  const res = await apiGet(`/vendor${endpoint}`);
  return res.data;
}

// ==================== FLEET APIs ====================

/**
 * Get vendor fleet/vehicles
 */
export async function getVendorFleet(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const res = await apiGet(`/vendor/fleet${queryString ? `?${queryString}` : ''}`);
  return res.data;
}

/**
 * Add vehicle to fleet
 */
export async function addVehicle(vehicleData) {
  const res = await apiPost('/vendor/fleet', vehicleData);
  return res.data;
}

/**
 * Update vehicle
 */
export async function updateVehicle(vehicleId, vehicleData) {
  const res = await apiPut(`/vendor/fleet/${vehicleId}`, vehicleData);
  return res.data;
}

/**
 * Delete vehicle
 */
export async function deleteVehicle(vehicleId) {
  const res = await apiDelete(`/vendor/fleet/${vehicleId}`);
  return res.data;
}

// ==================== STAFF APIs ====================

/**
 * Get vendor staff
 */
export async function getVendorStaff() {
  const res = await apiGet('/vendor/staff');
  return res.data;
}

/**
 * Add staff member
 */
export async function addStaff(staffData) {
  const res = await apiPost('/vendor/staff', staffData);
  return res.data;
}

/**
 * Update staff member
 */
export async function updateStaff(staffId, staffData) {
  const res = await apiPut(`/vendor/staff/${staffId}`, staffData);
  return res.data;
}

/**
 * Get staff drivers
 */
export async function getStaffDrivers() {
  const res = await apiGet('/vendor/staff/drivers');
  return res.data;
}

/**
 * Get fleet vehicles
 */
export async function getFleetVehicles() {
  const res = await apiGet('/vendor/fleet');
  return res.data;
}

/**
 * Delete staff member
 */
export async function deleteStaff(staffId) {
  const res = await apiDelete(`/vendor/staff/${staffId}`);
  return res.data;
}

/**
 * Get staff attendance for a month
 */
export async function getStaffAttendance(month, year) {
  const res = await apiGet(`/vendor/staff/attendance?month=${month}&year=${year}`);
  return res.data;
}

/**
 * Mark staff attendance (bulk)
 */
export async function markStaffAttendance(records) {
  const res = await apiPost('/vendor/staff/attendance', { records });
  return res.data;
}

/**
 * Get staff payroll for a month
 */
export async function getStaffPayroll(month, year) {
  const res = await apiGet(`/vendor/staff/payments?month=${month}&year=${year}`);
  return res.data;
}

/**
 * Mark staff payment as paid
 */
export async function markStaffPayment(data) {
  const res = await apiPost('/vendor/staff/payments', data);
  return res.data;
}

// ==================== NOTIFICATION APIs ====================

/**
 * Get vendor notifications
 */
export async function getVendorNotifications() {
  const res = await apiGet('/vendor/notifications');
  return res.data;
}

// ==================== CHAT APIs ====================

/**
 * Get chat messages for a booking
 */
export async function getChatMessages(bookingId) {
  const res = await apiGet(`/vendor/chat/${bookingId}`);
  return res.data;
}

/**
 * Send chat message
 */
export async function sendChatMessage(bookingId, message) {
  const res = await apiPost(`/vendor/chat/${bookingId}`, { message });
  return res.data;
}

// ==================== DASHBOARD APIs ====================

/**
 * Get vendor bookings summary for dashboard
 */
export async function getVendorBookings(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const res = await apiGet(`/vendor/bookings${queryString ? `?${queryString}` : ''}`);
  return res.data;
}

/**
 * Get vendor earnings summary
 */
export async function getVendorEarnings(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  console.log('[API Client] Fetching earnings with params:', params);
  const res = await apiGet(`/vendor/earnings${queryString ? `?${queryString}` : ''}`);
  console.log('[API Client] Earnings Response:', JSON.stringify(res.data, null, 2));
  return res.data;
}

/**
 * Get vendor earnings debug data - shows all bookings without filters
 */
export async function getVendorEarningsDebug() {
  console.log('[API Client] Fetching earnings debug data...');
  const res = await apiGet('/vendor/earnings-debug');
  console.log('[API Client] ========== EARNINGS DEBUG DATA ==========');
  console.log('[API Client] Vendor ID:', res.data.vendorId);
  console.log('[API Client] Bike Bookings:', res.data.debug?.bike?.count || 0);
  if (res.data.debug?.bike?.bookings?.length > 0) {
    console.log('[API Client] Bike Details:', JSON.stringify(res.data.debug.bike.bookings, null, 2));
  }
  console.log('[API Client] Car/Self-Drive Bookings:', res.data.debug?.car?.count || 0);
  if (res.data.debug?.car?.bookings?.length > 0) {
    console.log('[API Client] Car Details:', JSON.stringify(res.data.debug.car.bookings, null, 2));
  }
  console.log('[API Client] Bus Bookings:', res.data.debug?.bus?.count || 0);
  if (res.data.debug?.bus?.bookings?.length > 0) {
    console.log('[API Client] Bus Details:', JSON.stringify(res.data.debug.bus.bookings, null, 2));
  }
  console.log('[API Client] Truck Bookings:', res.data.debug?.truck?.count || 0);
  if (res.data.debug?.truck?.bookings?.length > 0) {
    console.log('[API Client] Truck Details:', JSON.stringify(res.data.debug.truck.bookings, null, 2));
  }
  console.log('[API Client] Packers Bookings:', res.data.debug?.packers?.count || 0);
  if (res.data.debug?.packers?.bookings?.length > 0) {
    console.log('[API Client] Packers Details:', JSON.stringify(res.data.debug.packers.bookings, null, 2));
  }
  console.log('[API Client] Equipment Bookings:', res.data.debug?.equipment?.count || 0);
  if (res.data.debug?.equipment?.bookings?.length > 0) {
    console.log('[API Client] Equipment Details:', JSON.stringify(res.data.debug.equipment.bookings, null, 2));
  }
  console.log('[API Client] Luxury Bookings:', res.data.debug?.luxury?.count || 0);
  if (res.data.debug?.luxury?.bookings?.length > 0) {
    console.log('[API Client] Luxury Details:', JSON.stringify(res.data.debug.luxury.bookings, null, 2));
  }
  console.log('[API Client] ==========================================');
  return res.data;
}

/**
 * Get vendor chats list
 */
export async function getVendorChats() {
  const res = await apiGet('/vendor/chats');
  return res.data;
}

/**
 * Get vendor calendar data
 */
export async function getVendorCalendar(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const res = await apiGet(`/vendor/calendar${queryString ? `?${queryString}` : ''}`);
  return res.data;
}

// ==================== TEMPLATE APIs ====================

/**
 * Get templates by service type
 * serviceType: 'bus', 'truck', 'equipment', 'luxury', 'packers', 'self-drive', 'bike'
 */
export async function getTemplates(serviceType, params = {}) {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  const queryString = new URLSearchParams(params).toString();
  const res = await apiGet(`/vendor/${mappedServiceType}-templates${queryString ? `?${queryString}` : ''}`);
  return res.data;
}

/**
 * Get single template by ID
 */
export async function getTemplateById(serviceType, templateId) {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  const res = await apiGet(`/vendor/${mappedServiceType}-templates/${templateId}`);
  return res.data;
}

/**
 * Create new template
 */
export async function createTemplate(serviceType, templateData) {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  const res = await apiPost(`/vendor/${mappedServiceType}-templates`, templateData);
  return res.data;
}

/**
 * Update template
 */
export async function updateTemplate(serviceType, templateId, templateData) {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  // Luxury uses PATCH, others use PUT
  if (serviceType === 'luxury') {
    const res = await apiPatch(`/vendor/${mappedServiceType}-templates/${templateId}`, templateData);
    return res.data;
  }
  const res = await apiPut(`/vendor/${mappedServiceType}-templates/${templateId}`, templateData);
  return res.data;
}

/**
 * Delete template
 */
export async function deleteTemplate(serviceType, templateId) {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  const res = await apiDelete(`/vendor/${mappedServiceType}-templates/${templateId}`);
  return res.data;
}

/**
 * Duplicate template
 */
export async function duplicateTemplate(serviceType, templateId) {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  const res = await apiPost(`/vendor/${mappedServiceType}-templates/${templateId}/duplicate`);
  return res.data;
}

/**
 * Set template as default
 */
export async function setTemplateDefault(serviceType, templateId) {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  const res = await apiPut(`/vendor/${mappedServiceType}-templates/${templateId}`, { isDefault: true });
  return res.data;
}

/**
 * Toggle template active status
 */
export async function toggleTemplateActive(serviceType, templateId, isActive) {
  const mappedServiceType = mapServiceTypeForBackend(serviceType);
  if (serviceType === 'luxury') {
    const res = await apiPatch(`/vendor/${mappedServiceType}-templates/${templateId}`, { isActive });
    return res.data;
  }
  const res = await apiPut(`/vendor/${mappedServiceType}-templates/${templateId}`, { isActive });
  return res.data;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Check if vendor is authenticated
 */
export async function isAuthenticated() {
  try {
    const vendor = await AsyncStorage.getItem("vendor");
    const token = await getSessionToken();
    return !!(vendor && token);
  } catch {
    return false;
  }
}

/**
 * Get stored vendor data
 */
export async function getStoredVendor() {
  try {
    const vendorStr = await AsyncStorage.getItem("vendor");
    return vendorStr ? JSON.parse(vendorStr) : null;
  } catch {
    return null;
  }
}
