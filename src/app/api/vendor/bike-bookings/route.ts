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
  pending: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'PENDING_VENDOR', 'BROADCASTED'],
  confirmed: ['ACCEPTED'],
  ongoing: ['IN_PROGRESS'],
  completed: ['COMPLETED'],
  cancelled: ['CANCELLED', 'EXPIRED', 'REFUNDED'],
};

// GET - Fetch bike bookings for the logged-in vendor
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId!;


    // Get vendor by ID
    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: {
        id: true,
        vendor_approved_locations: { select: { locationId: true } },
        vendor_fleets: {
          where: { isActive: true },
          select: {
            vendor_fleet_locations: { select: { locationId: true } },
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get location IDs from both approved locations AND fleet locations
    const approvedLocationIds = vendor.vendor_approved_locations.map((l) => l.locationId);
    const fleetLocationIds = vendor.vendor_fleets
      .flatMap((f) => f.vendor_fleet_locations.map((fl) => fl.locationId));

    // Combine and deduplicate
    const allLocationIds = [...new Set([...approvedLocationIds, ...fleetLocationIds])];

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'direct', 'open', 'accepted', 'all'
    const status = searchParams.get('status'); // Mobile app status: 'all', 'pending', 'confirmed', 'ongoing', 'completed'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // DATE FILTER PARAMS
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // DATE FILTERING
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
    if (status && status !== 'all' && mobileStatusMappings[status]) {
      // Map mobile status to database statuses
      const dbStatuses = mobileStatusMappings[status];

      whereClause = {
        ...dateFilter,
        OR: [
          // Show bookings accepted by this vendor with matching status
          {
            acceptedVendorId: vendor.id,
            status: { in: dbStatuses },
          },
          // Show bookings assigned directly to this vendor with matching status
          {
            assignedVendorId: vendor.id,
            status: { in: dbStatuses },
          },
          // For pending status, also show open/broadcasted bookings in vendor's locations
          ...(status === 'pending' ? [{
            status: { in: dbStatuses },
            locationId: { in: allLocationIds },
            OR: [
              { assignedVendorId: null },
              { assignedVendorId: vendor.id },
            ],
          }] : []),
        ],
      };
    } else if (type === 'direct') {
      // Direct requests - booking was assigned to this vendor
      whereClause = {
        assignedVendorId: vendor.id,
        status: 'PENDING_VENDOR',
        ...dateFilter,
      };
    } else if (type === 'open') {
      // Open/Broadcasted requests - available to all vendors in their service locations
      // BROADCASTED with no vendor assigned: show to all in location
      // PAYMENT_VERIFIED: only show to the specific assigned vendor (not all vendors)
      whereClause = {
        ...dateFilter,
        OR: [
          // Unassigned broadcasted/pending: visible to all vendors in location
          {
            status: { in: ['BROADCASTED', 'PENDING_VENDOR'] },
            assignedVendorId: null,
            locationId: { in: allLocationIds },
          },
          // Assigned specifically to this vendor: show regardless of status
          {
            status: { in: ['BROADCASTED', 'PAYMENT_VERIFIED', 'PENDING_VENDOR'] },
            assignedVendorId: vendor.id,
          },
        ],
      };
    } else if (type === 'accepted') {
      // Accepted by this vendor
      whereClause = {
        acceptedVendorId: vendor.id,
        status: { in: ['ACCEPTED', 'IN_PROGRESS'] },
        ...dateFilter,
      };
    } else if (type === 'completed') {
      whereClause = {
        acceptedVendorId: vendor.id,
        status: 'COMPLETED',
        ...dateFilter,
      };
    } else {
      // All bookings related to this vendor (default for 'all' or no filter)
      whereClause = {
        ...dateFilter,
        OR: [
          // Bookings accepted by this vendor
          { acceptedVendorId: vendor.id },
          // Direct assignments to this vendor
          { assignedVendorId: vendor.id },
          // Open bookings in vendor's locations (pending, broadcasted, payment verified)
          {
            status: { in: ['BROADCASTED', 'PAYMENT_VERIFIED', 'PENDING_VENDOR', 'PENDING_PAYMENT', 'PAYMENT_SUBMITTED'] },
            locationId: { in: allLocationIds },
            OR: [
              { assignedVendorId: null },
              { assignedVendorId: vendor.id },
            ],
          },
        ],
      };
    }

    const [bookings, total] = await Promise.all([
      prisma.bike_bookings.findMany({
        where: whereClause,
        include: {
          locations: { select: { name: true, slug: true } },
          customers: { select: { id: true, name: true, phone: true } },
          bike_quote_requests: { select: { pickupAddress: true, numberOfVehicles: true } },
        },
        orderBy: [
          { responseDeadline: 'asc' }, // Urgent first
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.bike_bookings.count({ where: whereClause }),
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
        vehicleId: b.requestedVehicleId,
        locationId: b.locationId,
        location: b.locations,
        locationName: b.locationName,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        dropDate: b.dropDate,
        dropTime: b.dropTime,
        totalDays: b.totalDays,
        dailyRate: b.dailyRate,
        totalAmount: b.totalAmount,
        gstAmount: b.gstAmount,
        securityDeposit: b.securityDeposit,
        grandTotal: b.grandTotal,
        helmetsRequired: b.helmetsRequired,
        numberOfVehicles: b.bike_quote_requests?.numberOfVehicles || null,
        pickupAddress: b.bike_quote_requests?.pickupAddress || null,
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
    logger.error('Failed to fetch vendor bike bookings', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Get stats for vendor dashboard
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
        vendor_approved_locations: { select: { locationId: true } },
        fleets: {
          where: { isActive: true },
          select: {
            vendor_fleet_locations: { select: { locationId: true } },
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get location IDs from both approved locations AND fleet locations
    const approvedLocationIds = vendor.vendor_approved_locations.map((l) => l.locationId);
    const fleetLocationIds = vendor.fleets
      .flatMap((f) => f.vendor_fleet_locations.map((fl) => fl.locationId));
    const allLocationIds = [...new Set([...approvedLocationIds, ...fleetLocationIds])];

    // Get counts
    const [directCount, openCount, acceptedCount, inProgressCount, completedCount, totalEarnings] = await Promise.all([
      prisma.bike_bookings.count({
        where: {
          assignedVendorId: vendor.id,
          status: 'PENDING_VENDOR',
        },
      }),
      prisma.bike_bookings.count({
        where: {
          OR: [
            // Open/broadcasted bookings visible to all vendors in location (unassigned only)
            {
              status: 'BROADCASTED',
              locationId: { in: allLocationIds },
            },
            // PAYMENT_VERIFIED — only count if assigned to THIS vendor (quote-based booking)
            {
              status: 'PAYMENT_VERIFIED',
              assignedVendorId: vendor.id,
            },
            {
              status: 'PENDING_VENDOR',
              assignedVendorId: null,
              locationId: { in: allLocationIds },
            },
          ],
        },
      }),
      prisma.bike_bookings.count({
        where: {
          acceptedVendorId: vendor.id,
          status: 'ACCEPTED',
        },
      }),
      prisma.bike_bookings.count({
        where: {
          acceptedVendorId: vendor.id,
          status: 'IN_PROGRESS',
        },
      }),
      prisma.bike_bookings.count({
        where: {
          acceptedVendorId: vendor.id,
          status: 'COMPLETED',
        },
      }),
      prisma.bike_bookings.aggregate({
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
    logger.error('Failed to fetch vendor bike booking stats', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error?.message },
      { status: 500 }
    );
  }
}
