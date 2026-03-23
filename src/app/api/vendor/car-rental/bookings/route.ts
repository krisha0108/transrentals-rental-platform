import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';



import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List car rental bookings for vendor
export async function GET(request: NextRequest) {
  try {
    // Get current vendor session
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const vendorId = auth.vendorId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tripType = searchParams.get('tripType');
    const search = searchParams.get('search');

    // PAGINATION PARAMS
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // DATE FILTER PARAMS
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where conditions
    let whereConditions: any[] = [];

    // Base filters that apply to all queries
    const baseFilters: any = {};

    if (tripType && tripType !== 'all') {
      baseFilters.tripType = tripType;
    }

    // DATE FILTERING - Add to base filters
    if (startDate || endDate) {
      baseFilters.createdAt = {};
      if (startDate) {
        baseFilters.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day (23:59:59)
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        baseFilters.createdAt.lte = endDateTime;
      }
    }

    // Condition 1: Available bookings (PENDING_VENDOR/BROADCASTED with no acceptedVendorId)
    const availableCondition: any = {
      ...baseFilters,
      status: { in: ['PENDING_VENDOR', 'BROADCASTED'] },
      acceptedVendorId: null,
    };

    // Condition 2: This vendor's bookings (any status except PENDING_PAYMENT)
    const ownBookingsCondition: any = {
      ...baseFilters,
      acceptedVendorId: vendorId,
      status: { not: 'PENDING_PAYMENT' },
    };

    // Apply status filter
    if (status && status !== 'all') {
      if (status === 'my_bookings') {
        // Only show vendor's own bookings (any status except PENDING_PAYMENT)
        whereConditions = [{
          ...baseFilters,
          acceptedVendorId: vendorId,
          status: { not: 'PENDING_PAYMENT' },
        }];
      } else if (status === 'available') {
        // Only show available bookings (not yet accepted by any vendor)
        whereConditions = [{
          ...baseFilters,
          status: { in: ['PENDING_VENDOR', 'BROADCASTED'] },
          acceptedVendorId: null,
        }];
      } else if (['PENDING_VENDOR', 'BROADCASTED'].includes(status)) {
        // Only show available bookings with this specific status
        whereConditions = [{
          ...baseFilters,
          status,
          acceptedVendorId: null,
        }];
      } else {
        // Only show vendor's own bookings with this specific status
        whereConditions = [{
          ...baseFilters,
          status,
          acceptedVendorId: vendorId,
        }];
      }
    } else {
      // No status filter - show both available and own bookings
      whereConditions = [availableCondition, ownBookingsCondition];
    }

    // Fetch bookings with pagination
    const [bookings, total] = await Promise.all([
      prisma.chauffeur_bookings.findMany({
        where: {
          OR: whereConditions,
        },
        skip,
        take: limit,
        orderBy: [
          { createdAt: 'desc' },
        ],
        include: {
          locations: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.chauffeur_bookings.count({
        where: {
          OR: whereConditions,
        },
      }),
    ]);

    // Apply search filter in memory (to avoid complex Prisma query issues)
    let filteredBookings = [...bookings];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBookings = bookings.filter(b =>
        b.bookingNumber.toLowerCase().includes(searchLower) ||
        b.customerName.toLowerCase().includes(searchLower) ||
        b.customerPhone.includes(search)
      );
    }

    // Calculate stats for this vendor with date filters
    const statsAvailableCondition = {
      status: { in: ['PENDING_VENDOR', 'BROADCASTED'] },
      acceptedVendorId: null,
      ...(startDate || endDate ? { createdAt: baseFilters.createdAt } : {}),
    };

    const statsOwnCondition = {
      acceptedVendorId: vendorId,
      ...(startDate || endDate ? { createdAt: baseFilters.createdAt } : {}),
    };

    const availableCount = await prisma.chauffeur_bookings.count({
      where: statsAvailableCondition,
    });

    const vendorBookings = await prisma.chauffeur_bookings.findMany({
      where: statsOwnCondition,
      select: { status: true, grandTotal: true },
    });

    const stats = {
      total: availableCount + vendorBookings.length,
      pending: availableCount,
      active: vendorBookings.filter((b) => ['ACCEPTED', 'DRIVER_ASSIGNED', 'IN_PROGRESS'].includes(b.status)).length,
      completed: vendorBookings.filter((b) => b.status === 'COMPLETED').length,
      cancelled: vendorBookings.filter((b) => b.status === 'CANCELLED').length,
      totalEarnings: vendorBookings
        .filter((b) => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (b.grandTotal || 0), 0),
    };

    // Debug: Log what we're looking for
    console.log('Vendor Car Rental Bookings API Debug:', {
      vendorId,
      statusFilter: status,
      whereConditions: JSON.stringify(whereConditions),
      totalBookingsFound: bookings.length,
      bookingStatuses: bookings.map(b => ({ id: b.id, status: b.status, acceptedVendorId: b.acceptedVendorId })),
    });

    return NextResponse.json({
      success: true,
      bookings: filteredBookings.map((b) => ({
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
        intermediateStops: b.intermediateStops
          ? (() => { try { return JSON.parse(b.intermediateStops); } catch { return []; } })()
          : [],
        pickupAddress: b.pickupAddress,
        dropAddress: b.dropAddress,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        returnDate: b.returnDate,
        totalDays: b.totalDays,
        localPackageId: b.localPackageId,
        localPackageHours: b.localPackageHours,
        localPackageKm: b.localPackageKm,
        baseFare: b.baseFare,
        chargeableKm: b.chargeableKm,
        perKmRate: b.perKmRate,
        kmCharges: b.kmCharges,
        driverBatta: b.driverBatta,
        gstAmount: b.gstAmount,
        platformFee: b.platformFee,
        grandTotal: b.grandTotal,
        status: b.status,
        paymentStatus: b.paymentStatus,
        paidAmount: b.paidAmount,
        driverName: b.driverName,
        driverPhone: b.driverPhone,
        vehicleNumber: b.vehicleNumber,
        vehicleModel: b.vehicleModel,
        tripStartOtp: b.tripStartOtp,
        tripStartedAt: b.tripStartedAt,
        tripEndedAt: b.tripEndedAt,
        customerNotes: b.customerNotes,
        vendorNotes: b.vendorNotes,
        acceptedVendorId: b.acceptedVendorId,
        isOwnBooking: b.acceptedVendorId === vendorId,
        droppedAt: b.droppedAt,
        dropReason: b.dropReason,
        location: b.locations,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
      stats,
      pagination: {
        page,
        limit,
        total: search ? filteredBookings.length : total,
        totalPages: Math.ceil((search ? filteredBookings.length : total) / limit),
      },
      debug: {
        vendorId,
        availableCount,
        ownBookingsCount: vendorBookings.length,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor bookings', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings', details: error?.message },
      { status: 500 }
    );
  }
}
