// screens/api/travelAgentClient.js
// Travel Agent API client. Reuses HTTP/token plumbing from ./client.js
// (same base URL, same session token storage, same interceptors), and
// adds TA-specific auth + namespaced AsyncStorage keys.
//
// Endpoint convention:
//   - Login uses the SHARED mobile-login endpoint at /api/vendor/auth/mobile-login.
//     The backend now detects vendor/staff/travel_agent by email and returns userType.
//   - All other TA APIs live under /api/travel-agent/* (already implemented on web).
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getBaseURL,
  setSessionToken,
  getSessionToken,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
} from "./client";

// Re-export shared HTTP helpers so TA screens can import everything from one place
export { getBaseURL, setSessionToken, getSessionToken, apiGet, apiPost, apiPut, apiPatch, apiDelete };

// ==================== STORAGE KEYS (TA-namespaced) ====================
const STORAGE_KEYS = {
  AGENT: "travel_agent",
  AGENT_ID: "travel_agent_id",
  AGENT_EMAIL: "travel_agent_email",
  AGENT_PHONE: "travel_agent_phone",
};
export const TA_STORAGE_KEYS = STORAGE_KEYS;

// Vendor keys that we clear on TA login to prevent stale cross-type state
const VENDOR_STORAGE_KEYS = [
  "vendor",
  "vendor_id",
  "vendor_email",
  "vendor_token",
  "vendor_phone",
];

// ==================== AUTH ====================

/**
 * Log a travel agent in via the shared mobile-login endpoint.
 * Backend detects user type by email and returns `userType: 'travel_agent'`
 * along with a `travelAgent` payload and JWT token.
 */
export async function loginTravelAgentDirect(email, password, fcmToken = null) {
  const baseURL = await getBaseURL();

  console.log("[TA Login] Attempting login for:", email);

  const res = await axios.post(`${baseURL}/api/vendor/auth/mobile-login`, {
    identifier: email,  // Support both email and vendor ID (vn-0001)
    password,
    fcmToken,
  });

  console.log("[TA Login] Response:", {
    success: res.data?.success,
    userType: res.data?.travelAgent?.userType || res.data?.vendor?.userType,
    hasToken: !!res.data?.token,
  });

  if (!res.data?.success) {
    throw new Error(res.data?.error || "Login failed");
  }

  const userType = res.data?.travelAgent?.userType || res.data?.vendor?.userType;
  if (userType !== "travel_agent" || !res.data?.travelAgent) {
    // Caller asked for TA login but credentials belong to a vendor/staff.
    // Surface a clear error rather than silently logging them in as the wrong type.
    throw new Error(
      "These credentials belong to a vendor account, not a travel agent."
    );
  }

  const { travelAgent, token } = res.data;

  // Clear any prior vendor session data so we don't mix roles
  await AsyncStorage.multiRemove(VENDOR_STORAGE_KEYS);

  await AsyncStorage.setItem(STORAGE_KEYS.AGENT, JSON.stringify(travelAgent));
  await AsyncStorage.setItem(STORAGE_KEYS.AGENT_ID, String(travelAgent.id));
  await AsyncStorage.setItem(STORAGE_KEYS.AGENT_EMAIL, travelAgent.email || "");
  if (travelAgent.phone) {
    await AsyncStorage.setItem(STORAGE_KEYS.AGENT_PHONE, travelAgent.phone);
  }

  if (token) {
    await setSessionToken(token);
  } else {
    console.warn("[TA Login] ⚠️ No token in response");
  }

  return { success: true, travelAgent, token };
}

/**
 * Generic mobile login that routes either to vendor or travel agent
 * based on what the backend returns. Used by the unified login screen.
 * Returns: { success, userType, vendor?, travelAgent?, token }
 */
export async function loginUnified(email, password, fcmToken = null) {
  const baseURL = await getBaseURL();

  const res = await axios.post(`${baseURL}/api/vendor/auth/mobile-login`, {
    identifier: email,  // Support both email and vendor ID (vn-0001)
    password,
    fcmToken,
  });

  if (!res.data?.success) {
    throw new Error(res.data?.error || "Login failed");
  }

  const { token } = res.data;
  const travelAgent = res.data.travelAgent;
  const vendor = res.data.vendor;
  const userType =
    travelAgent?.userType || vendor?.userType || (travelAgent ? "travel_agent" : "vendor");

  if (token) await setSessionToken(token);

  if (userType === "travel_agent" && travelAgent) {
    // Clear stale vendor data, save TA
    await AsyncStorage.multiRemove(VENDOR_STORAGE_KEYS);
    await AsyncStorage.setItem(STORAGE_KEYS.AGENT, JSON.stringify(travelAgent));
    await AsyncStorage.setItem(STORAGE_KEYS.AGENT_ID, String(travelAgent.id));
    await AsyncStorage.setItem(STORAGE_KEYS.AGENT_EMAIL, travelAgent.email || "");
    if (travelAgent.phone) {
      await AsyncStorage.setItem(STORAGE_KEYS.AGENT_PHONE, travelAgent.phone);
    }
    return { success: true, userType, travelAgent, token };
  }

  // Vendor / staff path — clear stale TA data, save vendor
  if (vendor) {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AGENT,
      STORAGE_KEYS.AGENT_ID,
      STORAGE_KEYS.AGENT_EMAIL,
      STORAGE_KEYS.AGENT_PHONE,
    ]);
    await AsyncStorage.setItem("vendor", JSON.stringify(vendor));
    await AsyncStorage.setItem("vendor_id", String(vendor.vid || vendor.id));
    await AsyncStorage.setItem("vendor_email", vendor.email || "");
  }

  return { success: true, userType: userType || "vendor", vendor, token };
}

