// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = params;
    const quote = await prisma.self_drive_quotes.findFirst({
      where: { id, vendorId: auth.vendorId },
      include: {
        self_drive_quote_requests_self_drive_quotes_requestIdToself_drive_quote_requests: {
          select: { id: true, requestNumber: true, customerName: true, customerPhone: true, customerEmail: true, locationName: true, pickupDate: true, pickupTime: true, dropDate: true, dropTime: true, totalDays: true, isDeliveryRequested: true, pickupAddress: true, customerNotes: true, budgetMin: true, budgetMax: true, vehicleCategoryName: true, vehicleBrand: true, transmission: true, fuelType: true, minSeats: true, numberOfVehicles: true, status: true },
        },
        car_bookings: {
          select: { id: true, bookingNumber: true, status: true, paymentStatus: true, tripStartOtp: true, tripStartOtpExpiry: true, tripOtpVerified: true, pickedUpAt: true, returnedAt: true, customerName: true, customerPhone: true },
        },
      },
    });
    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    // Map the long relation name to 'request' for cleaner response
    const response = {
      ...quote,
      request: quote.self_drive_quote_requests_self_drive_quotes_requestIdToself_drive_quote_requests,
    };
    delete (response as any).self_drive_quote_requests_self_drive_quotes_requestIdToself_drive_quote_requests;
    return NextResponse.json({ success: true, quote: response, booking: quote.car_bookings || null });
  } catch (error: any) {
    logger.error('Failed to fetch self-drive quote', error);
    return NextResponse.json({ error: 'Failed to fetch quote', details: error?.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    // Block rejected/suspended/blocked vendors from write operations
    const _guard = await vendorStatusGuard(auth.vendorId!);
    if (_guard.blocked) return _guard.response;
    const { id } = params;
    const { action } = await request.json();
    const quote = await prisma.self_drive_quotes.findFirst({ where: { id, vendorId: auth.vendorId } });
    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    if (action === 'withdraw') {
      if (!['SENT', 'VIEWED'].includes(quote.status)) return NextResponse.json({ error: 'Cannot withdraw' }, { status: 400 });
      const updated = await prisma.self_drive_quotes.update({ where: { id }, data: { status: 'WITHDRAWN' } });
      return NextResponse.json({ success: true, message: 'Quote withdrawn', quote: updated });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('Failed to update self-drive quote', error);
    return NextResponse.json({ error: 'Failed to update quote', details: error?.message }, { status: 500 });
  }
}
