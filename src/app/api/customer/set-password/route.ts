// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Generate a simple token
function generateToken(customerId: string | number): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  return `tr_${customerId}_${timestamp}_${random}`;
}

// POST - Set password for new/existing customer without password
export async function POST(request: NextRequest) {
  try {
    const { email, phone, password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Find customer by email or phone
    const conditions: any[] = [];
    if (email) conditions.push({ email: email.toLowerCase().trim() });
    if (phone) conditions.push({ phone: phone.trim() });

    if (conditions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Email or phone is required' },
        { status: 400 }
      );
    }

    const customer = await prisma.customers.findFirst({
      where: { OR: conditions },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if customer already has a password
    if (customer.password) {
      return NextResponse.json(
        { success: false, message: 'Password already set. Please login instead.' },
        { status: 400 }
      );
    }

    // Hash and set password
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.customers.update({
      where: { id: customer.id },
      data: { password: hashedPassword },
    });

    // Generate token and log them in
    const token = generateToken(customer.id);

    return NextResponse.json({
      success: true,
      message: 'Password set successfully',
      token,
      customers: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error: any) {
    logger.error('Failed to set password', error);
    return NextResponse.json(
      { success: false, message: 'Failed to set password', details: error?.message },
      { status: 500 }
    );
  }
}