/**
 * Register a new travel agent.
 * Hits POST /api/travel-agent/register (already implemented on web).
 */
export async function registerTravelAgent(data) {
  const baseURL = await getBaseURL();

  const payload = {
    email: data.email,
    password: data.password,
    phone: data.phone,
    agencyName: data.agencyName,
    agencyType: data.agencyType || null,
    ownerName: data.ownerName,
    gstNumber: data.gstNumber || null,
    panNumber: data.panNumber || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    pincode: data.pincode || null,
  };

  const res = await axios.post(`${baseURL}/api/travel-agent/register`, payload);
  return res.data;
}

/**
 * Get the cached travel agent object from storage.
 * Returns null if no TA is logged in.
 */
export async function getCurrentTravelAgent() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.AGENT);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getCurrentTravelAgentId() {
  return AsyncStorage.getItem(STORAGE_KEYS.AGENT_ID);
}

/**
 * Patch the cached travel agent object (e.g. after profile update).
 */
export async function updateCachedTravelAgent(partial) {
  const current = (await getCurrentTravelAgent()) || {};
  const next = { ...current, ...partial };
  await AsyncStorage.setItem(STORAGE_KEYS.AGENT, JSON.stringify(next));
  return next;
}

/**
 * Clear travel agent session (logout-time).
 * Also clears the shared session token.
 */
export async function clearTravelAgentSession() {
  await setSessionToken(null);
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.AGENT,
    STORAGE_KEYS.AGENT_ID,
    STORAGE_KEYS.AGENT_EMAIL,
    STORAGE_KEYS.AGENT_PHONE,
  ]);
}

/**
 * Logout a travel agent: clears local state and best-effort signs out on the
 * backend. Safe to call even if nothing is stored.
 */
export async function logoutTravelAgent() {
  // Best-effort: remove this device's FCM token from the backend so it
  // doesn't keep receiving push notifications meant for the agent.
  try {
    const fcmToken = await AsyncStorage.getItem("travel_agent_fcm_token");
    if (fcmToken) {
      await deleteTravelAgentFcmToken(fcmToken).catch(() => {});
      await AsyncStorage.removeItem("travel_agent_fcm_token");
    }
  } catch {}

  try {
    const baseURL = await getBaseURL();
    // Reuse the vendor signout endpoint (same NextAuth setup).
    await axios.post(`${baseURL}/api/vendor/auth/signout`, {}, { withCredentials: true });
  } catch (e) {
    console.log("[TA Logout] Signout API error (non-critical):", e?.message || e);
  }
  await clearTravelAgentSession();
}

// ==================== FCM (push notifications) ====================
// Device-id helper: reused from the vendor client (same physical device).
async function getTravelAgentDeviceId() {
  let deviceId = await AsyncStorage.getItem("vendor_device_id");
  if (!deviceId) {
    deviceId =
      "dev_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);
    await AsyncStorage.setItem("vendor_device_id", deviceId);
  }
  return deviceId;
}

/**
 * Register this device's FCM token with the backend so we can receive
 * push notifications. Multi-device aware (backend keeps up to 10 tokens
 * per agent). Persists the token locally so logout can de-register it.
 */
export async function saveTravelAgentFcmToken(fcmToken) {
  const deviceId = await getTravelAgentDeviceId();
  await AsyncStorage.setItem("travel_agent_fcm_token", fcmToken);
  const res = await apiPost("/travel-agent/fcm-token", { fcmToken, deviceId });
  return res.data;
}

/** De-register an FCM token (call on logout). */
export async function deleteTravelAgentFcmToken(fcmToken) {
  const deviceId = await getTravelAgentDeviceId();
  const res = await apiDelete("/travel-agent/fcm-token", {
    data: { fcmToken, deviceId },
  });
  return res.data;
}

// ==================== PROFILE & DASHBOARD ====================

export async function getTravelAgentProfile() {
  const res = await apiGet("/travel-agent/profile");
  return res.data;
}

export async function updateTravelAgentProfile(data) {
  const res = await apiPut("/travel-agent/profile", data);
  return res.data;
}

export async function getTravelAgentDashboard() {
  const res = await apiGet("/travel-agent/dashboard");
  return res.data;
}

// ==================== NOTIFICATIONS ====================

export async function getTravelAgentNotifications({ cursor, limit = 20, filter } = {}) {
  // Note: avoid `URLSearchParams.set()` — RN's polyfill doesn't implement it.
  // The constructor's object form does work, so build a clean object first.
  const params = {};
  if (cursor) params.cursor = cursor;
  if (limit) params.limit = String(limit);
  if (filter) params.filter = filter;
  const qs = Object.keys(params).length
    ? `?${new URLSearchParams(params).toString()}`
    : "";
  const res = await apiGet(`/travel-agent/notifications${qs}`);
  return res.data;
}

export async function getTravelAgentUnreadCount() {
  const res = await apiGet("/travel-agent/notifications/unread-count");
  return res.data;
}

export async function markTravelAgentNotification(action, ids) {
  // action: 'markRead' | 'markAllRead'
  // For 'markRead' pass ids = [id1, id2, ...]. For 'markAllRead' ids is ignored.
  const body = action === "markAllRead" ? { action } : { action, ids: Array.isArray(ids) ? ids : [ids] };
  const res = await apiPatch("/travel-agent/notifications", body);
  return res.data;
}

export async function deleteTravelAgentNotification(idOrIds) {
  // DELETE body shape per backend contract: { ids: [...] } or { all: true }
  const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
  const res = await apiDelete("/travel-agent/notifications", { data: { ids } });
  return res.data;
}

