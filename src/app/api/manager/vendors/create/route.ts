import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import logger from '@/lib/security/logger';
import { generateVid } from '@/lib/utils/generate-vid';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// POST - Manager/Admin creates a vendor profile on a vendor's behalf.
// Records createdById so admin can later see which manager onboarded which vendor.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!manager || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(manager.role)) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      password,
      phone,
      businessName,
      businessType,
      ownerName,
      address,
      city,
      state,
      pincode,
    } = body;

    if (!email || !password || !phone || !businessName || !ownerName) {
      return NextResponse.json(
        { error: 'Email, password, phone, business name, and owner name are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, '').slice(-10))) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    const existingEmail = await prisma.vendors.findUnique({ where: { email: email.toLowerCase() } });
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const existingPhone = await prisma.vendors.findUnique({ where: { phone } });
    if (existingPhone) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const vid = await generateVid();

    const vendor = await prisma.vendors.create({
      data: {
        id: generateId(),
        vid,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        businessName,
        businessType: businessType || null,
        ownerName,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        status: 'DOCUMENTS_PENDING',
        createdById: session.user.id,
      },
      select: {
        id: true,
        vid: true,
        email: true,
        phone: true,
        businessName: true,
        ownerName: true,
        status: true,
        createdAt: true,
      },
    });

    logger.info('Manager created vendor profile', { managerId: session.user.id, vendorId: vendor.id });

    return NextResponse.json({ success: true, vendor }, { status: 201 });
  } catch (error: any) {
    logger.error('Manager create vendor error', error);
    return NextResponse.json(
      { error: 'Failed to create vendor', details: error?.message },
      { status: 500 }
    );
  }
}
