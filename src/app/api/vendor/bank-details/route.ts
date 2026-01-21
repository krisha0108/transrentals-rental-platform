import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get vendor bank details
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const vendor = await prisma.vendors.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        accountHolderName: true,
        accountNumber: true,
        ifscCode: true,
        bankName: true,
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({
      bankDetails: {
        accountHolderName: vendor.accountHolderName,
        accountNumber: vendor.accountNumber,
        ifscCode: vendor.ifscCode,
        bankName: vendor.bankName,
        branchName: null,
        upiId: null,
      },
    });
  } catch (error: any) {
    logger.error('Get vendor bank details error', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank details', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Update vendor bank details
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const body = await request.json();
    const {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
    } = body;

    // Validate required fields
    if (!accountHolderName || !accountHolderName.trim()) {
      return NextResponse.json({ error: 'Account holder name is required' }, { status: 400 });
    }
    if (!accountNumber || !accountNumber.trim()) {
      return NextResponse.json({ error: 'Account number is required' }, { status: 400 });
    }
    if (!ifscCode || !ifscCode.trim()) {
      return NextResponse.json({ error: 'IFSC code is required' }, { status: 400 });
    }
    if (ifscCode.trim().length !== 11) {
      return NextResponse.json({ error: 'IFSC code must be 11 characters' }, { status: 400 });
    }

    // Update vendor bank details
    const vendor = await prisma.vendors.update({
      where: { id: vendorId },
      data: {
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        bankName: bankName?.trim() || null,
      },
      select: {
        id: true,
        accountHolderName: true,
        accountNumber: true,
        ifscCode: true,
        bankName: true,
      },
    });

    logger.info('Vendor bank details updated', { vendorId });

    return NextResponse.json({
      success: true,
      bankDetails: {
        accountHolderName: vendor.accountHolderName,
        accountNumber: vendor.accountNumber,
        ifscCode: vendor.ifscCode,
        bankName: vendor.bankName,
        branchName: null,
        upiId: null,
      },
      message: 'Bank details updated successfully',
    });
  } catch (error: any) {
    logger.error('Update vendor bank details error', error);
    return NextResponse.json(
      { error: 'Failed to update bank details', details: error?.message },
      { status: 500 }
    );
  }
}
