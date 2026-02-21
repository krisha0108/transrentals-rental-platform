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

    // Only vendorA (posting owner) can start the trip
    if (transaction.vendorAId !== auth.vendorId) {
      return NextResponse.json(
        { error: 'Only the posting owner (vendorA) can start the trip' },
        { status: 403 }
      );
    }

    // tripStatus must be CONFIRMED to start
    if (transaction.tripStatus !== 'CONFIRMED') {
      return NextResponse.json(
        {
          error: `Cannot start trip. Current status is ${transaction.tripStatus}, must be CONFIRMED`,
        },
        { status: 400 }
      );
    }

    // Generate random 4-digit OTP
    const startOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Update transaction
    const updatedTransaction = await prisma.p2p_transactions.update({
      where: { id },
      data: {
        tripStatus: 'IN_PROGRESS',
        startedAt: new Date(),
        startOtp,
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

    logger.info('P2P trip started', {
      vendorId: auth.vendorId,
      transactionId: id,
      transactionNumber: transaction.transactionNumber,
    });

    return NextResponse.json({
      transaction: updatedTransaction,
      startOtp,
    });
  } catch (error) {
    logger.error('Failed to start P2P trip', error);
    return NextResponse.json(
      { error: 'Failed to start trip' },
      { status: 500 }
    );
  }
}
