// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET — counts of open B2B booking requests this vendor can still quote on,
// split by regular B2B vs CUSTOM_BULK. Drives the sidebar badges so the
// vendor sees at a glance when a new request lands.
//
// "Open & unquoted" means the booking is OPEN_FOR_QUOTES / QUOTES_RECEIVED
// AND the vendor hasn't already submitted a non-rejected quote on it.
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ b2b: 0, bulk: 0 }, { status: 401 });
    }

    const baseWhere: any = {
      status: { in: ['OPEN_FOR_QUOTES', 'QUOTES_RECEIVED'] },
      // Exclude bookings where this vendor has already submitted an active quote
      NOT: {
        vendorQuotes: {
          some: {
            vendorId: auth.vendorId,
            status: { notIn: ['REJECTED', 'WITHDRAWN'] },
          },
        },
      },
    };

    const [bulk, b2b] = await Promise.all([
      prisma.b2b_bookings.count({
        where: { ...baseWhere, serviceType: 'CUSTOM_BULK' },
      }),
      prisma.b2b_bookings.count({
        where: { ...baseWhere, serviceType: { not: 'CUSTOM_BULK' } },
      }),
    ]);

    return NextResponse.json({ b2b, bulk });
  } catch (error: any) {
    console.error('open-count error:', error);
    return NextResponse.json({ b2b: 0, bulk: 0 }, { status: 500 });
  }
}
