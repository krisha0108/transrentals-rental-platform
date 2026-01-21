// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - List Truck Bookings for a customer
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

    const bookings = await prisma.truck_bookings.findMany({
      where: whereClause,
      include: {
        vendors: { select: { id: true, businessName: true, phone: true, rating: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        serviceType: b.serviceType,
        chauffeur_vehicle_categories: b.vehicle_category,
        vehicleName: b.vehicleName,
        goodsType: b.goodsType,
        pickupCity: b.pickupCity,
        dropCity: b.dropCity,
        pickupDate: b.pickupDate,
        totalAmount: b.totalAmount,
        advanceAmount: b.advanceAmount,
        status: b.status,
        paymentStatus: b.paymentStatus,
        driverName: b.driverName,
        driverPhone: b.driverPhone,
        vehicleNumber: b.vehicleNumber,
        rating: b.rating,
        vendor: b.vendors ? { name: b.vendors.businessName, phone: b.vendors.phone, rating: b.vendors.rating } : null,
        createdAt: b.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch truck bookings', error);
    return NextResponse.json({ error: 'Failed to fetch bookings', details: error?.message }, { status: 500 });
  }
}