export async function deleteAllTravelAgentNotifications() {
  const res = await apiDelete("/travel-agent/notifications", { data: { all: true } });
  return res.data;
}

// ==================== LEADS ====================
// Status enum: NEW|CONTACTED|INTERESTED|QUOTED|NEGOTIATING|BOOKED|LOST|COLD
// Priority enum: HOT|WARM|COLD
// Source enum: MANUAL|CAPTURE_LINK|WEBSITE|REFERRAL|WALK_IN|SOCIAL_MEDIA|GOOGLE_ADS|WHATSAPP|OTHER

export const LEAD_STATUS = ["NEW", "CONTACTED", "INTERESTED", "QUOTED", "NEGOTIATING", "BOOKED", "LOST", "COLD"];
export const LEAD_PRIORITY = ["HOT", "WARM", "COLD"];
export const LEAD_SOURCE = [
  "MANUAL", "CAPTURE_LINK", "WEBSITE", "REFERRAL", "WALK_IN",
  "SOCIAL_MEDIA", "GOOGLE_ADS", "WHATSAPP", "OTHER",
];
// Pipeline only shows active stages — LOST/COLD are excluded
export const PIPELINE_STAGES = ["NEW", "CONTACTED", "INTERESTED", "QUOTED", "NEGOTIATING", "BOOKED"];

/**
 * List leads with optional filters + pagination.
 * Returns { leads, pagination: { page, limit, total, pages }, stats: { total, NEW, ... } }
 */
export async function listTravelAgentLeads({
  page = 1,
  limit = 20,
  status,
  priority,
  source,
  search,
} = {}) {
  // Build object first then pass to URLSearchParams constructor — RN's polyfill
  // supports the constructor's object form but not `.set()` (line-176 crash).
  const params = { page: String(page), limit: String(limit) };
  if (status && status !== "ALL") params.status = status;
  if (priority && priority !== "ALL") params.priority = priority;
  if (source && source !== "ALL") params.source = source;
  if (search && search.trim()) params.search = search.trim();
  const res = await apiGet(`/travel-agent/leads?${new URLSearchParams(params).toString()}`);
  return res.data;
}

/**
 * Fetch all active pipeline leads in one shot (max 100 per request).
 * Returns the full leads array; caller groups by status.
 */
export async function listTravelAgentPipelineLeads({ limit = 100 } = {}) {
  const res = await apiGet(`/travel-agent/leads?limit=${limit}`);
  return res.data; // { leads: [...], stats, pagination }
}

export async function getTravelAgentLead(id) {
  const res = await apiGet(`/travel-agent/leads/${encodeURIComponent(id)}`);
  return res.data; // full lead with embedded notes[] and optional captureLink
}

export async function createTravelAgentLead(payload) {
  const res = await apiPost("/travel-agent/leads", payload);
  return res.data; // { lead }
}

/**
 * Update lead. Endpoint is PATCH (not PUT). Body is partial — any subset of:
 * customerName, customerPhone, customerEmail, tripType, pickupLocation, dropLocation,
 * destination, travelDate, returnDate, passengers, requirement, estimatedValue,
 * quotedAmount, quoteAdvanceAmount, quoteAdvancePercent, quoteValidUntil, quoteTerms,
 * status, priority, assignedToName, lostReason, nextFollowUp, lastContactAt, addNote.
 * If `status` changes, backend auto-appends a "Status changed" note.
 */
export async function updateTravelAgentLead(id, partial) {
  const res = await apiPatch(`/travel-agent/leads/${encodeURIComponent(id)}`, partial);
  return res.data; // { lead }
}

export async function deleteTravelAgentLead(id) {
  const res = await apiDelete(`/travel-agent/leads/${encodeURIComponent(id)}`);
  return res.data; // { success: true }
}

/**
 * Convenience: change just the status (used by Pipeline tap-to-move).
 */
export async function setTravelAgentLeadStatus(id, status, addNote) {
  const body = { status };
  if (addNote) body.addNote = addNote;
  const res = await apiPatch(`/travel-agent/leads/${encodeURIComponent(id)}`, body);
  return res.data;
}

// --- Quote on a lead (Phase 9 / A1) ---

/**
 * Send / update a quote on a lead. PATCHes the quote fields; the caller decides
 * whether to also flip status to QUOTED (pass it in `payload.status`).
 * payload: {
 *   quotedAmount,                 // number (required)
 *   quoteAdvanceAmount?,          // number | null  (fixed advance ₹)
 *   quoteAdvancePercent?,         // number | null  (advance %, 0–100)
 *   quoteValidUntil?,             // ISO date string
 *   quoteTerms?,                  // string
 *   status?,                      // e.g. 'QUOTED'
 * }
 * Backend sets quoteSentAt automatically and appends an activity note.
 */
export async function sendTravelAgentLeadQuote(leadId, payload) {
  const res = await apiPatch(`/travel-agent/leads/${encodeURIComponent(leadId)}`, payload);
  return res.data; // { lead }
}

// --- Payment proof action on a lead (Phase 9 / A2) ---

/**
 * Verify or reject a customer's advance-payment proof on a lead.
 * action: 'VERIFY' (→ paymentStatus VERIFIED, lead auto-BOOKED) | 'REJECT'.
 * For REJECT, pass `reason` (stored as paymentRejectReason).
 */
export async function travelAgentLeadPaymentAction(leadId, action, reason) {
  const body = { paymentAction: action };
  if (action === "REJECT") body.paymentRejectReason = reason || "Payment could not be verified.";
  const res = await apiPatch(`/travel-agent/leads/${encodeURIComponent(leadId)}`, body);
  return res.data; // { lead }
}

// --- Vehicle assignments on a lead (Phase 9 / A3) ---

