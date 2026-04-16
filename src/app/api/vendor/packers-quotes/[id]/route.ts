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
    const quote = await prisma.packers_quotes.findFirst({
      where: { id, vendorId: auth.vendorId },
      include: {
        packers_quote_requests: { select: { id: true, requestNumber: true, customerName: true, customerEmail: true, customerPhone: true, pickupCity: true, pickupAddress: true, pickupFloor: true, hasPickupLift: true, dropCity: true, dropAddress: true, dropFloor: true, hasDropLift: true, preferredDate: true, serviceType: true, shiftingType: true, propertySize: true, needPacking: true, needUnpacking: true, needStorage: true, storageDays: true, needInsurance: true, insuranceValue: true, requirements: true, status: true } },
        packers_bookings: { select: { id: true, bookingNumber: true, status: true } },
      },
    });
    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    const parseJson = (f: any) => { if (!f) return []; if (Array.isArray(f)) return f; try { return JSON.parse(f); } catch { return []; } };
    const { packers_bookings, ...quoteRest } = quote;
    return NextResponse.json({ success: true, quote: { ...quoteRest, request: quote.packers_quote_requests, booking: packers_bookings || null, inclusions: parseJson(quote.inclusions), exclusions: parseJson(quote.exclusions), termsConditions: parseJson(quote.termsConditions) } });
  } catch (error: any) {
    logger.error('Failed to fetch packers quote', error);
    return NextResponse.json({ error: 'Failed to fetch quote', details: error?.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = params;
    const { action } = await request.json();
    const quote = await prisma.packers_quotes.findFirst({ where: { id, vendorId: auth.vendorId } });
    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    if (action === 'withdraw') {
      if (!['SENT', 'VIEWED'].includes(quote.status)) return NextResponse.json({ error: 'Cannot withdraw' }, { status: 400 });
      const updated = await prisma.packers_quotes.update({ where: { id }, data: { status: 'WITHDRAWN' } });
      return NextResponse.json({ success: true, message: 'Quote withdrawn', quote: updated });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('Failed to update packers quote', error);
    return NextResponse.json({ error: 'Failed to update quote', details: error?.message }, { status: 500 });
  }
}
