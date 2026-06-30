import { NextRequest, NextResponse } from 'next/server';
import { initiateLink } from '@/lib/backr';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/backr/connect
 * Body (one of):
 *   { customerId: string }      → externalUserId = customerId
 *   { vendorId: string }        → externalUserId = VND_<vendorId>
 *   { driverId: string }        → externalUserId = DRV_<driverId>
 *   { travelAgentId: string }   → externalUserId = TA_<travelAgentId>
 * Returns: { ssoUrl: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://transrentals.in';

    let externalUserId: string;
    let dashboardPath: string;

    if (body.customerId) {
      externalUserId = body.customerId;
      dashboardPath = '/customer/dashboard';
    } else if (body.vendorId) {
      externalUserId = `VND_${body.vendorId}`;
      dashboardPath = '/vendor/dashboard';
    } else if (body.driverId) {
      externalUserId = `DRV_${body.driverId}`;
      dashboardPath = '/driver/dashboard';
    } else if (body.travelAgentId) {
      externalUserId = `TA_${body.travelAgentId}`;
      dashboardPath = '/travel-agent/dashboard';
    } else {
      return NextResponse.json({ error: 'userId required (customerId | vendorId | driverId | travelAgentId)' }, { status: 400 });
    }

    const redirectUri = `${appUrl}/backr/callback?redirectTo=${encodeURIComponent(dashboardPath)}`;

    const { ssoUrl } = await initiateLink({
      externalUserId,
      redirectUri,
      state: externalUserId,
    });

    return NextResponse.json({ ssoUrl });
  } catch (err) {
    logger.error('[BACKR] connect failed', err);
    return NextResponse.json({ error: 'Failed to initiate BACKR link' }, { status: 500 });
  }
}
