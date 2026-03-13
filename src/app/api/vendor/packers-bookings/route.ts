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
  confirmed: ['ADVANCE_PAID', 'CONFIRMED', 'TEAM_ASSIGNED'],
  ongoing: ['PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING'],
  completed: ['COMPLETED'],
  cancelled: ['CANCELLED'],
};

// GET - Get Packers Bookings for vendor
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

    // PAGINATION PARAMS
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // DATE FILTER PARAMS
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let whereClause: any = { vendorId: vendor.id }; // Fixed: was vendorId instead of vendor.id

    // Handle mobile app status parameter (priority over type)
    if (status && status !== 'all' && mobileStatusMappings[status]) {
      whereClause.status = { in: mobileStatusMappings[status] };
    } else if (type === 'pending') {
      whereClause.status = { in: ['PENDING_PAYMENT', 'ADVANCE_PAID'] };
    } else if (type === 'confirmed') {
      whereClause.status = { in: ['CONFIRMED', 'TEAM_ASSIGNED'] };
    } else if (type === 'active') {
      whereClause.status = { in: ['PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING'] };
    } else if (type === 'completed') {
      whereClause.status = 'COMPLETED';
    }

    // DATE FILTERING - Add to where clause
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day (23:59:59)
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = endDateTime;
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.packers_bookings.findMany({
        where: whereClause,
        include: { packers_quote_requests: { select: { id: true, requestNumber: true } } },
        orderBy: [{ scheduledDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.packers_bookings.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        serviceType: b.serviceType,
        shiftingType: b.shiftingType,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        pickupCity: b.pickupCity,
        pickupAddress: b.pickupAddress,
        pickupFloor: b.pickupFloor,
        dropCity: b.dropCity,
        dropAddress: b.dropAddress,
        dropFloor: b.dropFloor,
        scheduledDate: b.scheduledDate,
        teamSize: b.teamSize,
        totalAmount: b.totalAmount,
        advanceAmount: b.advanceAmount,
        advancePaid: b.advancePaid,
        status: b.status,
        paymentStatus: b.paymentStatus,
        teamLeaderName: b.teamLeaderName,
        teamLeaderPhone: b.teamLeaderPhone,
        packingOtp: b.packingOtp,
        loadingOtp: b.loadingOtp,
        deliveryOtp: b.deliveryOtp,
        quoteRequest: b.packers_quote_requests,
        createdAt: b.createdAt,
        droppedAt: b.droppedAt,
        dropReason: b.dropReason,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor packers bookings', error);
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
      prisma.packers_bookings.count({ where: { vendorId: auth.vendorId, status: { in: ['PENDING_PAYMENT', 'ADVANCE_PAID'] } } }),
      prisma.packers_bookings.count({ where: { vendorId: auth.vendorId, status: { in: ['CONFIRMED', 'TEAM_ASSIGNED'] } } }),
      prisma.packers_bookings.count({ where: { vendorId: auth.vendorId, status: { in: ['PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING'] } } }),
      prisma.packers_bookings.count({ where: { vendorId: auth.vendorId, status: 'COMPLETED' } }),
      prisma.packers_bookings.aggregate({ where: { vendorId: auth.vendorId, status: 'COMPLETED' }, _sum: { totalAmount: true } }),
    ]);

    return NextResponse.json({
      success: true,
      stats: { pending, confirmed, active, completed, totalEarnings: totalEarnings._sum.totalAmount || 0 },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor packers booking stats', error);
    return NextResponse.json({ error: 'Failed to fetch stats', details: error?.message }, { status: 500 });
  }
}
