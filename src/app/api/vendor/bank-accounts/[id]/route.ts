// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

export const dynamic = 'force-dynamic';

// PATCH – set as primary OR update account
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Block rejected/suspended/blocked vendors from write operations
    const _guard = await vendorStatusGuard(auth.vendorId!);
    if (_guard.blocked) return _guard.response;

    const account = await prisma.vendor_bank_accounts.findFirst({
      where: { id: params.id, vendorId: auth.vendorId },
    });
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    const body = await request.json();

    if (body.setPrimary) {
      // Unset all others then set this one
      await prisma.vendor_bank_accounts.updateMany({
        where: { vendorId: auth.vendorId },
        data: { isPrimary: false },
      });
      await prisma.vendor_bank_accounts.update({
        where: { id: params.id },
        data: { isPrimary: true },
      });
      return NextResponse.json({ success: true, message: 'Primary account updated' });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Update vendor bank account error', error);
    return NextResponse.json({ error: 'Failed to update account', details: error?.message }, { status: 500 });
  }
}

// DELETE – soft delete (set isActive = false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Block rejected/suspended/blocked vendors from write operations
    const _guard = await vendorStatusGuard(auth.vendorId!);
    if (_guard.blocked) return _guard.response;

    const account = await prisma.vendor_bank_accounts.findFirst({
      where: { id: params.id, vendorId: auth.vendorId },
    });
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    if (account.isPrimary) {
      return NextResponse.json({ error: 'Cannot delete the primary account. Set another account as primary first.' }, { status: 400 });
    }

    await prisma.vendor_bank_accounts.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Account removed' });
  } catch (error: any) {
    logger.error('Delete vendor bank account error', error);
    return NextResponse.json({ error: 'Failed to remove account', details: error?.message }, { status: 500 });
  }
}
