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
  pending: ['PENDING_PAYMENT', 'PENDING_VENDOR', 'BROADCASTED'],
  confirmed: ['ACCEPTED', 'DRIVER_ASSIGNED'],
  ongoing: ['IN_PROGRESS'],
  completed: ['COMPLETED'],
  cancelled: ['CANCELLED', 'EXPIRED', 'REFUNDED'],
};

// GET - Get Car Booking (with driver) bookings for vendor
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
    const status = searchParams.get('status'); // Mobile app status: 'all', 'pending', 'confirmed', 'ongoing', 'completed'
    const tripType = searchParams.get('tripType');
    const type = searchParams.get('type'); // 'direct', 'open', 'accepted', 'completed', 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    // Handle status parameter from mobile app (priority over type parameter)
    if (status && status !== 'all' && mobileStatusMappings[status]) {
      // Map mobile status to database statuses
      const dbStatuses = mobileStatusMappings[status];

      whereClause = {
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
          // For pending status, also show open/broadcasted bookings (no location filter for car rental)
          ...(status === 'pending' ? [{
            status: { in: dbStatuses },
            acceptedVendorId: null,
          }] : []),
        ],
      };
    } else if (type === 'direct') {
      // Direct requests - booking was assigned to this vendor
      whereClause = {
        assignedVendorId: vendor.id,
        status: 'PENDING_VENDOR',
      };
    } else if (type === 'open') {
      // Open/Broadcasted requests - available to all vendors (no location restriction for car rental)
      // Exclude bookings that have already been accepted
      whereClause = {
        status: 'BROADCASTED',
        acceptedVendorId: null,
      };
    } else if (type === 'accepted') {
      // Accepted by this vendor (including active)
      whereClause = {
        acceptedVendorId: vendor.id,
        status: { in: ['ACCEPTED', 'DRIVER_ASSIGNED', 'IN_PROGRESS'] },
      };
    } else if (type === 'completed') {
      whereClause = {
        acceptedVendorId: vendor.id,
        status: 'COMPLETED',
      };
    } else {
      // All bookings related to this vendor (default for 'all' or no filter)
      // For car rental (chauffeur service), show all available bookings + vendor's own bookings
      whereClause = {
        OR: [
          // Bookings accepted by this vendor
          { acceptedVendorId: vendor.id },
          // Direct assignments to this vendor
          { assignedVendorId: vendor.id },
          // Available bookings (broadcasted to all vendors, no location restriction)
          {
            status: { in: ['BROADCASTED', 'PENDING_VENDOR'] },
            acceptedVendorId: null,
          },
        ],
      };
    }

    // Trip type filter
    if (tripType && tripType !== 'all') {
      whereClause.tripType = tripType;
    }

    const [bookings, total] = await Promise.all([
      prisma.chauffeur_bookings.findMany({
        where: whereClause,
        include: {
          locations: { select: { name: true, slug: true } },
          customers: { select: { id: true, name: true, phone: true } },
        },
        orderBy: [
          { createdAt: 'desc' }, // Newest first
          { responseDeadline: 'asc' }, // Then urgent
        ],
        skip,
        take: limit,
      }),
      prisma.chauffeur_bookings.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        tripType: b.tripType,
        carCategory: b.carCategory,
        carCategoryName: b.carCategoryName,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        customerEmail: b.customerEmail,
        pickupCity: b.pickupCity,
        dropCity: b.dropCity,
        pickupAddress: b.pickupAddress,
        pickupLocation: b.pickupAddress, // For mobile app compatibility
        dropAddress: b.dropAddress,
        dropLocation: b.dropAddress, // For mobile app compatibility
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        returnDate: b.returnDate,
        localPackageId: b.localPackageId,
        localPackageHours: b.localPackageHours,
        localPackageKm: b.localPackageKm,
        estimatedDistance: b.estimatedDistance,
        baseFare: b.baseFare,
        gstAmount: b.gstAmount,
        platformFee: b.platformFee,
        grandTotal: b.grandTotal,
        totalAmount: b.grandTotal, // For mobile app compatibility
        securityDeposit: b.securityDeposit,
        paidAmount: b.paidAmount,
        advancePaid: b.paidAmount, // For mobile app compatibility (uses advancePaid field name)
        partialPayment: b.partialPayment,
        status: b.status,
        paymentStatus: b.paymentStatus,
        driverName: b.driverName,
        driverPhone: b.driverPhone,
        vehicleNumber: b.vehicleNumber,
        vehicle_models: b.vehicle_models,
        responseDeadline: b.responseDeadline,
        broadcastedAt: b.broadcastedAt,
        acceptedAt: b.acceptedAt,
        tripStartOtp: b.tripStartOtp,
        tripStartedAt: b.tripStartedAt,
        tripEndedAt: b.tripEndedAt,
        rating: b.rating,
        driverRating: b.driverRating,
        customerNotes: b.customerNotes,
        location: b.locations,
        isDirectRequest: b.assignedVendorId === vendor.id,
        isAccepted: b.acceptedVendorId === vendor.id,
        createdAt: b.createdAt,
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
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Get stats for vendor Car Booking dashboard
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
      prisma.chauffeur_bookings.count({
        where: {
          assignedVendorId: vendor.id,
          status: 'PENDING_VENDOR',
        },
      }),
      prisma.chauffeur_bookings.count({
        where: {
          status: 'BROADCASTED',
          locationId: { in: approvedLocationIds },
          acceptedVendorId: null,
        },
      }),
      prisma.chauffeur_bookings.count({
        where: {
          acceptedVendorId: vendor.id,
          status: { in: ['ACCEPTED', 'DRIVER_ASSIGNED'] },
        },
      }),
      prisma.chauffeur_bookings.count({
        where: {
          acceptedVendorId: vendor.id,
          status: 'IN_PROGRESS',
        },
      }),
      prisma.chauffeur_bookings.count({
        where: {
          acceptedVendorId: vendor.id,
          status: 'COMPLETED',
        },
      }),
      prisma.chauffeur_bookings.aggregate({
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
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error?.message },
      { status: 500 }
    );
  }
}
