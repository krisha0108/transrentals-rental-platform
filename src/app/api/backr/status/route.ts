import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import { verifyDriverToken } from '@/lib/auth/driver-auth';
import { getIdentity } from '@/lib/backr';

export const dynamic = 'force-dynamic';

/**
 * GET /api/backr/status?type=vendor|driver|travel_agent
 * GET /api/backr/status?type=customer&uid=<customerId>
 *
 * Returns the BACKR identity for the current user:
 *   { linked, wallet, backrEmail, xp, level }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'customer';

  let externalUserId: string;

  try {
    if (type === 'vendor') {
      const auth = await getVendorAuth(req);
      if (!auth.authenticated || !auth.vendorId)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      externalUserId = `VND_${auth.vendorId}`;

    } else if (type === 'driver') {
      const payload = await verifyDriverToken(req);
      if (!payload)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      externalUserId = `DRV_${payload.driverId}`;

    } else if (type === 'travel_agent') {
      const auth = await getTravelAgentAuth(req);
      if (!auth.authenticated || !auth.travelAgentId)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      externalUserId = `TA_${auth.travelAgentId}`;

    } else {
      const uid = searchParams.get('uid');
      if (!uid)
        return NextResponse.json({ error: 'uid required' }, { status: 400 });
      externalUserId = uid;
    }
  } catch {
    return NextResponse.json({ error: 'Auth failed' }, { status: 401 });
  }

  try {
    const identity = await getIdentity(externalUserId);
    return NextResponse.json(identity);
  } catch (err) {
    console.error('[BACKR] getIdentity failed:', err);
    return NextResponse.json({ linked: false }, { status: 200 });
  }
}
