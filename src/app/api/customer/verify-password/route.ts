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

// POST - Verify customer password
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find customer
    const customer = await prisma.customers.findFirst({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        password: true,
        isActive: true,
        isBanned: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    if (!customer.password) {
      return NextResponse.json(
        { error: 'Please set up your password first' },
        { status: 400 }
      );
    }

    if (!customer.isActive || customer.isBanned) {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, customer.password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid password' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken(customer.id);

    return NextResponse.json({
      success: true,
      message: 'Password verified',
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error: any) {
    logger.error('Failed to verify password', error);
    return NextResponse.json(
      { error: 'Failed to verify password', details: error?.message },
      { status: 500 }
    );
  }
}
