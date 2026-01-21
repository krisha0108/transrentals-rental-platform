import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get single bank detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id } = resolvedParams;

    const bankDetail = await prisma.bank_details.findUnique({
      where: { id },
      include: {
        service: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!bankDetail) {
      return NextResponse.json({ error: 'Bank details not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, bankDetail });
  } catch (error: any) {
    logger.error('Bank details get error', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank details', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Update bank details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    const resolvedParams = 'then' in params ? await params : params;
    const { id } = resolvedParams;
    const body = await request.json();

    // Check if bank detail exists
    const existing = await prisma.bank_details.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Bank details not found' }, { status: 404 });
    }

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

    // If setting as primary, unset other primary accounts
    if (isPrimary && !existing.isPrimary) {
      const targetServiceId = serviceId !== undefined ? serviceId : existing.serviceId;
      await prisma.bank_details.updateMany({
        where: {
          id: { not: id },
          serviceId: targetServiceId,
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    const bankDetail = await prisma.bank_details.update({
      where: { id },
      data: {
        accountHolderName: accountHolderName ?? existing.accountHolderName,
        accountNumber: accountNumber ?? existing.accountNumber,
        ifscCode: ifscCode ?? existing.ifscCode,
        bankName: bankName ?? existing.bankName,
        branchName: branchName !== undefined ? branchName : existing.branchName,
        accountType: accountType ?? existing.accountType,
        upiId: upiId !== undefined ? upiId : existing.upiId,
        upiQrCode: upiQrCode !== undefined ? upiQrCode : existing.upiQrCode,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        isPrimary: isPrimary !== undefined ? isPrimary : existing.isPrimary,
        displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
        serviceId: serviceId !== undefined ? serviceId : existing.serviceId,
      },
      include: {
        service: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({ success: true, bankDetail });
  } catch (error: any) {
    logger.error('Bank details update error', error);
    return NextResponse.json(
      { error: 'Failed to update bank details', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete bank details
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    const resolvedParams = 'then' in params ? await params : params;
    const { id } = resolvedParams;

    // Check if bank detail exists
    const existing = await prisma.bank_details.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Bank details not found' }, { status: 404 });
    }

    await prisma.bank_details.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Bank details deleted successfully' });
  } catch (error: any) {
    logger.error('Bank details delete error', error);
    return NextResponse.json(
      { error: 'Failed to delete bank details', details: error?.message },
      { status: 500 }
    );
  }
}
