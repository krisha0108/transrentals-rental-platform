import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import { verifyDriverToken } from '@/lib/auth/driver-auth';

export const dynamic = 'force-dynamic';

// Single source of truth — never derived from req.host / req.nextUrl.origin
const APP_URL  = (process.env.APP_URL  ?? 'https://transrentals.in').replace(/\/$/, '');
const BASE_URL = (process.env.BACKR_BASE_URL ?? 'https://backrcoin.org').replace(/\/$/, '');

/**
 * GET /api/backr/connect?type=vendor|driver|travel_agent
 * GET /api/backr/connect?type=customer&uid=CUST_42
 *
 * Identifies the current user, calls BACKR SSO initiate, then 302s to BACKR.
 * redirectUri is always built from APP_URL env — Docker/container host never leaks.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type   = searchParams.get('type') || 'customer';
  const apiKey = process.env.BACKR_API_KEY;

  let externalUserId: string;
  let dashboardPath: string;

  // ── 1. Identify caller (auth via cookies — never req.host) ────────────────
  try {
    if (type === 'vendor') {
      const auth = await getVendorAuth(req);
      if (!auth.authenticated || !auth.vendorId)
        return NextResponse.redirect(`${APP_URL}/vendor/login`);
      externalUserId = `VND_${auth.vendorId}`;
      dashboardPath  = '/vendor/dashboard';

    } else if (type === 'driver') {
      const payload = await verifyDriverToken(req);
      if (!payload)
        return NextResponse.redirect(`${APP_URL}/driver/login`);
      externalUserId = `DRV_${payload.driverId}`;
      dashboardPath  = '/driver/dashboard';

    } else if (type === 'travel_agent') {
      const auth = await getTravelAgentAuth(req);
      if (!auth.authenticated || !auth.travelAgentId)
        return NextResponse.redirect(`${APP_URL}/travel-agent/login`);
      externalUserId = `TA_${auth.travelAgentId}`;
      dashboardPath  = '/travel-agent/dashboard';

    } else {
      // customer: token is in localStorage (not a cookie) — uid passed as ?uid=
      const uid = searchParams.get('uid');
      if (!uid)
        return NextResponse.redirect(`${APP_URL}/customer/login`);
      externalUserId = uid;
      dashboardPath  = '/customer/dashboard';
    }
  } catch (err) {
    console.error('[BACKR] auth check failed:', err);
    return NextResponse.redirect(`${APP_URL}/customer/dashboard?backr_error=auth_failed`);
  }

  // ── 2. Call BACKR SSO initiate (redirectUri uses APP_URL, never req.host) ──
  try {
    const redirectUri = `${APP_URL}/backr/callback?redirectTo=${encodeURIComponent(dashboardPath)}`;

    const backrRes = await fetch(`${BASE_URL}/api/v1/external/auth/sso/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ externalUserId, redirectUri, state: externalUserId }),
    });

    if (!backrRes.ok) {
      const errText = await backrRes.text().catch(() => '');
      console.error(`[BACKR] SSO initiate failed — HTTP ${backrRes.status}:`, errText);
      return NextResponse.redirect(`${APP_URL}${dashboardPath}?backr_error=sso_failed`);
    }

    const json   = await backrRes.json();
    const ssoUrl = json?.data?.ssoUrl as string | undefined;

    if (!ssoUrl) {
      console.error('[BACKR] SSO initiate — no ssoUrl in response:', JSON.stringify(json));
      return NextResponse.redirect(`${APP_URL}${dashboardPath}?backr_error=no_url`);
    }

    // ── 3. 302 → BACKR SSO ───────────────────────────────────────────────────
    return NextResponse.redirect(ssoUrl);

  } catch (err) {
    console.error('[BACKR] SSO initiate exception:', err);
    return NextResponse.redirect(`${APP_URL}${dashboardPath}?backr_error=exception`);
  }
}
