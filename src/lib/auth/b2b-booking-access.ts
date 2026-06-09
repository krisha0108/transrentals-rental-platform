// @ts-nocheck
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import { validateToken } from '@/lib/security/token-manager';

export interface B2BAccessBooking {
  customerId?: string | null;
  travelAgentId?: string | null;
}

export interface B2BAccessResult {
  ok: boolean;
  status?: number; // HTTP status to use when !ok
  error?: string;
  role?: 'staff' | 'vendor' | 'travel_agent' | 'customer';
  actorId?: string;
}

function extractBearer(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7);
  const sessionToken = request.headers.get('X-Session-Token');
  return sessionToken || null;
}

/**
 * Authorize a caller to view a single B2B booking, across every legitimate
 * client of `/api/b2b/bookings/[id]`:
 *
 *   - staff (admin / sub-admin / manager → NextAuth userType 'admin')  → full access
 *   - vendor (NextAuth userType 'vendor')                              → full access (they quote on it)
 *   - travel agent (NextAuth cookie OR Bearer JWT)  → ONLY their own bookings (travelAgentId match)
 *   - customer (stateful Bearer access token)        → ONLY their own bookings (customerId match)
 *
 * Returns { ok:false, status:401 } when no identity is presented and
 * { ok:false, status:403 } when the caller is authenticated but does not own
 * the booking. This closes the IDOR where any caller could read any company's
 * booking (customer PII, vendor pricing, company margin, driver licenses).
 */
export async function authorizeB2BBookingAccess(
  request: NextRequest,
  booking: B2BAccessBooking,
): Promise<B2BAccessResult> {
  // 1) Staff / vendor via NextAuth session cookie (web dashboards)
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (token?.userType === 'admin') {
      // admin-credentials provider also issues manager / sub-admin sessions
      return { ok: true, role: 'staff', actorId: token.id as string };
    }
    if (token?.userType === 'vendor' && token.id) {
      return { ok: true, role: 'vendor', actorId: token.id as string };
    }
  } catch {
    // fall through to token-based checks
  }

  // 2) Travel agent (cookie or Bearer JWT) — scoped to their own bookings
  const ta = await getTravelAgentAuth(request);
  if (ta.authenticated && ta.travelAgentId) {
    if (booking.travelAgentId && booking.travelAgentId === ta.travelAgentId) {
      return { ok: true, role: 'travel_agent', actorId: ta.travelAgentId };
    }
    return { ok: false, status: 403, error: 'This booking does not belong to your agency' };
  }

  // 3) Customer via stateful access token — scoped to their own bookings
  const bearer = extractBearer(request);
  if (bearer) {
    try {
      const v = await validateToken(bearer);
      if (v.valid && v.customerId) {
        if (booking.customerId && String(booking.customerId) === String(v.customerId)) {
          return { ok: true, role: 'customer', actorId: String(v.customerId) };
        }
        return { ok: false, status: 403, error: 'This booking does not belong to you' };
      }
    } catch {
      // fall through to 401
    }
  }

  return { ok: false, status: 401, error: 'Authentication required' };
}
