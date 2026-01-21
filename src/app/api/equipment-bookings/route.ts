// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List Equipment Bookings for a customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    const status = searchParams.get('status');
    const bookingNumber = searchParams.get('bookingNumber');

    if (!customerId && !phone && !email) {
      return NextResponse.json({ error: 'Customer ID, phone, or email required' }, { status: 400 });
    }

    const whereClause: any = {};
    if (customerId) whereClause.customerId = customerId;
    else if (phone) whereClause.customerPhone = phone;
    else if (email) whereClause.customerEmail = email;
    if (status && status !== 'all') whereClause.status = status;
    if (bookingNumber) whereClause.bookingNumber = bookingNumber;

    const bookings = await prisma.equipment_bookings.findMany({
      where: whereClause,
      include: { vendors: { select: { id: true, businessName: true, phone: true, rating: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // If searching by bookingNumber and found exactly one, return as single booking
    if (bookingNumber && bookings.length === 1) {
      const b = bookings[0];
      return NextResponse.json({
        success: true,
        booking: {
          id: b.id,
          bookingNumber: b.bookingNumber,
          equipmentCategory: b.equipmentCategory,
          equipmentType: b.equipmentType,
          equipmentModel: b.equipmentModel,
          quantity: b.quantity,
          deliveryLocation: b.deliveryCity,
          deliveryAddress: b.deliveryAddress,
          startDate: b.startDate,
          endDate: b.endDate,
          totalAmount: b.totalAmount,
          advanceAmount: b.advanceAmount,
          status: b.status,
          paymentStatus: b.paymentStatus,
          operatorName: b.operatorName,
          operatorPhone: b.operatorPhone,
          rating: b.rating,
          vendor: b.vendors ? { name: b.vendors.businessName, phone: b.vendors.phone, rating: b.vendors.rating } : null,
          createdAt: b.createdAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        equipmentCategory: b.equipmentCategory,
        equipmentType: b.equipmentType,
        equipmentModel: b.equipmentModel,
        quantity: b.quantity,
        deliveryLocation: b.deliveryCity,
        deliveryAddress: b.deliveryAddress,
        startDate: b.startDate,
        endDate: b.endDate,
        totalAmount: b.totalAmount,
        advanceAmount: b.advanceAmount,
        status: b.status,
        paymentStatus: b.paymentStatus,
        operatorName: b.operatorName,
        operatorPhone: b.operatorPhone,
        rating: b.rating,
        vendor: b.vendor ? { name: b.vendor.businessName, phone: b.vendor.phone, rating: b.vendor.rating } : null,
        createdAt: b.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch equipment bookings', error);
    return NextResponse.json({ error: 'Failed to fetch bookings', details: error?.message }, { status: 500 });
  }
}
