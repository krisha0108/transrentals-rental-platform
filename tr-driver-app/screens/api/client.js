import axios from 'axios';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_PROD = 'https://transrentals.in';

// The port `npm run dev` serves the site on.
const DEV_PORT = 3001;

/**
 * Every address the dev backend might answer on, best guess first.
 *
 * Reusing Metro's own host is the best guess: the device already reached
 * this machine that way. But it is not always the right one. Metro is
 * usually tunnelled with `adb reverse tcp:8081`, so its host comes back as
 * `localhost` — and unless port 3001 was tunnelled too, nothing is listening
 * there. Equally, a LAN address works only while the phone is on the same
 * Wi-Fi and the host firewall lets the connection in. Either guess alone
 * leaves the app silently unable to reach its own backend, which shows up as
 * every screen failing to load, so we keep all of them and probe.
 */
function devCandidates() {
  const scriptURL = NativeModules?.SourceCode?.scriptURL || '';
  const metroHost = scriptURL.match(/^[a-z]+:\/\/([^/:]+)/i)?.[1];
  const hosts = [
    metroHost,
    'localhost',
    // Android emulators reach the host machine through this alias.
    Platform.OS === 'android' ? '10.0.2.2' : null,
  ].filter(Boolean);
  return [...new Set(hosts)].map(h => `http://${h}:${DEV_PORT}`);
}

/** Does a backend actually answer here? Cheap, unauthenticated, quick to fail. */
async function reachable(base) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${base}/api/driver-app/app-version`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

let cachedBaseURL = null;
// Screens fire several requests at once on mount; without this they would
// each start their own probe before the first one finished.
let baseURLProbe = null;

export async function getBaseURL() {
  if (cachedBaseURL) return cachedBaseURL;
  if (__DEV__) {
    if (!baseURLProbe) {
      baseURLProbe = (async () => {
        const candidates = devCandidates();
        for (const base of candidates) {
          if (await reachable(base)) return base;
        }
        // Nothing answered. Keep the best guess anyway, so the error the
        // driver sees names a concrete address instead of nothing at all.
        console.warn(`[api] No dev backend answered on ${candidates.join(', ')}. ` +
          `Start it on port ${DEV_PORT}, and over adb run: adb reverse tcp:${DEV_PORT} tcp:${DEV_PORT}`);
        return candidates[0] || `http://localhost:${DEV_PORT}`;
      })();
    }
    cachedBaseURL = await baseURLProbe;
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
  // Opening a trip is a foreground tap the driver is waiting on, and the
  // server may have to look through several booking tables to find it, so it
  // gets more room than the 15s default before we call it a failure.
  return c.get(`${BASE}/bookings/${bookingId}?source=${source || 'chauffeur'}`, { timeout: 25000 });
}

/**
 * Turn an axios failure into something worth showing a driver.
 *
 * "Failed to load booking details" told nobody anything — not the driver
 * standing in a basement with no signal, and not us when they reported it.
 * These messages name the actual problem instead.
 */
export function describeApiError(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;
  if (err.code === 'ECONNABORTED') return 'The server took too long to respond. Check your connection and try again.';
  if (!err.response) return 'No internet connection. Check your network and try again.';

  const status = err.response.status;
  const serverMsg = err.response.data?.error || err.response.data?.message;
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have access to this.';
  if (status === 404) return serverMsg || 'This record could not be found. It may have been removed.';
  if (status >= 500) return serverMsg || 'The server had a problem. Please try again in a moment.';
  return serverMsg || fallback;
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

export async function deleteMaintenanceLog(vehicleId, logId) {
  const c = await getClient();
  return c.delete(`${BASE}/fleet/${vehicleId}/maintenance/${logId}`);
}

export async function uploadVehiclePhoto(vehicleId, fileUri, fileName, mimeType, type = 'vehicle') {
  const c = await getClient();
  // Normalize MIME types — Android sometimes returns 'image/jpg', iOS returns 'image/heic'
  let normalizedMime = mimeType || 'image/jpeg';
  if (normalizedMime === 'image/jpg') normalizedMime = 'image/jpeg';
  if (normalizedMime === 'image/heic' || normalizedMime === 'image/heif') normalizedMime = 'image/jpeg';
  // Normalize file extension to match MIME
  let normalizedName = fileName || 'photo.jpg';
  if (normalizedMime === 'image/jpeg' && !normalizedName.match(/\.(jpg|jpeg)$/i)) {
    normalizedName = normalizedName.replace(/\.[^.]+$/, '') + '.jpg';
  }
  const fd = new FormData();
  fd.append('file', { uri: fileUri, name: normalizedName, type: normalizedMime });
  fd.append('type', type);
  return c.post(`${BASE}/fleet/${vehicleId}/photos`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
}

export async function deleteVehiclePhoto(vehicleId, url, type) {
  const c = await getClient();
  return c.delete(`${BASE}/fleet/${vehicleId}/photos`, { data: { url, type } });
}

export async function getFuelLogs(vehicleId) {
  const c = await getClient();
  return c.get(`${BASE}/fleet/${vehicleId}/fuel`);
}

export async function addFuelLog(vehicleId, data) {
  const c = await getClient();
  return c.post(`${BASE}/fleet/${vehicleId}/fuel`, data);
}

export async function getIncidents(vehicleId) {
  const c = await getClient();
  return c.get(`${BASE}/fleet/${vehicleId}/incidents`);
}

export async function addIncident(vehicleId, data) {
  const c = await getClient();
  return c.post(`${BASE}/fleet/${vehicleId}/incidents`, data);
}

export async function deleteFuelLog(vehicleId, logId) {
  const c = await getClient();
  return c.delete(`${BASE}/fleet/${vehicleId}/fuel/${logId}`);
}

export async function deleteIncident(vehicleId, incidentId) {
  const c = await getClient();
  return c.delete(`${BASE}/fleet/${vehicleId}/incidents/${incidentId}`);
}

export async function updateMaintenanceLog(vehicleId, logId, data) {
  const c = await getClient();
  return c.patch(`${BASE}/fleet/${vehicleId}/maintenance/${logId}`, data);
}

export async function updateFuelLog(vehicleId, logId, data) {
  const c = await getClient();
  return c.patch(`${BASE}/fleet/${vehicleId}/fuel/${logId}`, data);
}

export async function updateIncident(vehicleId, incidentId, data) {
  const c = await getClient();
  return c.patch(`${BASE}/fleet/${vehicleId}/incidents/${incidentId}`, data);
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

export async function saveDriverBookingNotification(notification) {
  const c = await getClient();
  return c.post(`${BASE}/booking-notifications`, { action: 'save', notification });
}

export async function getDriverAppVersion() {
  const base = await getBaseURL();
  return axios.get(`${base}/api/driver-app/app-version`);
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export async function getDriverChatList() {
  const c = await getClient();
  return c.get(`${BASE}/chat`);
}

export async function getOrCreateDriverChat(bookingId, bookingType = 'chauffeur', customerId = null) {
  const c = await getClient();
  return c.post(`${BASE}/chat`, { bookingId, bookingType, customerId });
}

export async function getDriverChatMessages(conversationId, since = null) {
  const c = await getClient();
  const qs = since ? `?since=${encodeURIComponent(since)}` : '';
  return c.get(`${BASE}/chat/${conversationId}/messages${qs}`);
}

export async function sendDriverChatMessage(conversationId, content) {
  const c = await getClient();
  return c.post(`${BASE}/chat/${conversationId}/messages`, { content });
}
