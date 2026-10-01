// The signed-in customer's own bookings, for the customer help assistant.
// The customer is identified only from their access token (never from a
// client-supplied id), and the bookings come from the same query the app's
// My Bookings screen uses, so the assistant sees exactly what they see.

import { NextRequest } from 'next/server';
import { validateToken } from '@/lib/security';
import { prisma } from '@/lib/db/prisma';
import { GET as getCustomerBookings } from '@/app/api/customer/bookings/route';

export type AccountBooking = {
  id: string;
  bookingNumber: string | null;
  service: string;
  serviceType: string;
  isQuote: boolean;
  status: string;
  group: 'upcoming' | 'ongoing' | 'awaiting_quotes' | 'completed' | 'closed';
  when: Date | null;
  from: string | null;
  to: string | null;
  total: number | null;
  rated: boolean | null;
  link: string; // booking:<type>:<id> or quote:<type>:<id>
};

export type AccountContext = {
  name: string;
  bookings: AccountBooking[];
};

const CLOSED = ['CANCELLED', 'EXPIRED', 'REFUNDED', 'DROPPED', 'REJECTED'];
const ONGOING = ['IN_PROGRESS', 'ONGOING', 'IN_USE', 'DELIVERED'];

export async function customerIdFromRequest(request: NextRequest): Promise<string | null> {
  const header = request.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  try {
    const result = await validateToken(token);
    return result.valid && result.customerId ? result.customerId : null;
  } catch {
    return null;
  }
}

export async function loadAccountContext(customerId: string): Promise<AccountContext | null> {
  const customer = await prisma.customers
    .findUnique({ where: { id: customerId }, select: { name: true } })
    .catch(() => null);
  if (!customer) return null;
  return buildAccountContext(customer.name, await fetchLocalBookings(customerId));
}

async function fetchLocalBookings(customerId: string): Promise<any[]> {
  try {
    const url = `http://internal/api/customer/bookings?customer_id=${encodeURIComponent(customerId)}&status=All`;
    const res = await getCustomerBookings(new NextRequest(url));
    const data = await res.json();
    return Array.isArray(data?.bookings) ? data.bookings : [];
  } catch {
    return [];
  }
}

function buildAccountContext(name: string, raw: any[]): AccountContext {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const bookings: AccountBooking[] = raw.map((b) => {
    const status = String(b.status || '').toUpperCase();
    const when = b.journey_datetime ? new Date(b.journey_datetime) : null;
    const isQuote = !!b.is_quote_request;
    let group: AccountBooking['group'];
    if (status === 'COMPLETED') group = 'completed';
    else if (CLOSED.includes(status)) group = 'closed';
    else if (ONGOING.includes(status)) group = 'ongoing';
    else if (isQuote && !(b.quote_count > 0) && !['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED'].includes(status)) group = 'awaiting_quotes';
    else if (when && when < startOfToday) group = 'closed';
    else group = 'upcoming';
    const type = String(b.service_type || 'booking');
    // Car-with-driver bookings open by booking number, like My Bookings does.
    const linkId = type === 'chauffeur' ? b.booking_number || b.id : b.id;
    return {
      id: String(b.id),
      bookingNumber: b.booking_number || null,
      service: b.service_name || type,
      serviceType: type,
      isQuote,
      status,
      group,
      when: when && !Number.isNaN(when.getTime()) ? when : null,
      from: b.location_name || null,
      to: b.destination || null,
      total: typeof b.total_amount === 'number' ? b.total_amount : null,
      // null when the server doesn't report ratings (older API)
      rated: 'rating' in b ? typeof b.rating === 'number' && b.rating > 0 : null,
      link: `${isQuote ? 'quote' : 'booking'}:${type}:${linkId}`,
    };
  });

  return { name, bookings };
}

const fmtDate = (d: Date) =>
  d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });

const bookingLine = (b: AccountBooking) => {
  const label = `${b.service}${b.bookingNumber ? ` #${b.bookingNumber}` : ''}`;
  const parts = [
    `status ${b.status}`,
    b.when ? fmtDate(b.when) : null,
    b.from ? (b.to ? `${b.from} → ${b.to}` : b.from) : null,
    b.total ? `₹${Math.round(b.total).toLocaleString('en-IN')}` : null,
    b.group === 'completed' && b.rated !== null ? (b.rated ? 'rated' : 'NOT rated yet') : null,
  ].filter(Boolean);
  return `- [${label}](${b.link}) — ${parts.join(', ')}`;
};

