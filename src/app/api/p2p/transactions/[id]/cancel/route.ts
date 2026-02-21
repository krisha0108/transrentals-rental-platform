// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

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

    // Fetch the transaction with related posting info
    const transaction = await prisma.p2p_transactions.findUnique({
      where: { id },
      include: {
        vehiclePosting: { select: { id: true, status: true } },
        bookingPosting: { select: { id: true, status: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Either vendorA or vendorB can cancel
    if (
      transaction.vendorAId !== auth.vendorId &&
      transaction.vendorBId !== auth.vendorId
    ) {
      return NextResponse.json(
        { error: 'You do not have access to this transaction' },
        { status: 403 }
      );
    }

    // Can only cancel if PENDING or CONFIRMED (not IN_PROGRESS or COMPLETED)
    if (
      transaction.tripStatus !== 'PENDING' &&
      transaction.tripStatus !== 'CONFIRMED'
    ) {
      return NextResponse.json(
        {
          error: `Cannot cancel transaction. Current status is ${transaction.tripStatus}, can only cancel PENDING or CONFIRMED transactions`,
        },
        { status: 400 }
      );
    }

    // Parse body for optional reason
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const reason = body.reason || null;

    // Update the transaction to CANCELLED
    const updatedTransaction = await prisma.p2p_transactions.update({
      where: { id },
      data: {
        tripStatus: 'CANCELLED',
        notes: reason,
      },
      include: {
        vendorA: {
          select: {
            id: true,
            businessName: true,
            city: true,
            logo: true,
          },
        },
        vendorB: {
          select: {
            id: true,
            businessName: true,
            city: true,
            logo: true,
          },
        },
      },
    });

    // Check if the related posting should be set back to ACTIVE
    // Only reactivate if this was the only non-cancelled transaction for that posting
    if (transaction.postingType === 'VEHICLE' && transaction.vehiclePostingId) {
      const activeTransactionCount = await prisma.p2p_transactions.count({
        where: {
          vehiclePostingId: transaction.vehiclePostingId,
          id: { not: id },
          tripStatus: { notIn: ['CANCELLED'] },
        },
      });

      if (activeTransactionCount === 0) {
        await prisma.p2p_vehicle_postings.update({
          where: { id: transaction.vehiclePostingId },
          data: { status: 'ACTIVE' },
        });

        logger.info('Vehicle posting reactivated after transaction cancel', {
          postingId: transaction.vehiclePostingId,
        });
      }
    } else if (transaction.postingType === 'BOOKING' && transaction.bookingPostingId) {
      const activeTransactionCount = await prisma.p2p_transactions.count({
        where: {
          bookingPostingId: transaction.bookingPostingId,
          id: { not: id },
          tripStatus: { notIn: ['CANCELLED'] },
        },
      });

      if (activeTransactionCount === 0) {
        await prisma.p2p_booking_postings.update({
          where: { id: transaction.bookingPostingId },
          data: { status: 'ACTIVE' },
        });

        logger.info('Booking posting reactivated after transaction cancel', {
          postingId: transaction.bookingPostingId,
        });
      }
    }

    logger.info('P2P transaction cancelled', {
      vendorId: auth.vendorId,
      transactionId: id,
      transactionNumber: transaction.transactionNumber,
      reason,
    });

    return NextResponse.json({ transaction: updatedTransaction });
  } catch (error) {
    logger.error('Failed to cancel P2P transaction', error);
    return NextResponse.json(
      { error: 'Failed to cancel transaction' },
      { status: 500 }
    );
  }
}
