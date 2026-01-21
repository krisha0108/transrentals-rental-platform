// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List Packers Bookings for a customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    const status = searchParams.get('status');

    if (!customerId && !phone && !email) {
      return NextResponse.json({ error: 'Customer ID, phone, or email required' }, { status: 400 });
    }

    const whereClause: any = {};
    if (customerId) whereClause.customerId = customerId;
    else if (phone) whereClause.customerPhone = phone;
    else if (email) whereClause.customerEmail = email;
    if (status && status !== 'all') whereClause.status = status;

    const bookings = await prisma.packers_bookings.findMany({
      where: whereClause,
      include: { vendors: { select: { id: true, businessName: true, phone: true, rating: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        serviceType: b.serviceType,
        shiftingType: b.shiftingType,
        pickupCity: b.pickupCity,
        dropCity: b.dropCity,
        scheduledDate: b.scheduledDate,
        totalAmount: b.totalAmount,
        advanceAmount: b.advanceAmount,
        status: b.status,
        paymentStatus: b.paymentStatus,
        teamLeaderName: b.teamLeaderName,
        teamLeaderPhone: b.teamLeaderPhone,
        rating: b.rating,
        vendor: b.vendors ? { name: b.vendors.businessName, phone: b.vendors.phone, rating: b.vendors.rating } : null,
        createdAt: b.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch packers bookings', error);
    return NextResponse.json({ error: 'Failed to fetch bookings', details: error?.message }, { status: 500 });
  }
}
