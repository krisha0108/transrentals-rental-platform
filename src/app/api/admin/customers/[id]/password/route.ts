import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// PUT /api/admin/customers/[id]/password
// Admin/Manager sets a new password for a customer (support flow).
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

    const { id: customerId } = await params;
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

    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: { id: true, email: true, name: true },
    });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.customers.update({
      where: { id: customerId },
      data: { password: hashed },
    });

    logger.info('Customer password set by admin', {
      customerId,
      customerEmail: customer.email,
      actorId: currentUser.id,
      actorRole: currentUser.role,
      actorEmail: currentUser.email,
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    logger.error('Set customer password error', error);
    return NextResponse.json(
      { error: 'Failed to set password', details: error?.message },
      { status: 500 }
    );
  }
}
