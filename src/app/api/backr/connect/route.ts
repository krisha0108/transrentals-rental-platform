import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import { verifyDriverToken } from '@/lib/auth/driver-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/backr/connect?type=customer&uid=CUST_42
 * GET /api/backr/connect?type=vendor
 * GET /api/backr/connect?type=driver
 * GET /api/backr/connect?type=travel_agent
 *
 * Identifies the current user, calls BACKR SSO initiate, then 302-redirects
 * the browser to the BACKR auth page.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type    = searchParams.get('type') || 'customer';
  const appUrl  = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://transrentals.in').replace(/\/$/, '');
  const base    = (process.env.BACKR_BASE_URL ?? 'https://backrcoin.org').replace(/\/$/, '');
  const apiKey  = process.env.BACKR_API_KEY;

  let externalUserId: string;
  let dashboardPath: string;

  // ── 1. Identify caller ──────────────────────────────────────────────────────
  try {
    if (type === 'vendor') {
      const auth = await getVendorAuth(req);
      if (!auth.authenticated || !auth.vendorId)
        return NextResponse.redirect(new URL('/vendor/login', req.url));
      externalUserId = `VND_${auth.vendorId}`;
      dashboardPath  = '/vendor/dashboard';

    } else if (type === 'driver') {
      const payload = await verifyDriverToken(req);
      if (!payload)
        return NextResponse.redirect(new URL('/driver/login', req.url));
      externalUserId = `DRV_${payload.driverId}`;
      dashboardPath  = '/driver/dashboard';

    } else if (type === 'travel_agent') {
      const auth = await getTravelAgentAuth(req);
      if (!auth.authenticated || !auth.travelAgentId)
        return NextResponse.redirect(new URL('/travel-agent/login', req.url));
      externalUserId = `TA_${auth.travelAgentId}`;
      dashboardPath  = '/travel-agent/dashboard';

    } else {
      // customer — token lives in localStorage, not a cookie; uid passed as query param
      const uid = searchParams.get('uid');
      if (!uid)
        return NextResponse.redirect(new URL('/customer/login', req.url));
      externalUserId = uid;
      dashboardPath  = '/customer/dashboard';
    }
  } catch (err) {
    console.error('[BACKR] auth check failed:', err);
    return NextResponse.redirect(new URL('/backr/callback?backr_error=1', req.url));
  }

  // ── 2. Call BACKR SSO initiate ──────────────────────────────────────────────
  try {
    const redirectUri = `${appUrl}/backr/callback?redirectTo=${encodeURIComponent(dashboardPath)}`;

    const backrRes = await fetch(`${base}/api/v1/external/auth/sso/initiate`, {
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
      return NextResponse.redirect(
        new URL(`${dashboardPath}?backr_error=sso_failed`, req.url)
      );
    }

    const json    = await backrRes.json();
    const ssoUrl: string | undefined = json?.data?.ssoUrl;

    if (!ssoUrl) {
      console.error('[BACKR] SSO initiate — no ssoUrl in response:', JSON.stringify(json));
      return NextResponse.redirect(
        new URL(`${dashboardPath}?backr_error=no_url`, req.url)
      );
    }

    // ── 3. 302 → BACKR SSO page ───────────────────────────────────────────────
    return NextResponse.redirect(ssoUrl);

  } catch (err) {
    console.error('[BACKR] SSO initiate exception:', err);
    return NextResponse.redirect(
      new URL(`${dashboardPath}?backr_error=exception`, req.url)
    );
  }
}
