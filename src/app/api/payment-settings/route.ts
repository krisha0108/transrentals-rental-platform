import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Public API to get payment settings for customers
// Now reads from BankDetails table instead of Setting table
export async function GET() {
  try {
    // Get the primary active bank details
    const bankDetails = await prisma.bank_details.findFirst({
      where: {
        isActive: true,
        isPrimary: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // If no primary found, get any active bank details
    const activeBankDetails = bankDetails || await prisma.bank_details.findFirst({
      where: {
        isActive: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Get advance percent from settings table (this is still a general setting)
    const advancePercentSetting = await prisma.settings.findFirst({
      where: {
        key: 'payment_advance_percent',
      },
    });

    // Get payment instructions from settings table
    const instructionsSetting = await prisma.settings.findFirst({
      where: {
        key: 'payment_instructions',
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        upiId: activeBankDetails?.upiId || '',
        upiName: activeBankDetails?.accountHolderName || 'TransRentals',
        qrCode: activeBankDetails?.upiQrCode || '',
        bankName: activeBankDetails?.bankName || '',
        bankAccount: activeBankDetails?.accountNumber || '',
        bankIfsc: activeBankDetails?.ifscCode || '',
        bankHolder: activeBankDetails?.accountHolderName || '',
        bankBranch: activeBankDetails?.branchName || '',
        instructions: instructionsSetting?.value || 'Please complete the payment and share transaction details.',
        advancePercent: parseInt(advancePercentSetting?.value || '20', 10),
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch payment settings', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment settings' },
      { status: 500 }
    );
  }
}
