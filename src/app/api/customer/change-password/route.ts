import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// POST - Set or change customer password
export async function POST(request: NextRequest) {
  try {
    const { customer_id, newPassword } = await request.json();

    if (!customer_id) {
      return NextResponse.json({ success: false, message: 'Customer ID is required' }, { status: 400 });
    }
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ success: false, message: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const customer = await prisma.customers.findUnique({ where: { id: customer_id } });
    if (!customer) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.customers.update({
      where: { id: customer_id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: customer.password ? 'Password changed successfully' : 'Password set successfully',
    });
  } catch (error: any) {
    logger.error('Failed to change password', error);
    return NextResponse.json({ success: false, message: 'Failed to update password' }, { status: 500 });
  }
}
