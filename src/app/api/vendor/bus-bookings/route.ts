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
  ongoing: ['IN_PROGRESS'],
  completed: ['COMPLETED'],
  cancelled: ['CANCELLED'],
};

// GET - Get Bus Bookings for vendor
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      logger.warn('Unauthorized vendor access attempt', { error: auth.error });
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const vendorId = auth.vendorId;
    logger.info('Fetching bus bookings for vendor', { vendorId });

    // Get vendor
    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: { id: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Mobile app status: 'all', 'pending', 'confirmed', 'ongoing', 'completed'
    const type = searchParams.get('type'); // 'pending', 'confirmed', 'active', 'completed', 'all'

    // PAGINATION PARAMS
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // DATE FILTER PARAMS
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search')?.trim() || '';

    // SEARCH FILTER
    const searchFilter: any = search
      ? {
          OR: [
            { customerName: { contains: search } },
            { customerPhone: { contains: search } },
            { customerEmail: { contains: search } },
            { bookingNumber: { contains: search } },
            { pickupCity: { contains: search } },
            { dropCity: { contains: search } },
          ],
        }
      : {};

    let whereClause: any = {
      vendorId: vendor.id,
      ...searchFilter,
    };

    // DATE FILTERING
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = endDateTime;
      }
    }

    // Handle mobile app status parameter (priority over type)
    if (status && status !== 'all' && mobileStatusMappings[status]) {
      whereClause.status = { in: mobileStatusMappings[status] };
    } else if (type === 'pending') {
      // Pending payment, payment submitted, or advance paid
      whereClause.status = { in: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID'] };
    } else if (type === 'confirmed') {
      // Confirmed and vehicle assigned
      whereClause.status = { in: ['ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED'] };
    } else if (type === 'active') {
      // Trips in progress
      whereClause.status = 'IN_PROGRESS';
    } else if (type === 'completed') {
      whereClause.status = 'COMPLETED';
    } else if (type === 'cancelled') {
      whereClause.status = 'CANCELLED';
    }

    const [bookings, total] = await Promise.all([
      prisma.bus_bookings.findMany({
        where: whereClause,
        include: {
          bus_quote_requests: {
            select: {
              id: true,
              requestNumber: true,
            },
          },
        },
        orderBy: [
          { pickupDate: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.bus_bookings.count({ where: whereClause }),
    ]);

    logger.info('Bus bookings fetched successfully', {
      vendorId,
      type,
      status,
      total,
      returned: bookings.length
    });

    return NextResponse.json({
      success: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        tripType: b.tripType,
        vehicleCategory: b.vehicleCategory,
        vehicleName: b.vehicleName,
        passengers: b.passengers,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        customerEmail: b.customerEmail,
        pickupCity: b.pickupCity,
        pickupAddress: b.pickupAddress,
        dropCity: b.dropCity,
        dropAddress: b.dropAddress,
        routeDetails: b.routeDetails,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        returnDate: b.returnDate,
        returnTime: b.returnTime,
        tripDays: b.tripDays,
        baseAmount: b.baseAmount,
        totalAmount: b.totalAmount,
        advanceAmount: b.advanceAmount,
        advancePaid: b.advancePaid,
        balanceAmount: b.balanceAmount,
        status: b.status,
        paymentStatus: b.paymentStatus,
        driverName: b.driverName,
        driverPhone: b.driverPhone,
        vehicleNumber: b.vehicleNumber,
        vehicleModel: b.vehicleModel,
        tripStartOtp: b.tripStartOtp,
        tripStartedAt: b.tripStartedAt,
        tripEndedAt: b.tripEndedAt,
        rating: b.rating,
        customerNotes: b.customerNotes,
        quoteRequest: b.bus_quote_requests,
        createdAt: b.createdAt,
        droppedAt: b.droppedAt,
        dropReason: b.dropReason,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor bus bookings', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Get stats for vendor Bus Booking dashboard
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    // Get counts
    const [
      pendingCount,
      confirmedCount,
      activeCount,
      completedCount,
      cancelledCount,
      totalEarnings,
    ] = await Promise.all([
      prisma.bus_bookings.count({
        where: {
          vendorId: vendorId,
          status: { in: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID'] },
        },
      }),
      prisma.bus_bookings.count({
        where: {
          vendorId: vendorId,
          status: { in: ['CONFIRMED', 'VEHICLE_ASSIGNED'] },
        },
      }),
      prisma.bus_bookings.count({
        where: {
          vendorId: vendorId,
          status: 'IN_PROGRESS',
        },
      }),
      prisma.bus_bookings.count({
        where: {
          vendorId: vendorId,
          status: 'COMPLETED',
        },
      }),
      prisma.bus_bookings.count({
        where: {
          vendorId: vendorId,
          status: 'CANCELLED',
        },
      }),
      prisma.bus_bookings.aggregate({
        where: {
          vendorId: vendorId,
          status: 'COMPLETED',
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    // Get upcoming trips (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingTrips = await prisma.bus_bookings.count({
      where: {
        vendorId: vendorId,
        status: { in: ['CONFIRMED', 'VEHICLE_ASSIGNED'] },
        pickupDate: {
          gte: new Date(),
          lte: nextWeek,
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        pending: pendingCount,
        confirmed: confirmedCount,
        active: activeCount,
        completed: completedCount,
        cancelled: cancelledCount,
        upcomingTrips,
        totalEarnings: totalEarnings._sum.totalAmount || 0,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor bus booking stats', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error?.message },
      { status: 500 }
    );
  }
}
