import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get active bank details for payment (public API)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceSlug = searchParams.get('service');

    let serviceId: string | null = null;

    // If service slug provided, find the service
    if (serviceSlug) {
      const service = await prisma.services.findUnique({
        where: { slug: serviceSlug },
        select: { id: true },
      });
      if (service) {
        serviceId = service.id;
      }
    }

    // Get active bank details
    // First try service-specific, then fall back to global (null serviceId)
    let bankDetails = await prisma.bank_details.findMany({
      where: {
        isActive: true,
        serviceId: serviceId,
      },
      select: {
        id: true,
        accountHolderName: true,
        accountNumber: true,
        ifscCode: true,
        bankName: true,
        branchName: true,
        accountType: true,
        upiId: true,
        upiQrCode: true,
        isPrimary: true,
      },
      orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
    });

    // If no service-specific details found, get global ones
    if (bankDetails.length === 0 && serviceId) {
      bankDetails = await prisma.bank_details.findMany({
        where: {
          isActive: true,
          serviceId: null,
        },
        select: {
          id: true,
          accountHolderName: true,
          accountNumber: true,
          ifscCode: true,
          bankName: true,
          branchName: true,
          accountType: true,
          upiId: true,
          upiQrCode: true,
          isPrimary: true,
        },
        orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
      });
    }

    // Get primary account or first one
    const primaryAccount = bankDetails.find(b => b.isPrimary) || bankDetails[0] || null;

    return NextResponse.json({
      success: true,
      primaryAccount,
      allAccounts: bankDetails,
    });
  } catch (error: any) {
    logger.error('Payment details error', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment details' },
      { status: 500 }
    );
  }
}
