// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
export const dynamic = 'force-dynamic';

// Map mobile app status tabs to database status values
const mobileStatusMappings: Record<string, string[]> = {
  pending: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PENDING_VENDOR', 'BROADCASTED'],
  confirmed: ['ACCEPTED'],
  ongoing: ['IN_PROGRESS'],
  completed: ['COMPLETED'],
  cancelled: ['CANCELLED', 'EXPIRED', 'REFUNDED'],
};

// GET - Fetch Self-Drive car bookings for the logged-in vendor
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId!;


    // Get vendor with approved locations
    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: {
        id: true,
        vendor_approved_locations: { where: { isActive: true }, select: { locationId: true } },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get approved location IDs for this vendor
    const approvedLocationIds = vendor.vendor_approved_locations.map((l) => l.locationId);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'direct', 'open', 'accepted', 'completed', 'all'
    const status = searchParams.get('status'); // Mobile app status: 'all', 'pending', 'confirmed', 'ongoing', 'completed'

    // PAGINATION PARAMS
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // DATE FILTER PARAMS
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search')?.trim() || '';

    // SEARCH FILTER — built as an AND-able block
    const searchAnd: any[] = search
      ? [{ OR: [
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
          { bookingNumber: { contains: search } },
        ]}]
      : [];

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day (23:59:59)
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        dateFilter.createdAt.lte = endDateTime;
      }
    }

    let whereClause: any = {};

    // Handle status parameter from mobile app (priority over type parameter)
    // Only quote-based self-drive bookings (direct car bookings go to car-rental section)
    const quoteBased = { quoteRequestId: { not: null } };

    if (status && status !== 'all' && mobileStatusMappings[status]) {
      const dbStatuses = mobileStatusMappings[status];

      whereClause = {
        ...dateFilter,
        AND: [
          quoteBased,
          ...searchAnd,
          { OR: [
            { acceptedVendorId: vendor.id, status: { in: dbStatuses } },
            { assignedVendorId: vendor.id, status: { in: dbStatuses } },
            ...(status === 'pending' ? [{
              status: { in: dbStatuses },
              locationId: { in: approvedLocationIds },
              OR: [
                { assignedVendorId: null },
                { assignedVendorId: vendor.id },
              ],
            }] : []),
          ]},
        ],
      };
    } else if (type === 'open') {
      whereClause = {
        ...dateFilter,
        AND: [
          quoteBased,
          ...searchAnd,
          { status: 'BROADCASTED', locationId: { in: approvedLocationIds } },
        ],
      };
    } else if (type === 'accepted') {
      whereClause = {
        ...dateFilter,
        AND: [
          quoteBased,
          ...searchAnd,
          { acceptedVendorId: vendor.id, status: { in: ['ACCEPTED', 'IN_PROGRESS'] } },
        ],
      };
    } else if (type === 'completed') {
      whereClause = {
        ...dateFilter,
        AND: [
          quoteBased,
          ...searchAnd,
          { acceptedVendorId: vendor.id, status: 'COMPLETED' },
        ],
      };
    } else {
      whereClause = {
        ...dateFilter,
        AND: [
          quoteBased,
          ...searchAnd,
          { OR: [
            { acceptedVendorId: vendor.id },
            { assignedVendorId: vendor.id },
            {
              status: { in: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED'] },
              locationId: { in: approvedLocationIds },
            },
          ]},
        ],
      };
    }

    const [bookings, total] = await Promise.all([
      prisma.car_bookings.findMany({
        where: whereClause,
        include: {
          locations: { select: { name: true, slug: true } },
          customers: { select: { id: true, name: true, phone: true } },
          self_drive_quote_requests: { select: { numberOfVehicles: true } },
        },
        orderBy: [
          { responseDeadline: 'asc' }, // Urgent first
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.car_bookings.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        customerEmail: b.customerEmail,
        vehicleName: b.requestedVehicleName,
        vehicleBrand: b.requestedBrand,
        chauffeur_vehicle_categories: b.requestedCategory,
        vehicleType: b.requestedVehicleType,
        transmission: b.requestedTransmission,
        fuelType: b.requestedFuelType,
        seats: b.requestedSeats,
        numberOfVehicles: b.self_drive_quote_requests?.numberOfVehicles ?? null,
        location: b.locations,
        locationName: b.locationName,
        pickupAddress: b.pickupAddress,
        dropAddress: b.dropAddress,
        isDeliveryRequested: b.isDeliveryRequested,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        dropDate: b.dropDate,
        dropTime: b.dropTime,
        totalDays: b.totalDays,
        dailyRate: b.dailyRate,
        baseAmount: b.baseAmount,
        gstAmount: b.gstAmount,
        grandTotal: b.grandTotal,
        securityDeposit: b.securityDeposit,
        kmLimitPerDay: b.kmLimitPerDay,
        extraKmRate: b.extraKmRate,
        licenseNumber: b.licenseNumber,
        licenseVerified: b.licenseVerified,
        status: b.status,
        paymentStatus: b.paymentStatus,
        responseDeadline: b.responseDeadline,
        broadcastedAt: b.broadcastedAt,
        acceptedAt: b.acceptedAt,
        customerNotes: b.customerNotes,
        createdAt: b.createdAt,
        droppedAt: b.droppedAt,
        dropReason: b.dropReason,
        isDirectRequest: b.assignedVendorId === vendor.id,
        isAccepted: b.acceptedVendorId === vendor.id,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor car bookings', error);
    console.error('[Self-Drive Bookings Error]', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      {
        error: 'Failed to fetch bookings',
        details: error?.message,
        errorName: error?.name,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// POST - Get stats for vendor Self-Drive dashboard
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId!;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: {
        id: true,
        vendor_approved_locations: { where: { isActive: true }, select: { locationId: true } },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const approvedLocationIds = vendor.vendor_approved_locations.map((l) => l.locationId);

    // Get counts
    const [directCount, openCount, acceptedCount, inProgressCount, completedCount, totalEarnings] = await Promise.all([
      prisma.car_bookings.count({
        where: {
          assignedVendorId: vendor.id,
          status: 'PENDING_VENDOR',
        },
      }),
      prisma.car_bookings.count({
        where: {
          status: 'BROADCASTED',
          locationId: { in: approvedLocationIds },
        },
      }),
      prisma.car_bookings.count({
        where: {
          acceptedVendorId: vendor.id,
          status: 'ACCEPTED',
        },
      }),
      prisma.car_bookings.count({
        where: {
          acceptedVendorId: vendor.id,
          status: 'IN_PROGRESS',
        },
      }),
      prisma.car_bookings.count({
        where: {
          acceptedVendorId: vendor.id,
          status: 'COMPLETED',
        },
      }),
      prisma.car_bookings.aggregate({
        where: {
          acceptedVendorId: vendor.id,
          status: 'COMPLETED',
          paymentStatus: 'PAID',
        },
        _sum: {
          grandTotal: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        directRequests: directCount,
        openRequests: openCount,
        accepted: acceptedCount,
        inProgress: inProgressCount,
        completed: completedCount,
        totalEarnings: totalEarnings._sum.grandTotal || 0,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor car booking stats', error);
    console.error('[Self-Drive Stats Error]', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      {
        error: 'Failed to fetch stats',
        details: error?.message,
        errorName: error?.name,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