export async function listTravelAgentLeadVehicles(leadId) {
  const res = await apiGet(`/travel-agent/leads/${encodeURIComponent(leadId)}/vehicles`);
  return res.data; // { assignments: [...] }
}

/**
 * Assign a fleet vehicle to a lead.
 * body: { fleetId (required), startDate?, endDate?, amount?, notes?, status? }
 * status: CONFIRMED | TENTATIVE | COMPLETED | CANCELLED (default CONFIRMED).
 * Dates fall back to the lead's travelDate/returnDate server-side.
 * Throws on 409 (date conflict) — error response carries `{ conflict }`.
 */
export async function assignTravelAgentLeadVehicle(leadId, body) {
  const res = await apiPost(`/travel-agent/leads/${encodeURIComponent(leadId)}/vehicles`, body);
  return res.data; // { assignment }
}

export async function unassignTravelAgentLeadVehicle(leadId, bookingId) {
  const res = await apiDelete(
    `/travel-agent/leads/${encodeURIComponent(leadId)}/vehicles/${encodeURIComponent(bookingId)}`
  );
  return res.data; // { success: true }
}

// --- Start a customer chat from a lead (Phase 9 / A4) ---

/**
 * Create (or reuse) a chat conversation with the lead's customer.
 * lead: the lead object (needs customerName, customerPhone, id, optional email).
 * Returns { success, conversation, isNew } — conversation.id feeds TAChatThread.
 */
export async function startTravelAgentChatFromLead(lead) {
  const travelAgentId = await getCurrentTravelAgentId();
  // Subject mirrors web (lead.destination); enriched with the customer name when
  // both are present so the chat list shows e.g. "Manali — Rohan Sharma".
  const subject = lead.destination
    ? (lead.customerName ? `${lead.destination} — ${lead.customerName}` : lead.destination)
    : undefined;
  const body = {
    travelAgentId,
    customerName: lead.customerName,
    customerPhone: lead.customerPhone,
    customerEmail: lead.customerEmail || undefined,
    leadId: lead.id,
    subject,
  };
  const res = await apiPost("/travel-agent-chat/conversations", body);
  return res.data; // { success, conversation, isNew }
}

// --- Notes on a lead ---

export async function listTravelAgentLeadNotes(leadId) {
  const res = await apiGet(`/travel-agent/leads/${encodeURIComponent(leadId)}/notes`);
  return res.data; // { notes: [...] }
}

export async function addTravelAgentLeadNote(leadId, note, authorName) {
  const body = { note };
  if (authorName) body.authorName = authorName;
  const res = await apiPost(`/travel-agent/leads/${encodeURIComponent(leadId)}/notes`, body);
  return res.data; // { note }
}

// --- Convert lead → booking ---

export async function convertTravelAgentLeadToBooking(leadId, opts = {}) {
  // opts: { bookingType?, totalAmount?, paidAmount?, referenceId?, referenceTitle?, extraNotes? }
  // All optional — backend derives bookingType from lead.tripType if omitted.
  const res = await apiPost(`/travel-agent/leads/${encodeURIComponent(leadId)}/convert`, opts);
  return res.data; // { booking }
}

// ==================== FOLLOW-UPS ====================
// Backend groups leads by follow-up urgency, excluding BOOKED/LOST.
// Returns { overdue: [leads], today: [leads], upcoming: [leads], counts }

export async function getTravelAgentFollowUps() {
  const res = await apiGet("/travel-agent/follow-ups");
  return res.data;
}

// =============================================================
// Phase 3 — Bookings + Tours + Properties + Fleet + Quote Reqs
// =============================================================
//
// Note on query strings: RN's URLSearchParams polyfill is missing `.set()`.
// The constructor's object form works — that's what we use throughout.

function buildQs(params) {
  const clean = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === "" || v === "ALL") continue;
    clean[k] = String(v);
  }
  return Object.keys(clean).length ? `?${new URLSearchParams(clean).toString()}` : "";
}

