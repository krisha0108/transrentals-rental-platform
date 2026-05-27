// ─────────────────────────────────────────────────────────────
// Unified vendor inquiries fetcher
//
// The platform has NO single "all inquiries" endpoint — each service
// exposes its own *-quote-requests API (car uses car-bookings broadcast).
// Instead of a backend aggregator we fetch only the vendor's APPROVED
// services in parallel and normalize each into one common envelope:
//
//   { id, rawId, service, title, sub, customer, createdAt,
//     ago, urgent, expiry, accept }
//
// `accept` = true for car rental (broadcast accept-flow, not a quote).
// ─────────────────────────────────────────────────────────────
import { apiGet } from './client';

// service slug → endpoint + response key. Slugs match SVC_ID_TO_SERVICE
// values used across the app (bike, self-drive, bus, truck, car, ...).
const SOURCES = {
  bike:         { endpoint: 'bike-quote-requests',       key: 'requests' },
  'self-drive': { endpoint: 'self-drive-quote-requests', key: 'requests' },
  bus:          { endpoint: 'bus-quote-requests',        key: 'requests' },
  truck:        { endpoint: 'truck-quote-requests',      key: 'requests' },
  luxury:       { endpoint: 'luxury-quote-requests',     key: 'requests' },
  packers:      { endpoint: 'packers-quote-requests',    key: 'requests' },
  equipment:    { endpoint: 'equipment-quote-requests',  key: 'requests' },
  car:          { endpoint: 'car-bookings',              key: 'bookings', isAccept: true },
};

const fmtDate = (d) => {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
  catch { return ''; }
};

const route = (from, to) => [from, to].filter(Boolean).join(' → ');
const join  = (...parts) => parts.filter(Boolean).join(' · ');

const fmtMoney = (v) => {
  if (v == null || isNaN(Number(v))) return null;
  return `₹${Number(v).toLocaleString('en-IN')}`;
};

// Per-service mappers → { title, sub, expiresAt }
const NORMALIZERS = {
  bike: (r) => ({
    title: r.numberOfVehicles > 1 ? `Bike Rental · ${r.numberOfVehicles} vehicles` : 'Bike Rental',
    sub:   join(r.locationName, fmtDate(r.pickupDate) + (r.totalDays ? `, ${r.totalDays} days` : '')),
    expiresAt: r.quotesOpenTill,
  }),
  'self-drive': (r) => ({
    title: join('Self Drive', r.vehicleCategoryName || r.vehicleModelName),
    sub:   join(r.locationName, fmtDate(r.pickupDate)),
    expiresAt: r.quotesOpenTill,
  }),
  bus: (r) => ({
    title: join('Bus', r.vehicleCategoryName),
    sub:   join(route(r.pickupCity, r.dropCity), fmtDate(r.pickupDate)),
    expiresAt: r.quotesOpenTill,
  }),
  luxury: (r) => ({
    title: join('Luxury', r.vehicleCategoryName),
    sub:   join(route(r.pickupCity, r.dropCity), fmtDate(r.pickupDate)),
    expiresAt: r.quotesOpenTill,
  }),
  truck: (r) => ({
    title: join('Transporter', r.vehicleCategoryName),
    sub:   join(route(r.pickupCity, r.dropCity), fmtDate(r.pickupDate)),
    expiresAt: r.quotesOpenTill,
  }),
  packers: (r) => ({
    title: join('Packers', r.propertySize || r.shiftingType),
    sub:   route(r.pickupCity, r.dropCity),
    expiresAt: r.expiresAt || r.quotesOpenTill,
  }),
  equipment: (r) => ({
    title: join('Equipment', r.equipmentName || r.equipmentType),
    sub:   fmtDate(r.startDate),
    expiresAt: r.expiresAt || r.quotesOpenTill,
  }),
  car: (r) => ({
    title: join('Car Rental', r.carCategoryName),
    sub:   join(route(r.pickupCity, r.dropCity), fmtDate(r.pickupDate)),
    expiresAt: r.responseDeadline,
  }),
};

function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Urgent only when expiring within 3h — drives the red "Xh left" chip.
function expiryInfo(d) {
  if (!d) return { urgent: false, expiry: '' };
  const diff = new Date(d).getTime() - Date.now();
  if (diff <= 0) return { urgent: false, expiry: '' };
  if (diff <= 3 * 3600000) {
    const mins = Math.round(diff / 60000);
    return { urgent: true, expiry: mins >= 60 ? `${Math.floor(mins / 60)}h left` : `${mins}m left` };
  }
  return { urgent: false, expiry: '' };
}

function normalize(slug, raw) {
  const mapper = NORMALIZERS[slug];
  const n = mapper ? mapper(raw) : { title: slug, sub: '', expiresAt: null };
  const { urgent, expiry } = expiryInfo(n.expiresAt);
  const mq = raw.myQuote || null;
  return {
    id:        `${slug}:${raw.id}`,
    rawId:     raw.id,
    service:   slug,
    title:     n.title,
    sub:       n.sub,
    customer:  raw.customerName || 'Customer',
    createdAt: raw.createdAt,
    ago:       timeAgo(raw.createdAt),
    urgent,
    expiry,
    accept:    !!SOURCES[slug]?.isAccept,
    // "quoted" is derived from REAL data (vendor has a quote on this request),
    // never from the fetch type — some endpoints ignore unsupported types and
    // return open requests, which must NOT count as quoted.
    quoted:    !!(mq || raw.hasQuoted),
    // populated only when the vendor has already quoted (raw.myQuote present)
    myQuote:   mq ? fmtMoney(mq.grandTotal ?? mq.totalAmount ?? mq.amount) : null,
    quoteId:   mq?.id || null,
    bookingId: mq?.bookingId || null,   // present once the quote is accepted
  };
}

/**
 * Fetch open inquiries across the given approved service slugs.
 * @param {string[]} serviceSlugs e.g. ['bike','truck','packers']
 * @param {{ limit?: number, type?: string }} opts
 * @returns {Promise<{ items: object[], total: number }>}
 */
export async function fetchInquiries(serviceSlugs = [], { limit = 5, type = 'open' } = {}) {
  // Accept-flow services (car) have no "quoted" state — only include them
  // for the open/new feed.
  const slugs = serviceSlugs.filter((s) => SOURCES[s] && (type === 'open' || !SOURCES[s].isAccept));
  if (slugs.length === 0) return { items: [], total: 0 };

  const settled = await Promise.allSettled(
    slugs.map(async (slug) => {
      const src = SOURCES[slug];
      const res = await apiGet(`/vendor/${src.endpoint}?type=${type}&limit=${limit}`);
      const data = res.data || {};
      const items = (data[src.key] || []).map((raw) => normalize(slug, raw));
      const total = typeof data.total === 'number' ? data.total : items.length;
      return { items, total };
    })
  );

  let total = 0;
  const items = [];
  settled.forEach((r) => {
    if (r.status === 'fulfilled') { items.push(...r.value.items); total += r.value.total; }
  });
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { items, total };
}

export const INQUIRY_SERVICE_SLUGS = Object.keys(SOURCES);
