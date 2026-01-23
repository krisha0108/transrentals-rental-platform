import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate a unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// GET - List all bank details
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};
    if (serviceId) {
      where.serviceId = serviceId;
    }
    if (activeOnly) {
      where.isActive = true;
    }

    const bankDetails = await prisma.bank_details.findMany({
      where,
      include: {
        services: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      bankDetails,
    });
  } catch (error: any) {
    logger.error('Bank details list error', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank details', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create new bank details
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branchName,
      accountType,
      upiId,
      upiQrCode,
      isActive,
      isPrimary,
      displayOrder,
      serviceId,
    } = body;

    // Validate required fields
    if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
      return NextResponse.json(
        { error: 'Account holder name, account number, IFSC code, and bank name are required' },
        { status: 400 }
      );
    }

    // If setting as primary, unset other primary accounts
    if (isPrimary) {
      await prisma.bank_details.updateMany({
        where: serviceId ? { serviceId, isPrimary: true } : { serviceId: null, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const bankDetail = await prisma.bank_details.create({
      data: {
        id: generateId(),
        accountHolderName,
        accountNumber,
        ifscCode,
        bankName,
        branchName: branchName || null,
        accountType: accountType || 'SAVINGS',
        upiId: upiId || null,
        upiQrCode: upiQrCode || null,
        isActive: isActive !== false,
        isPrimary: isPrimary || false,
        displayOrder: displayOrder || 0,
        serviceId: serviceId || null,
      },
      include: {
        services: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({ success: true, bankDetail }, { status: 201 });
  } catch (error: any) {
    logger.error('Bank details create error', error);
    return NextResponse.json(
      { error: 'Failed to create bank details', details: error?.message },
      { status: 500 }
    );
  }
}
