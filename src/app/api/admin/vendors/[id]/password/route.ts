// @ts-nocheck
// Admin/Manager-set vendor password.
//
// Used when a vendor forgets their password and contacts support, or when
// onboarding needs a fresh credential before the vendor logs in. The new
// password is bcrypted server-side; the plaintext only exists in the
// request body and is never persisted.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, name: true, email: true },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id: vendorId } = await params;
    const body = await request.json();
    const password: string = body?.password;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    if (password.length > 128) {
      return NextResponse.json({ error: 'Password is too long' }, { status: 400 });
    }

    const vendor = await prisma.vendors.findUnique({
      where: { id: vendorId },
      select: { id: true, email: true, businessName: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.vendors.update({
      where: { id: vendorId },
      data: { password: hashed },
    });

    // Audit — log who set the password and which vendor. We deliberately do
    // NOT log the plaintext (or the hash) here.
    logger.info('Vendor password set by admin/manager', {
      vendorId,
      vendorEmail: vendor.email,
      actorId: currentUser.id,
      actorRole: currentUser.role,
      actorEmail: currentUser.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error: any) {
    logger.error('Set vendor password error', error);
    return NextResponse.json(
      { error: 'Failed to set password', details: error?.message },
      { status: 500 }
    );
  }
}