// ==================== BOOKINGS ====================
export const BOOKING_STATUS = ["DRAFT", "PENDING_CUSTOMER", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
export const BOOKING_TYPE = ["TOUR", "PROPERTY", "TRANSPORT", "CUSTOM"];
export const BOOKING_PAYMENT_STATUS = ["PENDING", "PARTIAL", "PAID", "REFUNDED"];

export async function listTravelAgentBookings({
  page = 1, limit = 20, status, bookingType, search,
} = {}) {
  const qs = buildQs({ page, limit, status, bookingType, search });
  const res = await apiGet(`/travel-agent/bookings${qs}`);
  return res.data; // { bookings, selfBookings, pagination, stats, totals }
}

export async function getTravelAgentBooking(id) {
  const res = await apiGet(`/travel-agent/bookings/${encodeURIComponent(id)}`);
  return res.data;
}

/**
 * Fetch a COMPANY (B2B) self-booking's full detail.
 *
 * These are bookings the agent placed on the customer side in COMPANY mode
 * (they live in `b2b_bookings`, surfaced as `selfBookings` with a `B2B_*`
 * service prefix). We hit `/api/b2b/bookings/[id]`, which now authorizes the
 * travel-agent bearer token and only returns the booking when its
 * `travelAgentId` matches this agent (ownership-scoped). We use it instead of
 * the vendor-side `B2BBookingDetail` screen because that screen calls
 * `/vendor/*` endpoints which reject a travel-agent token with 401.
 *
 * Returns `{ status, booking, tripStats }`.
 */
export async function getSelfBookingB2bDetail(id) {
  const res = await apiGet(`/b2b/bookings/${encodeURIComponent(id)}`);
  return res.data;
}

export async function createTravelAgentBooking(payload) {
  // Required: customerName, customerPhone, bookingType
  const res = await apiPost("/travel-agent/bookings", payload);
  return res.data; // { booking }
}

export async function updateTravelAgentBooking(id, partial) {
  const res = await apiPatch(`/travel-agent/bookings/${encodeURIComponent(id)}`, partial);
  return res.data;
}

export async function deleteTravelAgentBooking(id) {
  const res = await apiDelete(`/travel-agent/bookings/${encodeURIComponent(id)}`);
  return res.data;
}

/** Generate or refresh a public share token (1-30 days). */
export async function shareTravelAgentBooking(id, expiresInDays = 7) {
  const res = await apiPost(`/travel-agent/bookings/${encodeURIComponent(id)}/share`, {
    expiresInDays,
  });
  return res.data; // { shareToken, shareExpiresAt }
}

export async function revokeTravelAgentBookingShare(id) {
  const res = await apiDelete(`/travel-agent/bookings/${encodeURIComponent(id)}/share`);
  return res.data;
}

// ==================== TOURS ====================
export const TOUR_STATUS = ["DRAFT", "ACTIVE", "PAUSED", "INACTIVE"];
// AI: generate tour description. mode "full" = comprehensive 80-100 word description;
// mode "short" (default) = one-liner ≤ 120 chars for tour cards.
export async function generateTourDescription({ title, destination, duration, basePrice, mode } = {}) {
  const res = await apiPost("/travel-agent/tours/ai-description", { title, destination, duration, basePrice, mode });
  return res.data; // { description }
}

export const TOUR_PRICE_TYPE = ["PER_PERSON", "PER_GROUP", "ON_REQUEST"];
export const TOUR_CANCELLATION_POLICY = ["FLEXIBLE", "MODERATE", "STRICT"];
export const TOUR_CREATE_MODE = ["QUICK", "DETAILED"];

export async function listTravelAgentTours({ search, status, isActive, isPublic } = {}) {
  const qs = buildQs({ search, status, isActive, isPublic });
  const res = await apiGet(`/travel-agent/tours${qs}`);
  return res.data; // { tours, stats }
}

export async function getTravelAgentTour(id) {
  const res = await apiGet(`/travel-agent/tours/${encodeURIComponent(id)}`);
  return res.data; // full tour + attachedVehicles + mainLocation
}

export async function createTravelAgentTour(payload) {
  // Required: title. For publish-ready: mainLocationId + duration/durationDays.
  // JSON fields (highlights, inclusions, exclusions, itinerary, priceTiers, customPlaces,
  // galleryImages, vehicleIds, availableDays, guideLanguages, vehicleOptions) can be
  // passed as actual arrays/objects — backend stringifies.
  const res = await apiPost("/travel-agent/tours", payload);
  return res.data; // { tour, id }
}

export async function updateTravelAgentTour(id, partial) {
  // PATCH = partial update. Backend gates isPublic on agent.status === APPROVED.
  const res = await apiPatch(`/travel-agent/tours/${encodeURIComponent(id)}`, partial);
  return res.data;
}

/** PUT auto-publishes when status=ACTIVE (sets isPublic=true unless explicitly false). */
export async function replaceTravelAgentTour(id, full) {
  const res = await apiPut(`/travel-agent/tours/${encodeURIComponent(id)}`, full);
  return res.data;
}

export async function deleteTravelAgentTour(id) {
  const res = await apiDelete(`/travel-agent/tours/${encodeURIComponent(id)}`);
  return res.data;
}

// ==================== PROPERTIES ====================
export const PROPERTY_TYPE = [
  "RESORT", "HOTEL", "HOMESTAY", "APARTMENT", "VILLA",
  "GUEST_HOUSE", "HOSTEL", "ROOMS", "OTHER",
];

export async function listTravelAgentProperties({ search, propertyType, city, isActive, isPublic } = {}) {
  const qs = buildQs({ search, propertyType, city, isActive, isPublic });
  const res = await apiGet(`/travel-agent/properties${qs}`);
  return res.data;
}

export async function getTravelAgentProperty(id) {
  const res = await apiGet(`/travel-agent/properties/${encodeURIComponent(id)}`);
  return res.data;
}

export async function createTravelAgentProperty(payload) {
  // Required: name
  const res = await apiPost("/travel-agent/properties", payload);
  return res.data;
}

export async function updateTravelAgentProperty(id, partial) {
  const res = await apiPatch(`/travel-agent/properties/${encodeURIComponent(id)}`, partial);
  return res.data;
}

export async function deleteTravelAgentProperty(id) {
  const res = await apiDelete(`/travel-agent/properties/${encodeURIComponent(id)}`);
  return res.data;
}

// ==================== FLEET ====================
export const FLEET_VEHICLE_TYPE = [
  "SEDAN", "SUV", "MUV", "HATCHBACK", "TEMPO_TRAVELLER",
  "MINI_BUS", "BUS", "LUXURY_CAR", "BIKE", "SCOOTER", "CAMPER_VAN", "OTHER",
];
export const FLEET_FUEL_TYPE = ["PETROL", "DIESEL", "CNG", "LPG", "EV", "HYBRID", "OTHER"];
export const FLEET_TRANSMISSION = ["MANUAL", "AUTOMATIC"];
export const FLEET_BOOKING_TYPE = ["CUSTOMER", "MANUAL_BLOCK", "MAINTENANCE", "RESERVED"];
export const FLEET_BOOKING_STATUS = ["CONFIRMED", "TENTATIVE", "COMPLETED", "CANCELLED"];

export async function listTravelAgentFleet({ search, vehicleType, isActive } = {}) {
  const qs = buildQs({ search, vehicleType, isActive });
  const res = await apiGet(`/travel-agent/fleet${qs}`);
  return res.data;
}

export async function getTravelAgentFleetVehicle(id) {
  const res = await apiGet(`/travel-agent/fleet/${encodeURIComponent(id)}`);
  return res.data;
}

export async function createTravelAgentFleetVehicle(payload) {
  // Required: vehicleName. registrationNumber must be unique per agent.
  const res = await apiPost("/travel-agent/fleet", payload);
  return res.data;
}

export async function updateTravelAgentFleetVehicle(id, partial) {
  const res = await apiPatch(`/travel-agent/fleet/${encodeURIComponent(id)}`, partial);
  return res.data;
}

export async function deleteTravelAgentFleetVehicle(id) {
  const res = await apiDelete(`/travel-agent/fleet/${encodeURIComponent(id)}`);
  return res.data;
}

// --- Fleet bookings (calendar) ---

export async function listFleetBookings({ from, to, fleetId } = {}) {
  const qs = buildQs({ from, to, fleetId });
  const res = await apiGet(`/travel-agent/fleet/bookings${qs}`);
  return res.data; // { bookings, range }
}

export async function createFleetBooking(payload) {
  // Required: fleetId, startDate, endDate. May return 409 on overlap.
  const res = await apiPost("/travel-agent/fleet/bookings", payload);
  return res.data;
}

export async function updateFleetBooking(id, partial) {
  const res = await apiPatch(`/travel-agent/fleet/bookings/${encodeURIComponent(id)}`, partial);
  return res.data;
}

export async function deleteFleetBooking(id) {
  const res = await apiDelete(`/travel-agent/fleet/bookings/${encodeURIComponent(id)}`);
  return res.data;
}

// ==================== TOUR QUOTE REQUESTS ====================
// There is NO dedicated /tour-quote-requests endpoint — the web page is just
// a filtered view of /leads with `source=WEBSITE`. We mirror that here so the
// mobile screen renders the same data.

export async function listTravelAgentTourQuoteRequests({ page = 1, limit = 20, status, priority, search } = {}) {
  const qs = buildQs({ page, limit, status, priority, search, source: "WEBSITE" });
  const res = await apiGet(`/travel-agent/leads${qs}`);
  return res.data; // { leads, pagination, stats }
}

// ==================== UPLOAD ====================
//
// IMPORTANT: We use native `fetch` (NOT axios) for multipart uploads on
// React Native — axios has a long-standing issue with FormData on Android
// where it fails with ERR_NETWORK on localhost-style endpoints. The vendor
// app's `uploadVendorDocument` works around this the same way (see
// client.js around line 469). Without this, every TA upload (tour/property/
// fleet image AND KYC docs) silently fails with Network Error.
//
// Backend: POST /api/travel-agent/upload — returns { url, uploaded }.
// Files must be in React Native's FormData file shape:
//   { uri: 'file:///path/to.jpg', name: 'photo.jpg', type: 'image/jpeg' }

async function fetchMultipart(path, formData) {
  const baseURL = await getBaseURL();
  const token = await getSessionToken();
  const url = `${baseURL}${path}`;

  const res = await fetch(url, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
      ...(token
        ? { Authorization: `Bearer ${token}`, "X-Session-Token": token }
        : {}),
      // DO NOT set Content-Type — fetch sets it with the correct multipart boundary.
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    // Shape error like axios so callers' existing handlers still work.
    const err = new Error(data?.error || `Upload failed (HTTP ${res.status})`);
    err.response = { status: res.status, data };
    throw err;
  }
  return data;
}

export async function uploadTravelAgentImage(file, folder = "images") {
  const formData = new FormData();
  formData.append("file", file);
  if (folder) formData.append("folder", folder);
  return fetchMultipart("/api/travel-agent/upload", formData);
}

export async function uploadTravelAgentImages(files, folder = "images") {
  const formData = new FormData();
  for (const f of files) formData.append("files", f);
  if (folder) formData.append("folder", folder);
  return fetchMultipart("/api/travel-agent/upload", formData);
}

// ==================== LOCATIONS + CATEGORIES ====================

export async function searchTravelAgentLocations(query) {
  if (!query || query.trim().length < 2) return [];
  const qs = buildQs({ search: query.trim() });
  const res = await apiGet(`/travel-agent/locations${qs}`);
  return Array.isArray(res.data) ? res.data : res.data?.locations || [];
}

export async function listTravelAgentCategories() {
  const res = await apiGet("/travel-agent/categories");
  return Array.isArray(res.data) ? res.data : res.data?.categories || [];
}

// =============================================================
// Phase 4 — Earnings + Payments + Bank Details + Documents (KYC)
// =============================================================

// ==================== EARNINGS ====================
export const EARNINGS_PERIODS = ["month", "last30", "year", "all"];

export async function getTravelAgentEarnings(period = "month") {
  const qs = buildQs({ period });
  const res = await apiGet(`/travel-agent/earnings${qs}`);
  return res.data; // { period, summary, trend, breakdownByType, recent }
}

// ==================== PAYMENTS ====================
// Filters payment activity on TA leads. No pagination — server returns up to 200.
export const PAYMENT_STATUS = ["PENDING", "SUBMITTED", "VERIFIED", "REJECTED", "ADVANCE_PAID"];

export async function getTravelAgentPayments({ status, q, from, to } = {}) {
  const qs = buildQs({ status, q, from, to });
  const res = await apiGet(`/travel-agent/payments${qs}`);
  return res.data; // { stats, items }
}

// ==================== BANK DETAILS ====================
// Backend uses POST-with-isPrimary to switch primary (no PATCH endpoint).
// DELETE is soft (isActive=false). accountType is a free string but UI offers
// SAVINGS / CURRENT presets.
export const BANK_ACCOUNT_TYPES = ["SAVINGS", "CURRENT"];

export async function listTravelAgentBankAccounts() {
  const res = await apiGet("/travel-agent/bank-details");
  return res.data; // { accounts: [...] }
}

export async function createTravelAgentBankAccount(payload) {
  // Required: bankName, accountHolderName, accountNumber, ifscCode
  // Optional: accountType (default SAVINGS), branchName, upiId, isPrimary
  const res = await apiPost("/travel-agent/bank-details", payload);
  return res.data;
}

/**
 * Edit an existing bank account. PUT (not PATCH — PATCH on this endpoint only
 * flips the primary flag). The backend requires the full set of core fields on
 * every call, checks the account belongs to this agent, and demotes the other
 * primary itself when isPrimary is true.
 */
export async function updateTravelAgentBankAccount(id, payload) {
  const res = await apiPut("/travel-agent/bank-details", { id, ...payload });
  return res.data; // { account }
}

/**
 * Make a bank account the primary one. Backend semantics: a new POST with
 * isPrimary=true demotes the previous primary. We do the same here.
 */
export async function setPrimaryTravelAgentBankAccount(existingAccount) {
  // PATCH by id — demotes the previous primary in-place (no duplicate row).
  // Accepts either the account object or a raw id string.
  const id = typeof existingAccount === "string" ? existingAccount : existingAccount?.id;
  const res = await apiPatch("/travel-agent/bank-details", { id });
  return res.data;
}

export async function deleteTravelAgentBankAccount(id) {
  const res = await apiDelete(`/travel-agent/bank-details?id=${encodeURIComponent(id)}`);
  return res.data;
}

// ==================== DOCUMENTS (KYC) ====================
//
// Document upload uses its OWN multipart endpoint at /api/travel-agent/documents
// (not the generic /upload endpoint). FormData fields: `file`, `documentType`,
// optional `documentNumber`.

export const DOCUMENT_TYPES = [
  "ADDRESS_PROOF",
  "GST_CERTIFICATE",
  "PAN_CARD",
  "AGENCY_REGISTRATION",
  "IATA_CERTIFICATE",
  "TRAVEL_AGENT_LICENSE",
  "CANCELLED_CHEQUE",
  "OWNER_AADHAAR",
  "OWNER_PAN",
  "BANK_DETAILS",
  "OTHER",
];
// Only Address Proof is mandatory now. GST & PAN moved to optional.
export const REQUIRED_DOCUMENT_TYPES = ["ADDRESS_PROOF"];
export const DOCUMENT_STATUS = ["PENDING", "VERIFIED", "REJECTED"];

export async function listTravelAgentDocuments() {
  const res = await apiGet("/travel-agent/documents");
  return res.data; // { documents: [...] }
}

/**
 * Upload (or re-upload) a KYC document. Backend prevents duplicates per type
 * unless previous is REJECTED. Uses native fetch (not axios) for the same
 * RN-FormData-on-Android reason as the image upload above.
 *
 * @param file       RN file shape: { uri, name, type }
 * @param documentType  one of DOCUMENT_TYPES
 * @param documentNumber optional ID (GSTIN, PAN, etc.)
 */
export async function uploadTravelAgentDocument(file, documentType, documentNumber) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", documentType);
  if (documentNumber) formData.append("documentNumber", documentNumber);
  return fetchMultipart("/api/travel-agent/documents", formData);
}