// One list per kind of booking, each capped, so a long tail of old quote
// requests can't push upcoming trips or unrated completed trips out.
function listSection(title: string, items: AccountBooking[], cap: number): string | null {
  if (items.length === 0) return null;
  const more = items.length > cap ? `\n- …and ${items.length - cap} more in My Bookings.` : '';
  return `${title} (${items.length}):\n${items.slice(0, cap).map(bookingLine).join('\n')}${more}`;
}

/** Prompt section describing the customer's bookings. */
export function accountSection(account: AccountContext): string {
  const by = (g: AccountBooking['group']) => account.bookings.filter((b) => b.group === g);
  const time = (b: AccountBooking) => b.when?.getTime() ?? 0;
  const upcoming = by('upcoming').sort((a, b) => time(a) - time(b));
  const ongoing = by('ongoing').sort((a, b) => time(b) - time(a));
  const awaiting = by('awaiting_quotes').sort((a, b) => time(b) - time(a));
  const completed = by('completed').sort((a, b) => time(b) - time(a));
  const unrated = completed.filter((b) => b.rated === false);
  const rated = completed.filter((b) => b.rated !== false);
  const closed = by('closed').sort((a, b) => time(b) - time(a));

  const sections = [
    listSection('Ongoing trips', ongoing, 10),
    listSection('Upcoming (booked, trip date ahead)', upcoming, 15),
    listSection('Quote requests still waiting for quotes', awaiting, 5),
    listSection('Completed trips NOT rated yet', unrated, 10),
    listSection('Other completed trips', rated, 5),
    listSection('Cancelled / expired / past', closed, 3),
  ].filter(Boolean);

  return `## This customer's account (private)
You are talking to the signed-in customer "${account.name}". Below are their own bookings and quote requests, as shown in their My Bookings. Use them to answer questions like "how many upcoming bookings do I have", "when is my next trip", "is my payment done", "which trips can I rate". Link a booking exactly as written so they can open it. Never invent bookings, and never mention any other customer.
Counts — upcoming: ${upcoming.length}, ongoing: ${ongoing.length}, quote requests waiting for quotes: ${awaiting.length}, completed: ${completed.length} (${completed.some((b) => b.rated === null) ? 'rating status not available — send them to My Bookings to rate' : `${unrated.length} not rated yet`}), cancelled/closed: ${closed.length}. Total: ${account.bookings.length}.

${sections.length ? sections.join('\n\n') : '- (no bookings yet)'}`;
}

export const SIGNED_OUT_SECTION = `## This customer's account
The customer is not signed in (or their session has expired), so you can't see their bookings. If they ask about their own bookings, ask them to sign in and point them to My Bookings.`;

// Where a booking opens on the website (mirrors the customer dashboard,
// which opens bike and car-with-driver bookings by booking number).
export function webPathForBooking(b: AccountBooking): string {
  const quote = b.isQuote;
  const byNumber = b.bookingNumber || b.id;
  switch (b.serviceType) {
    case 'bike': return quote ? `/customer/bike-quotes/${b.id}` : `/customer/bike-bookings/${byNumber}`;
    case 'car': return quote ? `/customer/self-drive-quotes/${b.id}` : `/customer/self-drive-bookings/${b.id}`;
    case 'chauffeur': return `/customer/car-rental-bookings/${byNumber}`;
    case 'bus': return quote ? `/customer/bus-quotes/${b.id}` : `/customer/bus-bookings/${b.id}`;
    case 'truck': return quote ? `/customer/truck-quotes/${b.id}` : `/customer/truck-bookings/${b.id}`;
    case 'packers': return quote ? `/customer/packers-quotes/${b.id}` : `/customer/packers-bookings/${b.id}`;
    case 'equipment': return quote ? `/customer/equipment-quotes/${b.id}` : `/customer/equipment-bookings/${b.id}`;
    case 'luxury': return quote ? `/customer/luxury-quotes/${b.id}` : `/customer/luxury-bookings/${b.id}`;
    case 'bulk': return `/customer/b2b-bookings/${b.id}`;
    default: return `/customer/booking/${b.id}`;
  }
}
