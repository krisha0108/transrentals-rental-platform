import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_PROD = 'https://transrentals.in';
const DEFAULT_DEV = 'http://localhost:3000';

function inferLocalBase() {
  return Platform.OS === 'android' ? DEFAULT_DEV : DEFAULT_DEV;
}

let cachedBaseURL = null;

export async function getBaseURL() {
  if (cachedBaseURL) return cachedBaseURL;
  if (__DEV__) {
    cachedBaseURL = inferLocalBase();
    return cachedBaseURL;
  }
  const saved = await AsyncStorage.getItem('driver_api_base_url');
  if (saved) { cachedBaseURL = saved; return cachedBaseURL; }
  cachedBaseURL = DEFAULT_PROD;
  return cachedBaseURL;
}

// Auth token
let driverToken = null;

export async function getDriverToken() {
  if (driverToken) return driverToken;
  driverToken = await AsyncStorage.getItem('driver_app_token');
  return driverToken;
}

export async function setDriverToken(token) {
  driverToken = token;
  await AsyncStorage.setItem('driver_app_token', token);
}

export async function clearDriverToken() {
  driverToken = null;
  await AsyncStorage.removeItem('driver_app_token');
  await AsyncStorage.removeItem('driver_app_user');
}

// Axios instance
let _client = null;

async function getClient() {
  if (_client) return _client;
  const base = await getBaseURL();
  _client = axios.create({ baseURL: base, timeout: 15000 });

  // Request interceptor — attach token
  _client.interceptors.request.use(async (config) => {
    const token = await getDriverToken();
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  });

  // Response interceptor — handle 401
  _client.interceptors.response.use(
    (res) => res,
    async (error) => {
      if (error.response?.status === 401) {
        await clearDriverToken();
      }
      return Promise.reject(error);
    }
  );

  return _client;
}

const BASE = '/api/driver-app';

// ── Auth ─────────────────────────────────────────────────────────────────────
export async function registerDriver(data) {
  const c = await getClient();
  return c.post(`${BASE}/auth/register`, data);
}

export async function loginDriver(email, password, fcmToken) {
  const c = await getClient();
  return c.post(`${BASE}/auth/login`, { email, password, fcmToken });
}

export async function logoutDriver() {
  const c = await getClient();
  try { await c.post(`${BASE}/auth/logout`); } catch {}
  await clearDriverToken();
}

export async function getDriverMe() {
  const c = await getClient();
  return c.get(`${BASE}/auth/me`);
}

// ── Profile ───────────────────────────────────────────────────────────────────
export async function getDriverProfile() {
  const c = await getClient();
  return c.get(`${BASE}/profile`);
}

export async function updateDriverProfile(data) {
  const c = await getClient();
  return c.patch(`${BASE}/profile`, data);
}

