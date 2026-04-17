// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET – list all bank accounts for the vendor
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const accounts = await prisma.vendor_bank_accounts.findMany({
      where: { vendorId: auth.vendorId, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ success: true, accounts });
  } catch (error: any) {
    logger.error('Get vendor bank accounts error', error);
    return NextResponse.json({ error: 'Failed to fetch bank accounts', details: error?.message }, { status: 500 });
  }
}

// POST – add a new bank account
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bankName, accountHolderName, accountNumber, ifscCode, accountType, branchName, upiId, isPrimary } = body;

    if (!bankName?.trim()) return NextResponse.json({ error: 'Bank name is required' }, { status: 400 });
    if (!accountHolderName?.trim()) return NextResponse.json({ error: 'Account holder name is required' }, { status: 400 });
    if (!accountNumber?.trim()) return NextResponse.json({ error: 'Account number is required' }, { status: 400 });
    if (!ifscCode?.trim()) return NextResponse.json({ error: 'IFSC code is required' }, { status: 400 });
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.trim().toUpperCase())) {
      return NextResponse.json({ error: 'Invalid IFSC code format' }, { status: 400 });
    }

    // If this is to be primary, unset others
    if (isPrimary) {
      await prisma.vendor_bank_accounts.updateMany({
        where: { vendorId: auth.vendorId },
        data: { isPrimary: false },
      });
    }

    // If this is the first account, auto-set as primary
    const count = await prisma.vendor_bank_accounts.count({ where: { vendorId: auth.vendorId, isActive: true } });
    const setAsPrimary = isPrimary || count === 0;

    const account = await prisma.vendor_bank_accounts.create({
      data: {
        vendorId: auth.vendorId,
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        accountType: accountType || 'SAVINGS',
        branchName: branchName?.trim() || null,
        upiId: upiId?.trim() || null,
        isPrimary: setAsPrimary,
      },
    });

    return NextResponse.json({ success: true, account });
  } catch (error: any) {
    logger.error('Add vendor bank account error', error);
    return NextResponse.json({ error: 'Failed to add bank account', details: error?.message }, { status: 500 });
  }
}
