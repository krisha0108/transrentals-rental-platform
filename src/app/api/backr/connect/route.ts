import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import { verifyDriverToken } from '@/lib/auth/driver-auth';
import { initiateLink } from '@/lib/backr';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

const APP_URL = (process.env.APP_URL ?? 'https://transrentals.in').replace(/\/$/, '');

/**
 * GET /api/backr/connect?type=vendor|driver|travel_agent
 * GET /api/backr/connect?type=customer&uid=<customerId>
 *
 * Identifies the current user, calls BACKR SSO initiate (with email + name),
 * then 302s to the BACKR SSO URL.
 * redirectUri is always built from APP_URL env — Docker container host never leaks.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'customer';

  let externalUserId: string;
  let dashboardPath: string;
  let email: string | undefined;
  let name: string | undefined;

  try {
    if (type === 'vendor') {
      const auth = await getVendorAuth(req);
      if (!auth.authenticated || !auth.vendorId)
        return NextResponse.redirect(`${APP_URL}/vendor/login`);
      externalUserId = `VND_${auth.vendorId}`;
      dashboardPath  = '/vendor/dashboard';
      email = auth.email;
      const vendor = await prisma.vendors.findUnique({
        where: { id: auth.vendorId },
        select: { ownerName: true },
      }).catch(() => null);
      name = vendor?.ownerName;

    } else if (type === 'driver') {
      const payload = await verifyDriverToken(req);
      if (!payload)
        return NextResponse.redirect(`${APP_URL}/driver/login`);
      externalUserId = `DRV_${payload.driverId}`;
      dashboardPath  = '/driver/dashboard';
      email = payload.email;
      name  = payload.name;

    } else if (type === 'travel_agent') {
      const auth = await getTravelAgentAuth(req);
      if (!auth.authenticated || !auth.travelAgentId)
        return NextResponse.redirect(`${APP_URL}/travel-agent/login`);
      externalUserId = `TA_${auth.travelAgentId}`;
      dashboardPath  = '/travel-agent/dashboard';
      email = auth.email;
      const ta = await prisma.travel_agents.findUnique({
        where: { id: auth.travelAgentId },
        select: { ownerName: true },
      }).catch(() => null);
      name = ta?.ownerName;

    } else {
      // customer: token is in localStorage (not a cookie) — uid passed as ?uid=
      const uid = searchParams.get('uid');
      if (!uid)
        return NextResponse.redirect(`${APP_URL}/customer/login`);
      externalUserId = uid;
      dashboardPath  = '/customer/dashboard';
      const customer = await prisma.customers.findUnique({
        where: { id: uid },
        select: { email: true, name: true },
      }).catch(() => null);
      email = customer?.email;
      name  = customer?.name;
    }
  } catch (err) {
    console.error('[BACKR] auth check failed:', err);
    return NextResponse.redirect(`${APP_URL}/customer/dashboard?backr_error=auth_failed`);
  }

  try {
    const redirectUri = `${APP_URL}/backr/callback?redirectTo=${encodeURIComponent(dashboardPath)}`;
    const data = await initiateLink({ externalUserId, redirectUri, email, name, state: externalUserId });

    if (!data?.ssoUrl) {
      console.error('[BACKR] SSO initiate — no ssoUrl in response');
      return NextResponse.redirect(`${APP_URL}${dashboardPath}?backr_error=no_url`);
    }

    return NextResponse.redirect(data.ssoUrl);
  } catch (err) {
    console.error('[BACKR] SSO initiate failed:', err);
    return NextResponse.redirect(`${APP_URL}${dashboardPath}?backr_error=sso_failed`);
  }
}
