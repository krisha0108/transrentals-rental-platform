// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';

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

    // Fetch the transaction
    const transaction = await prisma.p2p_transactions.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Only vendorA can complete the trip
    if (transaction.vendorAId !== auth.vendorId) {
      return NextResponse.json(
        { error: 'Only the posting owner (vendorA) can complete the trip' },
        { status: 403 }
      );
    }

    // tripStatus must be IN_PROGRESS to complete
    if (transaction.tripStatus !== 'IN_PROGRESS') {
      return NextResponse.json(
        {
          error: `Cannot complete trip. Current status is ${transaction.tripStatus}, must be IN_PROGRESS`,
        },
        { status: 400 }
      );
    }

    // Complete the transaction
    const updatedTransaction = await prisma.p2p_transactions.update({
      where: { id },
      data: {
        tripStatus: 'COMPLETED',
        completedAt: new Date(),
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

    logger.info('P2P trip completed', {
      vendorId: auth.vendorId,
      transactionId: id,
      transactionNumber: transaction.transactionNumber,
    });

    // Notify vendorB that trip is completed
    sendVendorDirectNotification({
      vendorId: updatedTransaction.vendorBId,
      title: '✅ Trip Completed!',
      body: `Trip ${updatedTransaction.fromCity}→${updatedTransaction.toCity || ''} is done. Rate your experience!`,
      type: 'p2p_trip_completed',
      serviceType: 'p2p',
      bookingId: updatedTransaction.id,
      bookingNumber: updatedTransaction.transactionNumber,
    }).catch((err: any) => console.error('[P2P] Notify vendorB trip complete failed:', err));

    return NextResponse.json({ transaction: updatedTransaction });
  } catch (error) {
    logger.error('Failed to complete P2P trip', error);
    return NextResponse.json(
      { error: 'Failed to complete trip' },
      { status: 500 }
    );
  }
}
