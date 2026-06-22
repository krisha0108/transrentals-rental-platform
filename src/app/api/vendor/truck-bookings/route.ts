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

    // DATE FILTER PARAMS
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search')?.trim() || '';

    // SEARCH FILTER
    const searchFilter: any = search ? {
      OR: [
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        { customerEmail: { contains: search } },
        { bookingNumber: { contains: search } },
      ],
    } : {};

    let whereClause: any = { vendorId: vendor.id, ...searchFilter }; // Fixed: was vendorId instead of vendor.id

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

    const [bookings, total] = await Promise.all([
      prisma.truck_bookings.findMany({
        where: whereClause,
        include: {
          truck_quote_requests: {
            select: {
              id: true,
              requestNumber: true,
              truckBodyType: true,
              tripDirection: true,
              estimatedVolume: true,
              estimatedWeight: true,
              goodsDescription: true,
              pickupPincode: true,
              dropPincode: true,
              hasPickupLift: true,
              hasDropLift: true,
              expectedDeliveryDate: true,
              expectedDeliveryTime: true,
              requiresLabour: true,
              labourCount: true,
              hasMultipleStops: true,
              multipleStopsDetails: true,
              receiverName: true,
              receiverPhone: true,
              requiresPOD: true,
              isFlexibleDate: true,
              needInsurance: true,
              needPackaging: true,
              budgetMin: true,
              budgetMax: true,
              requirements: true,
            },
          },
        },
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
        goodsDescription: b.goodsDescription || b.truck_quote_requests?.goodsDescription,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        pickupCity: b.pickupCity,
        pickupAddress: b.pickupAddress,
        pickupFloor: b.pickupFloor,
        pickupPincode: b.truck_quote_requests?.pickupPincode,
        hasPickupLift: b.truck_quote_requests?.hasPickupLift,
        dropCity: b.dropCity,
        dropAddress: b.dropAddress,
        dropFloor: b.dropFloor,
        dropPincode: b.truck_quote_requests?.dropPincode,
        hasDropLift: b.truck_quote_requests?.hasDropLift,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        expectedDeliveryDate: b.truck_quote_requests?.expectedDeliveryDate,
        expectedDeliveryTime: b.truck_quote_requests?.expectedDeliveryTime,
        truckBodyType: b.truck_quote_requests?.truckBodyType,
        tripDirection: b.truck_quote_requests?.tripDirection,
        estimatedVolume: b.truck_quote_requests?.estimatedVolume,
        estimatedWeight: b.truck_quote_requests?.estimatedWeight,
        requiresLabour: b.truck_quote_requests?.requiresLabour,
        labourCount: b.labourCount ?? b.truck_quote_requests?.labourCount,
        hasMultipleStops: b.truck_quote_requests?.hasMultipleStops,
        multipleStopsDetails: b.truck_quote_requests?.multipleStopsDetails,
        receiverName: b.truck_quote_requests?.receiverName,
        receiverPhone: b.truck_quote_requests?.receiverPhone,
        requiresPOD: b.truck_quote_requests?.requiresPOD,
        isFlexibleDate: b.truck_quote_requests?.isFlexibleDate,
        needInsurance: b.truck_quote_requests?.needInsurance,
        needPackaging: b.truck_quote_requests?.needPackaging,
        budgetMin: b.truck_quote_requests?.budgetMin,
        budgetMax: b.truck_quote_requests?.budgetMax,
        requirements: b.customerNotes || b.truck_quote_requests?.requirements,
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
        droppedAt: b.droppedAt,
        dropReason: b.dropReason,
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

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

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
