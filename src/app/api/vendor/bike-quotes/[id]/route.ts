// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = params;
    const quote = await prisma.bike_quotes.findFirst({
      where: { id, vendorId: auth.vendorId },
      include: { bike_quote_requests_bike_quotes_requestIdTobike_quote_requests: { select: { id: true, requestNumber: true, customerName: true, customerPhone: true, locationName: true, pickupDate: true, dropDate: true, totalDays: true, status: true } } },
    });
    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    // Map the long relation name to 'request' for cleaner response
    const response = {
      ...quote,
      request: quote.bike_quote_requests_bike_quotes_requestIdTobike_quote_requests,
    };
    delete (response as any).bike_quote_requests_bike_quotes_requestIdTobike_quote_requests;
    return NextResponse.json({ success: true, quote: response });
  } catch (error: any) {
    logger.error('Failed to fetch bike quote', error);
    return NextResponse.json({ error: 'Failed to fetch quote', details: error?.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = params;
    const { action } = await request.json();
    const quote = await prisma.bike_quotes.findFirst({ where: { id, vendorId: auth.vendorId } });
    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    if (action === 'withdraw') {
      if (!['SENT', 'VIEWED'].includes(quote.status)) return NextResponse.json({ error: 'Cannot withdraw' }, { status: 400 });
      const updated = await prisma.bike_quotes.update({ where: { id }, data: { status: 'WITHDRAWN' } });
      return NextResponse.json({ success: true, message: 'Quote withdrawn', quote: updated });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('Failed to update bike quote', error);
    return NextResponse.json({ error: 'Failed to update quote', details: error?.message }, { status: 500 });
  }
}
