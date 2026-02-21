// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// POST - Accept or reject a request on your posting
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { action, agreedAmount, notes } = body;

    if (!action || (action !== 'ACCEPT' && action !== 'REJECT')) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be ACCEPT or REJECT' },
        { status: 400 }
      );
    }

    // Fetch the request with related data
    const p2pRequest = await prisma.p2p_requests.findUnique({
      where: { id },
      include: {
        vehiclePosting: true,
        bookingPosting: true,
        requestingVendor: {
          select: {
            id: true,
            businessName: true,
            city: true,
            logo: true,
          },
        },
      },
    });

    if (!p2pRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    // Only PENDING requests can be responded to
    if (p2pRequest.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'This request has already been responded to' },
        { status: 400 }
      );
    }

    // Only the posting owner can respond
    if (p2pRequest.postingVendorId !== auth.vendorId) {
      return NextResponse.json(
        { success: false, error: 'Only the posting owner can respond to requests' },
        { status: 403 }
      );
    }

    // --- REJECT ---
    if (action === 'REJECT') {
      const updatedRequest = await prisma.p2p_requests.update({
        where: { id },
        data: {
          status: 'REJECTED',
          respondedAt: new Date(),
        },
        include: {
          vehiclePosting: true,
          bookingPosting: true,
          requestingVendor: {
            select: {
              id: true,
              businessName: true,
              city: true,
              logo: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        request: updatedRequest,
        message: 'Request rejected',
      });
    }

    // --- ACCEPT ---
    const posting = p2pRequest.vehiclePosting || p2pRequest.bookingPosting;

    if (!posting) {
      return NextResponse.json(
        { success: false, error: 'Associated posting not found' },
        { status: 400 }
      );
    }

    // Generate transaction ID
    const allIds = await prisma.p2p_transactions.findMany({
      where: { id: { startsWith: 'PTX_' } },
      select: { id: true },
    });
    const maxId = allIds.reduce((max, item) => {
      const num = parseInt(item.id.replace('PTX_', ''));
      return num > max ? num : max;
    }, 0);
    const newId = `PTX_${maxId + 1}`;

    // Generate transaction number
    const allTxNumbers = await prisma.p2p_transactions.findMany({
      where: { transactionNumber: { startsWith: 'TX-' } },
      select: { transactionNumber: true },
    });
    const maxTxNum = allTxNumbers.reduce((max, item) => {
      const num = parseInt(item.transactionNumber.replace('TX-', ''));
      return num > max ? num : max;
    }, 1000);
    const transactionNumber = `TX-${maxTxNum + 1}`;

    // Generate 4-digit end OTP
    const endOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Calculate financials
    const isVehiclePosting = !!p2pRequest.vehiclePostingId;
    const finalAmount = agreedAmount || (isVehiclePosting ? posting.priceFullLoad : posting.customerBudget) || 0;
    const platformFeePercent = 5;
    const platformFee = finalAmount * 0.05;

    let vendorAEarning = 0;
    let vendorBEarning = 0;

    if (isVehiclePosting) {
      // VEHICLE posting: vendorA (poster) earns agreedAmount - platformFee, vendorB earns 0
      vendorAEarning = finalAmount - platformFee;
      vendorBEarning = 0;
    } else {
      // BOOKING posting: vendorA (poster) earns commission, vendorB earns partnerEarning
      vendorAEarning = posting.commission || 0;
      vendorBEarning = (posting.partnerEarning || 0) - platformFee;
    }

    // Run everything in a transaction for atomicity
    const [updatedRequest, , , transaction] = await prisma.$transaction([
      // 1. Update request status to ACCEPTED
      prisma.p2p_requests.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
      }),

      // 2. Reject all other PENDING requests for the same posting
      ...(p2pRequest.vehiclePostingId
        ? [
            prisma.p2p_requests.updateMany({
              where: {
                vehiclePostingId: p2pRequest.vehiclePostingId,
                status: 'PENDING',
                id: { not: id },
              },
              data: {
                status: 'REJECTED',
                respondedAt: new Date(),
              },
            }),
          ]
        : [
            prisma.p2p_requests.updateMany({
              where: {
                bookingPostingId: p2pRequest.bookingPostingId,
                status: 'PENDING',
                id: { not: id },
              },
              data: {
                status: 'REJECTED',
                respondedAt: new Date(),
              },
            }),
          ]),

      // 3. Update the posting status to ACCEPTED
      ...(p2pRequest.vehiclePostingId
        ? [
            prisma.p2p_vehicle_postings.update({
              where: { id: p2pRequest.vehiclePostingId },
              data: { status: 'ACCEPTED' },
            }),
          ]
        : [
            prisma.p2p_booking_postings.update({
              where: { id: p2pRequest.bookingPostingId },
              data: { status: 'ACCEPTED' },
            }),
          ]),

      // 4. Create the p2p_transaction
      prisma.p2p_transactions.create({
        data: {
          id: newId,
          transactionNumber,
          postingType: isVehiclePosting ? 'VEHICLE' : 'BOOKING',
          vehiclePostingId: p2pRequest.vehiclePostingId || null,
          bookingPostingId: p2pRequest.bookingPostingId || null,
          requestId: p2pRequest.id,
          vendorAId: p2pRequest.postingVendorId,
          vendorBId: p2pRequest.requestingVendorId,
          serviceType: posting.serviceType,
          fromCity: posting.fromCity,
          toCity: posting.toCity || null,
          tripDate: isVehiclePosting ? posting.departureDate : posting.tripDate,
          vehicleName: posting.vehicleName || p2pRequest.driverName || null,
          vehicleNumber: posting.vehicleNumber || null,
          driverName: p2pRequest.driverName || posting.driverName || null,
          driverPhone: p2pRequest.driverPhone || posting.driverPhone || null,
          agreedAmount: finalAmount,
          platformFeePercent,
          platformFee,
          vendorAEarning,
          vendorBEarning,
          paymentStatus: 'PENDING',
          tripStatus: 'CONFIRMED',
          endOtp,
          notes: notes || null,
        },
        include: {
          vendorA: {
            select: {
              id: true,
              businessName: true,
              city: true,
              phone: true,
              logo: true,
              rating: true,
            },
          },
          vendorB: {
            select: {
              id: true,
              businessName: true,
              city: true,
              phone: true,
              logo: true,
              rating: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      transaction,
      request: updatedRequest,
      message: 'Request accepted and transaction created',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('P2P request respond error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to respond to request' },
      { status: 500 }
    );
  }
}