export async function uploadDriverProfilePhoto(fileUri, fileName, mimeType) {
  const c = await getClient();
  const fd = new FormData();
  fd.append('file', { uri: fileUri, name: fileName, type: mimeType });
  return c.post(`${BASE}/profile/photo`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// ── Bookings ──────────────────────────────────────────────────────────────────
export async function getAvailableBookings(show = 'upcoming') {
  const c = await getClient();
  return c.get(`${BASE}/bookings/available?show=${show}`);
}

export async function getMyBookings(filter = 'active') {
  const c = await getClient();
  return c.get(`${BASE}/bookings?filter=${filter}`);
}

export async function getBookingById(bookingId, source = 'chauffeur') {
  const c = await getClient();
  return c.get(`${BASE}/bookings/${bookingId}?source=${source}`);
}

export async function acceptBooking(bookingId) {
  const c = await getClient();
  return c.post(`${BASE}/bookings/${bookingId}/accept`);
}

export async function assignVehicle(bookingId, data) {
  const c = await getClient();
  return c.post(`${BASE}/bookings/${bookingId}/assign-vehicle`, data);
}

export async function requestOtp(bookingId, source = 'chauffeur') {
  const c = await getClient();
  return c.post(`${BASE}/bookings/${bookingId}/request-otp`, { source });
}

export async function startTrip(bookingId, otp, source = 'chauffeur') {
  const c = await getClient();
  return c.post(`${BASE}/bookings/${bookingId}/start-trip`, { otp, source });
}

export async function completeTrip(bookingId, data = {}, source = 'chauffeur') {
  const c = await getClient();
  return c.post(`${BASE}/bookings/${bookingId}/complete`, { ...data, source });
}

export async function startTransit(bookingId, source = 'truck') {
  const c = await getClient();
  return c.post(`${BASE}/bookings/${bookingId}/start-transit`, { source });
}

export async function startUnloading(bookingId, otp, source = 'truck') {
  const c = await getClient();
  return c.post(`${BASE}/bookings/${bookingId}/start-unloading`, { otp, source });
}

export async function startPackingLoading(bookingId, otp) {
  const c = await getClient();
  return c.post(`${BASE}/bookings/${bookingId}/start-loading`, { otp });
}

export async function startUnpacking(bookingId) {
  const c = await getClient();
  return c.post(`${BASE}/bookings/${bookingId}/start-unpacking`);
}

export async function startUse(bookingId) {
  const c = await getClient();
  return c.post(`${BASE}/bookings/${bookingId}/start-use`);
}

export async function schedulePickup(bookingId) {
  const c = await getClient();
  return c.post(`${BASE}/bookings/${bookingId}/schedule-pickup`);
}

export async function confirmReturn(bookingId, otp) {
  const c = await getClient();
  return c.post(`${BASE}/bookings/${bookingId}/confirm-return`, { otp });
}

export async function b2bMarkArrival(bookingId) {
  const c = await getClient();
  return c.post(`${BASE}/bookings/${bookingId}/b2b-arrive`);
}

export async function b2bEndTrip(bookingId) {
  const c = await getClient();
  return c.post(`${BASE}/bookings/${bookingId}/b2b-end`);
}

// ── Fleet ─────────────────────────────────────────────────────────────────────
export async function getFleet(personal = false) {
  const c = await getClient();
  return c.get(`${BASE}/fleet${personal ? '?personal=true' : ''}`);
}

export async function addVehicle(data) {
  const c = await getClient();
  return c.post(`${BASE}/fleet`, data);
}

export async function getVehicle(vehicleId) {
  const c = await getClient();
  return c.get(`${BASE}/fleet/${vehicleId}`);
}

export async function updateVehicle(vehicleId, data) {
  const c = await getClient();
  return c.patch(`${BASE}/fleet/${vehicleId}`, data);
}

export async function deleteVehicle(vehicleId) {
  const c = await getClient();
  return c.delete(`${BASE}/fleet/${vehicleId}`);
}

export async function getMaintenanceLogs(vehicleId) {
  const c = await getClient();
  return c.get(`${BASE}/fleet/${vehicleId}/maintenance`);
}

export async function addMaintenanceLog(vehicleId, data) {
  const c = await getClient();
  return c.post(`${BASE}/fleet/${vehicleId}/maintenance`, data);
}

export async function uploadVehiclePhoto(vehicleId, fileUri, fileName, mimeType, type = 'vehicle') {
  const c = await getClient();
  const fd = new FormData();
  fd.append('file', { uri: fileUri, name: fileName, type: mimeType });
  fd.append('type', type);
  return c.post(`${BASE}/fleet/${vehicleId}/photos`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function deleteVehiclePhoto(vehicleId, url, type) {
  const c = await getClient();
  return c.delete(`${BASE}/fleet/${vehicleId}/photos`, { data: { url, type } });
}

// ── Earnings ──────────────────────────────────────────────────────────────────
export async function getEarnings(period = 'all') {
  const c = await getClient();
  return c.get(`${BASE}/earnings?period=${period}`);
}

// ── Notifications ─────────────────────────────────────────────────────────────
export async function getDriverNotifications() {
  const c = await getClient();
  return c.get(`${BASE}/notifications`);
}

export async function updateDriverFcmToken(fcmToken) {
  const c = await getClient();
  return c.post(`${BASE}/notifications`, { fcmToken });
}

export async function getDriverBookingNotifications() {
  const c = await getClient();
  return c.get(`${BASE}/booking-notifications`);
}

export async function markDriverBookingNotificationsRead(ids) {
  const c = await getClient();
  return c.post(`${BASE}/booking-notifications`, { action: ids ? 'markRead' : 'markAllRead', ids });
}