export async function deleteTravelAgentDocument(id) {
  // Cannot delete VERIFIED docs (backend enforces).
  const res = await apiDelete(`/travel-agent/documents?id=${encodeURIComponent(id)}`);
  return res.data;
}

// =============================================================
// Phase 5 — Communications: Customer Chats + Capture Links
// =============================================================

// ==================== CUSTOMER CHATS ====================
// Chat endpoints live under /api/travel-agent-chat/* (note: NOT /travel-agent/).
// GET /conversations         → { success, conversations[], totalUnread }
// GET /conversations/[id]    → { success, conversation, messages[] } (auto-marks read)
// POST /conversations/[id]   → { success, message } (send a new message)
//
// Polling cadence (matches web): 15s for the list, 5s for an open thread.

export const CHAT_STATUS = ["ACTIVE", "ARCHIVED", "BLOCKED"];

export async function listTravelAgentConversations({ status = "ACTIVE" } = {}) {
  const qs = buildQs({ status });
  const res = await apiGet(`/travel-agent-chat/conversations${qs}`);
  return res.data; // { success, conversations, totalUnread }
}

export async function getTravelAgentConversation(id) {
  const res = await apiGet(`/travel-agent-chat/conversations/${encodeURIComponent(id)}`);
  return res.data; // { success, conversation, messages }
}

