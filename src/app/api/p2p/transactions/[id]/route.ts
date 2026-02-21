// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(
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

    const transaction = await prisma.p2p_transactions.findUnique({
      where: { id },
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
        vehiclePosting: true,
        bookingPosting: true,
        request: true,
        p2p_ratings: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Only vendorA or vendorB can view this transaction
    if (
      transaction.vendorAId !== auth.vendorId &&
      transaction.vendorBId !== auth.vendorId
    ) {
      return NextResponse.json(
        { error: 'You do not have access to this transaction' },
        { status: 403 }
      );
    }

    logger.info('P2P transaction detail viewed', {
      vendorId: auth.vendorId,
      transactionId: id,
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    logger.error('Failed to fetch P2P transaction detail', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}
