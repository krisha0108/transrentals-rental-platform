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
  confirmed: ['ADVANCE_PAID', 'CONFIRMED', 'EQUIPMENT_ASSIGNED', 'DISPATCHED'],
  ongoing: ['DELIVERED', 'ON_RENT', 'IN_USE'],
  completed: ['RETURNED', 'COMPLETED'],
  cancelled: ['CANCELLED'],
};

// GET - Get Equipment Bookings for vendor
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
      whereClause.status = { in: ['PENDING_PAYMENT', 'ADVANCE_PAID'] };
    } else if (type === 'confirmed') {
      whereClause.status = { in: ['CONFIRMED', 'DISPATCHED'] };
    } else if (type === 'active') {
      whereClause.status = { in: ['DELIVERED', 'ON_RENT'] };
    } else if (type === 'completed') {
      whereClause.status = 'COMPLETED';
    } else if (type === 'pickup') {
      whereClause.status = 'PICKUP_SCHEDULED';
    }

    // DATE FILTERING
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
      prisma.equipment_bookings.findMany({
        where: whereClause,
        include: {
          equipment_quote_requests: {
            select: {
              id: true,
              requestNumber: true,
              locations: {
                select: { name: true, slug: true }
              }
            }
          }
        },
        orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.equipment_bookings.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      bookings: bookings.map((b) => {
        // Get location from equipment_quote_requests or fallback to deliveryCity
        const locationName = b.equipment_quote_requests?.locations?.name || b.deliveryCity || 'N/A';

        return {
          id: b.id,
          bookingNumber: b.bookingNumber,
          equipmentCategory: b.equipmentCategory,
          equipmentType: b.equipmentType,
          equipmentName: b.equipmentName,
          equipmentModel: b.equipmentModel,
          quantity: b.quantity,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          city: locationName,
          deliveryCity: locationName,
          pickupCity: locationName,
          deliveryAddress: b.deliveryAddress,
          startDate: b.startDate,
          endDate: b.endDate,
          pickupDate: b.startDate, // For mobile app compatibility
          rentalDays: b.rentalDays,
          totalAmount: b.totalAmount,
          grandTotal: b.totalAmount,
          advanceAmount: b.advanceAmount,
          advancePaid: b.advancePaid,
          status: b.status,
          paymentStatus: b.paymentStatus,
          operatorName: b.operatorName,
          operatorPhone: b.operatorPhone,
          deliveryOtp: b.deliveryOtp,
          returnOtp: b.returnOtp,
          quoteRequest: b.equipment_quote_requests,
          createdAt: b.createdAt,
          droppedAt: b.droppedAt,
          dropReason: b.dropReason,
        };
      }),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor equipment bookings', error);
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

    const [pending, confirmed, active, pickup, completed, totalEarnings] = await Promise.all([
      prisma.equipment_bookings.count({ where: { vendorId: auth.vendorId, status: { in: ['PENDING_PAYMENT', 'ADVANCE_PAID'] } } }),
      prisma.equipment_bookings.count({ where: { vendorId: auth.vendorId, status: { in: ['CONFIRMED', 'DISPATCHED'] } } }),
      prisma.equipment_bookings.count({ where: { vendorId: auth.vendorId, status: { in: ['DELIVERED', 'ON_RENT'] } } }),
      prisma.equipment_bookings.count({ where: { vendorId: auth.vendorId, status: 'PICKUP_SCHEDULED' } }),
      prisma.equipment_bookings.count({ where: { vendorId: auth.vendorId, status: 'COMPLETED' } }),
      prisma.equipment_bookings.aggregate({ where: { vendorId: auth.vendorId, status: 'COMPLETED' }, _sum: { totalAmount: true } }),
    ]);

    return NextResponse.json({
      success: true,
      stats: { pending, confirmed, active, pickup, completed, totalEarnings: totalEarnings._sum.totalAmount || 0 },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor equipment booking stats', error);
    return NextResponse.json({ error: 'Failed to fetch stats', details: error?.message }, { status: 500 });
  }
}