/**
 * Send a chat message as the agent. senderName is optional — backend will
 * fall back to the agent's name from the auth token if omitted.
 */
export async function sendTravelAgentChatMessage(conversationId, content, { senderName, messageType = "TEXT" } = {}) {
  const body = {
    senderType: "agent",
    content,
    messageType,
    ...(senderName ? { senderName } : {}),
  };
  const res = await apiPost(`/travel-agent-chat/conversations/${encodeURIComponent(conversationId)}`, body);
  return res.data; // { success, message }
}

// ==================== CAPTURE LINKS ====================
// Public submission URL pattern: `${baseURL}/travel-agent/lead/{slug}` —
// share this with customers via WhatsApp / SMS / social.

export const CAPTURE_TRIP_TYPES = [
  "ONE_WAY", "ROUND_TRIP", "TOUR_PACKAGE", "ACCOMMODATION", "MULTI_CITY",
];

export async function listTravelAgentCaptureLinks() {
  const res = await apiGet("/travel-agent/capture-links");
  return res.data; // { links }
}

export async function createTravelAgentCaptureLink(payload) {
  // Required: title (slug is auto-generated server-side)
  // Optional: description, defaultTripType
  const res = await apiPost("/travel-agent/capture-links", payload);
  return res.data; // { link }
}

