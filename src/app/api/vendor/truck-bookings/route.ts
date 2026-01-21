// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Map mobile app status tabs to database status values
const mobileStatusMappings: Record<string, string[]> = {
  pending: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED'],
  confirmed: ['ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED'],
  ongoing: ['LOADING', 'IN_TRANSIT', 'UNLOADING'],
  completed: ['COMPLETED'],
  cancelled: ['CANCELLED'],
};

// GET - Get Truck Bookings for vendor
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const vendor = await prisma.vendors.findFirst({
      where: { id: auth.vendorId },
      select: { id: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Mobile app status: 'all', 'pending', 'confirmed', 'ongoing', 'completed'
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let whereClause: any = { vendorId: vendor.id }; // Fixed: was vendorId instead of vendor.id

    // Handle mobile app status parameter (priority over type)
    if (status && status !== 'all' && mobileStatusMappings[status]) {
      whereClause.status = { in: mobileStatusMappings[status] };
    } else if (type === 'pending') {
      whereClause.status = { in: ['PENDING_PAYMENT'] };
    } else if (type === 'confirmed') {
      whereClause.status = { in: ['ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED'] };
    } else if (type === 'active') {
      whereClause.status = { in: ['LOADING', 'IN_TRANSIT', 'UNLOADING'] };
    } else if (type === 'completed') {
      whereClause.status = 'COMPLETED';
    }

    const [bookings, total] = await Promise.all([
      prisma.truck_bookings.findMany({
        where: whereClause,
        include: { truck_quote_requests: { select: { id: true, requestNumber: true } } },
        orderBy: [{ pickupDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.truck_bookings.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        serviceType: b.serviceType,
        vehicleCategory: b.vehicleCategory,
        vehicleName: b.vehicleName,
        goodsType: b.goodsType,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        pickupCity: b.pickupCity,
        dropCity: b.dropCity,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        totalAmount: b.totalAmount,
        advanceAmount: b.advanceAmount,
        advancePaid: b.advancePaid,
        status: b.status,
        paymentStatus: b.paymentStatus,
        driverName: b.driverName,
        driverPhone: b.driverPhone,
        vehicleNumber: b.vehicleNumber,
        loadingOtp: b.loadingOtp,
        deliveryOtp: b.deliveryOtp,
        quoteRequest: b.truck_quote_requests,
        createdAt: b.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor truck bookings', error);
    return NextResponse.json({ error: 'Failed to fetch bookings', details: error?.message }, { status: 500 });
  }
}

// POST - Get stats
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);

    if (!auth.authenticated || !auth.vendorId) {

      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    }

    const vendorId = auth.vendorId;

    const [pending, confirmed, active, completed, totalEarnings] = await Promise.all([
      prisma.truck_bookings.count({ where: { vendorId: vendorId, status: { in: ['PENDING_PAYMENT', 'ADVANCE_PAID'] } } }),
      prisma.truck_bookings.count({ where: { vendorId: vendorId, status: { in: ['CONFIRMED', 'VEHICLE_ASSIGNED'] } } }),
      prisma.truck_bookings.count({ where: { vendorId: vendorId, status: { in: ['LOADING', 'IN_TRANSIT', 'UNLOADING'] } } }),
      prisma.truck_bookings.count({ where: { vendorId: vendorId, status: 'COMPLETED' } }),
      prisma.truck_bookings.aggregate({ where: { vendorId: vendorId, status: 'COMPLETED' }, _sum: { totalAmount: true } }),
    ]);

    return NextResponse.json({
      success: true,
      stats: { pending, confirmed, active, completed, totalEarnings: totalEarnings._sum.totalAmount || 0 },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor truck booking stats', error);
    return NextResponse.json({ error: 'Failed to fetch stats', details: error?.message }, { status: 500 });
  }
}
