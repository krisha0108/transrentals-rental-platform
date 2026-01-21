import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import bcrypt from 'bcryptjs';
import {
  checkRateLimit,
  RATE_LIMITS,
  logger,
} from '@/lib/security';

export const dynamic = 'force-dynamic';

// POST - Register new customer
export async function POST(request: NextRequest) {
  // Rate limiting for registration
  const { limited, resetIn } = checkRateLimit(
    request,
    RATE_LIMITS.auth,
    'customer-register'
  );

  if (limited) {
    logger.logSecurityEvent('Customer registration rate limit exceeded', 'medium', {
      ip: request.headers.get('x-forwarded-for'),
    });
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.', retryAfter: resetIn },
      { status: 429, headers: { 'Retry-After': String(resetIn) } }
    );
  }

  try {
    const { name, email, phone, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Phone format validation (if provided)
    if (phone) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone.replace(/\D/g, '').slice(-10))) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        );
      }
    }

    // Check if email already exists
    const existingCustomer = await prisma.customers.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingCustomer) {
      logger.logSecurityEvent('Customer registration with existing email', 'low', {
        email: email.toLowerCase(),
      });
      return NextResponse.json(
        { error: 'Email already registered. Please login instead.' },
        { status: 400 }
      );
    }

    // Check if phone already exists (if provided)
    if (phone) {
      const existingPhone = await prisma.customers.findFirst({
        where: { phone },
      });

      if (existingPhone) {
        logger.logSecurityEvent('Customer registration with existing phone', 'low', {
          phone: phone.slice(-4),
        });
        return NextResponse.json(
          { error: 'Phone number already registered.' },
          { status: 400 }
        );
      }
    }

    // Hash password with strong cost factor
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create customer
    const customer = await prisma.customers.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        password: hashedPassword,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    logger.info('Customer registered successfully', { customerId: customer.id });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      customer,
    });
  } catch (error: unknown) {
    logger.error('Failed to register customer', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