export async function updateTravelAgentCaptureLink(id, partial) {
  // partial: any of title, description, defaultTripType, isActive
  const res = await apiPatch(`/travel-agent/capture-links/${encodeURIComponent(id)}`, partial);
  return res.data; // { link }
}

export async function deleteTravelAgentCaptureLink(id) {
  const res = await apiDelete(`/travel-agent/capture-links/${encodeURIComponent(id)}`);
  return res.data;
}

/**
 * Build the public lead-capture URL a customer would visit.
 * (Caller composes the message body for sharing via Share API.)
 */
export async function getCaptureLinkPublicUrl(slug) {
  const baseURL = await getBaseURL();
  return `${baseURL}/travel-agent/lead/${encodeURIComponent(slug)}`;
}

// =============================================================
// Phase 6 — Social Network (cross-type: vendor + agent)
// =============================================================
//
// Canonical namespace is /api/social/* (NOT /vendor/social/* which is
// vendor-only and rejects TA JWTs). Backend uses getSocialAuth() which
// auto-detects actor type from the mobile JWT and stores rows polymorphically
// (vendorId XOR agentId on posts/likes/comments/saves).
//
// All endpoints below take no actorType param — backend reads it from auth.

export const SOCIAL_POST_TYPES = ["feed", "sos", "saved", "my"];

// ---- Posts / feed ----

export async function listSocialPosts({ type, cursor, categoryId } = {}) {
  // type: undefined (main feed) | 'sos' | 'saved' | 'my'
  const qs = buildQs({ type, cursor, categoryId });
  const res = await apiGet(`/social/posts${qs}`);
  return res.data; // { posts, nextCursor? }
}

export async function createSocialPost({ content, categoryId, images } = {}) {
  // Backend `/api/social/posts` accepts { content, categoryId, images? } per
  // service layer. Images are URLs uploaded via /api/travel-agent/upload first.
  const body = { content };
  if (categoryId) body.categoryId = categoryId;
  if (Array.isArray(images) && images.length) body.images = images;
  const res = await apiPost("/social/posts", body);
  return res.data; // { post }
}

export async function deleteSocialPost(postId) {
  const res = await apiDelete(`/social/posts/${encodeURIComponent(postId)}`);
  return res.data;
}

export async function toggleSocialPostLike(postId) {
  const res = await apiPost(`/social/posts/${encodeURIComponent(postId)}/like`);
  return res.data; // { liked, likesCount }
}

export async function toggleSocialPostSave(postId) {
  const res = await apiPost(`/social/posts/${encodeURIComponent(postId)}/save`);
  return res.data; // { saved }
}

// ---- Comments ----

export async function listSocialPostComments(postId) {
  const res = await apiGet(`/social/posts/${encodeURIComponent(postId)}/comment`);
  return res.data; // { comments }
}

export async function addSocialPostComment(postId, content) {
  const res = await apiPost(`/social/posts/${encodeURIComponent(postId)}/comment`, { content });
  return res.data; // { comment }
}

export async function deleteSocialPostComment(postId, commentId) {
  const res = await apiDelete(
    `/social/posts/${encodeURIComponent(postId)}/comment/${encodeURIComponent(commentId)}`
  );
  return res.data;
}

// ---- Categories (for the create-post picker) ----

export async function listSocialCategories() {
  const res = await apiGet("/social/categories");
  return res.data; // { categories } OR array — handle both in screen
}

// ---- Profiles (cross-type) ----
// type: 'vendor' | 'agent'; id: their id
export async function getSocialProfile(type, id) {
  const res = await apiGet(
    `/social/profile/${encodeURIComponent(type)}/${encodeURIComponent(id)}`
  );
  return res.data; // { profile, posts }
}

// ---- Direct messaging (cross-type) ----

export async function listSocialConversations() {
  const res = await apiGet("/social/chat/conversations");
  return res.data; // { conversations }
}

/**
 * Network-wide directory search across vendors + agents — powers the
 * "New message" entry point (start a chat with someone not yet in your
 * conversation list). Backend requires q.length >= 2.
 */
export async function searchSocialDirectory(q) {
  const qs = buildQs({ q: (q || "").trim() });
  const res = await apiGet(`/social/search${qs}`);
  return res.data; // { results: [{ type:'vendor'|'agent', id, businessName, ownerName, logo, city }] }
}

/**
 * Start (or get the existing) direct conversation with another actor.
 * Cross-type body: { otherType: 'vendor'|'agent', otherId }
 */
export async function getOrCreateSocialConversation(otherType, otherId) {
  const res = await apiPost("/social/chat/conversations", { otherType, otherId });
  return res.data; // { conversationId }
}

export async function listSocialMessages(conversationId) {
  const res = await apiGet(
    `/social/chat/conversations/${encodeURIComponent(conversationId)}/messages`
  );
  return res.data; // { messages }
}

export async function sendSocialMessage(conversationId, content) {
  const res = await apiPost(
    `/social/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
    { content }
  );
  return res.data; // { message }
}

// ==================== SUPPORT TICKETS ====================
export async function submitSupportTicket({ subject, category, message }) {
  const res = await apiPost("/travel-agent/support/tickets", { subject, category, message });
  return res.data; // { success, ticketNo }
}

export async function getMySupportTickets() {
  const res = await apiGet("/travel-agent/support/tickets");
  return res.data; // { tickets }
}
