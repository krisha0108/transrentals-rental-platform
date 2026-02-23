// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

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

    // Generate IDs efficiently (single-row MAX queries instead of full table scans)
    const [maxReqIdResult, maxReqNumResult, maxTxIdResult, maxTxNumResult]: any[] = await Promise.all([
      prisma.$queryRaw`SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) as maxNum FROM p2p_requests WHERE id LIKE 'PRQ_%'`,
      prisma.$queryRaw`SELECT MAX(CAST(SUBSTRING(requestNumber, 4) AS UNSIGNED)) as maxNum FROM p2p_requests WHERE requestNumber LIKE 'RQ-%'`,
      prisma.$queryRaw`SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) as maxNum FROM p2p_transactions WHERE id LIKE 'PTX_%'`,
      prisma.$queryRaw`SELECT MAX(CAST(SUBSTRING(transactionNumber, 4) AS UNSIGNED)) as maxNum FROM p2p_transactions WHERE transactionNumber LIKE 'TX-%'`,
    ]);
    const newRequestId = `PRQ_${(Number(maxReqIdResult?.[0]?.maxNum) || 0) + 1}`;
    const newRequestNumber = `RQ-${(Number(maxReqNumResult?.[0]?.maxNum) || 0) + 1}`;
    const newTxId = `PTX_${(Number(maxTxIdResult?.[0]?.maxNum) || 0) + 1}`;
    const newTxNumber = `TX-${(Number(maxTxNumResult?.[0]?.maxNum) || 1000) + 1}`;

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
