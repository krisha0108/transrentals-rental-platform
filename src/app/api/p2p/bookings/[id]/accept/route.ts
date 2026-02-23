// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';

export const dynamic = 'force-dynamic';

// POST - Accept a booking posting (another vendor fulfills it)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get the booking posting
    const posting = await prisma.p2p_booking_postings.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    if (!posting) {
      return NextResponse.json({ error: 'Booking posting not found' }, { status: 404 });
    }

    // Cannot accept own posting
    if (posting.vendorId === auth.vendorId) {
      return NextResponse.json({ error: 'You cannot accept your own posting' }, { status: 400 });
    }

    // Cannot accept if posting is not ACTIVE
    if (posting.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'This posting is no longer active' }, { status: 400 });
    }

    // Check if already have a PENDING request on same posting
    const existingRequest = await prisma.p2p_requests.findFirst({
      where: {
        bookingPostingId: id,
        requestingVendorId: auth.vendorId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending request on this posting' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { selectedVehicleId, vehicleName, vehicleNumber, driverName, driverPhone, notes } = body;

    // Generate request ID
    const allRequestIds = await prisma.p2p_requests.findMany({
      where: { id: { startsWith: 'PRQ_' } },
      select: { id: true },
    });
    const maxRequestId = allRequestIds.reduce((max, item) => {
      const num = parseInt(item.id.replace('PRQ_', ''));
      return num > max ? num : max;
    }, 0);
    const newRequestId = `PRQ_${maxRequestId + 1}`;

    // Generate request number
    const allRequestNumbers = await prisma.p2p_requests.findMany({
      where: { requestNumber: { startsWith: 'RQ-' } },
      select: { requestNumber: true },
    });
    const maxRequestNum = allRequestNumbers.reduce((max, item) => {
      const num = parseInt(item.requestNumber.replace('RQ-', ''));
      return num > max ? num : max;
    }, 0);
    const newRequestNumber = `RQ-${maxRequestNum + 1}`;

    // Generate transaction ID
    const allTxIds = await prisma.p2p_transactions.findMany({
      where: { id: { startsWith: 'PTX_' } },
      select: { id: true },
    });
    const maxTxId = allTxIds.reduce((max, item) => {
      const num = parseInt(item.id.replace('PTX_', ''));
      return num > max ? num : max;
    }, 0);
    const newTxId = `PTX_${maxTxId + 1}`;

    // Generate transaction number
    const allTxNumbers = await prisma.p2p_transactions.findMany({
      where: { transactionNumber: { startsWith: 'TX-' } },
      select: { transactionNumber: true },
    });
    const maxTxNum = allTxNumbers.reduce((max, item) => {
      const num = parseInt(item.transactionNumber.replace('TX-', ''));
      return num > max ? num : max;
    }, 0);
    const newTxNumber = `TX-${maxTxNum + 1}`;

    // Calculate financials
    const agreedAmount = posting.partnerEarning || posting.customerBudget || 0;
    const platformFee = agreedAmount * 0.05;
    const vendorBEarning = agreedAmount - platformFee;

    // Create request record
    const p2pRequest = await prisma.p2p_requests.create({
      data: {
        id: newRequestId,
        requestNumber: newRequestNumber,
        postingType: 'BOOKING',
        bookingPostingId: id,
        requestingVendorId: auth.vendorId,
        postingVendorId: posting.vendorId,
        selectedVehicleId: selectedVehicleId || null,
        driverName: driverName || null,
        driverPhone: driverPhone || null,
        notes: notes || null,
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
    });

    // Create transaction record
    const transaction = await prisma.p2p_transactions.create({
      data: {
        id: newTxId,
        transactionNumber: newTxNumber,
        postingType: 'BOOKING',
        bookingPostingId: id,
        requestId: newRequestId,
        vendorAId: posting.vendorId,
        vendorBId: auth.vendorId,
        serviceType: posting.serviceType,
        fromCity: posting.fromCity,
        toCity: posting.toCity || null,
        tripDate: posting.tripDate,
        vehicleName: vehicleName || null,
        vehicleNumber: vehicleNumber || null,
        driverName: driverName || null,
        driverPhone: driverPhone || null,
        agreedAmount,
        platformFeePercent: 5.0,
        platformFee,
        vendorAEarning: 0,
        vendorBEarning,
        tripStatus: 'CONFIRMED',
      },
    });

    // Update posting status to ACCEPTED
    await prisma.p2p_booking_postings.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    });

    // Notify posting vendor (A) that booking was accepted
    sendVendorDirectNotification({
      vendorId: posting.vendorId,
      title: '✅ Booking Accepted!',
      body: `${auth.vendorId === posting.vendorId ? 'You' : 'A vendor'} accepted your booking ${posting.fromCity}→${posting.toCity || ''}`,
      type: 'p2p_booking_accepted',
      serviceType: 'p2p',
      bookingId: transaction.id,
      bookingNumber: transaction.transactionNumber,
    }).catch((err: any) => console.error('[P2P] Notify vendorA failed:', err));

    // Notify accepting vendor (B) that deal is confirmed
    sendVendorDirectNotification({
      vendorId: auth.vendorId,
      title: '🤝 Deal Confirmed!',
      body: `Transaction #${transaction.transactionNumber} confirmed for ${posting.fromCity}→${posting.toCity || ''}`,
      type: 'p2p_deal_confirmed',
      serviceType: 'p2p',
      bookingId: transaction.id,
      bookingNumber: transaction.transactionNumber,
    }).catch((err: any) => console.error('[P2P] Notify vendorB failed:', err));

    return NextResponse.json({
      transaction,
      request: p2pRequest,
      message: 'Booking posting accepted successfully',
    }, { status: 201 });
  } catch (error) {
    logger.error('Error accepting booking posting', error);
    return NextResponse.json({ error: 'Failed to accept booking posting' }, { status: 500 });
  }
}
