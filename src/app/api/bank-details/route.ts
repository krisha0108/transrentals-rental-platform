// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bank-details
 * Public endpoint to fetch active bank details for payments
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch primary active bank details
    const bankDetails = await prisma.bank_details.findFirst({
      where: {
        isActive: true,
        isPrimary: true,
      },
      select: {
        id: true,
        accountHolderName: true,
        bankName: true,
        upiId: true,
        upiQrCode: true,
      },
    });

    if (!bankDetails) {
      // If no primary, get any active bank details
      const anyActive = await prisma.bank_details.findFirst({
        where: { isActive: true },
        select: {
          id: true,
          accountHolderName: true,
          bankName: true,
          upiId: true,
          upiQrCode: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!anyActive) {
        return NextResponse.json({
          success: false,
          message: 'No active bank details found',
        });
      }

      return NextResponse.json({
        success: true,
        bankDetails: anyActive,
      });
    }

    return NextResponse.json({
      success: true,
      bankDetails,
    });
  } catch (error: any) {
    logger.error('Public bank details fetch error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bank details', details: error?.message },
      { status: 500 }
    );
  }
}
