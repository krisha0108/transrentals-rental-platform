import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const vendorId = auth.vendorId;
    const { searchParams } = new URL(request.url);
    const status    = searchParams.get('status');
    const search    = searchParams.get('search');
    const page      = parseInt(searchParams.get('page')  || '1');
    const limit     = parseInt(searchParams.get('limit') || '20');
    const skip      = (page - 1) * limit;
    const startDate = searchParams.get('startDate');
    const endDate   = searchParams.get('endDate');

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.lte = end;
      }
    }

    const availableCondition: any = {
      ...dateFilter,
      status: { in: ['PENDING_VENDOR', 'BROADCASTED'] },
      acceptedVendorId: null,
    };

    const ownCondition: any = {
      ...dateFilter,
      acceptedVendorId: vendorId,
      status: { not: 'PENDING_PAYMENT' },
    };

    let whereConditions: any[];
    if (status && status !== 'all') {
      if (status === 'my_bookings') {
        whereConditions = [{ ...dateFilter, acceptedVendorId: vendorId, status: { not: 'PENDING_PAYMENT' } }];
      } else if (status === 'available') {
        whereConditions = [{ ...dateFilter, status: { in: ['PENDING_VENDOR', 'BROADCASTED'] }, acceptedVendorId: null }];
      } else if (['PENDING_VENDOR', 'BROADCASTED'].includes(status)) {
        whereConditions = [{ ...dateFilter, status, acceptedVendorId: null }];
      } else {
        whereConditions = [{ ...dateFilter, status, acceptedVendorId: vendorId }];
      }
    } else {
      whereConditions = [availableCondition, ownCondition];
    }

    const [bookings, total] = await Promise.all([
      prisma.chauffeur_bookings.findMany({
        where: { OR: whereConditions },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { locations: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.chauffeur_bookings.count({ where: { OR: whereConditions } }),
    ]);

    let filtered = [...bookings];
    if (search) {
      const q = search.toLowerCase();
      filtered = bookings.filter(b =>
        b.bookingNumber.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(search)
      );
    }

    const [availableCount, ownBookings] = await Promise.all([
      prisma.chauffeur_bookings.count({
        where: { ...(startDate || endDate ? dateFilter : {}), status: { in: ['PENDING_VENDOR', 'BROADCASTED'] }, acceptedVendorId: null },
      }),
      prisma.chauffeur_bookings.findMany({
        where: { ...(startDate || endDate ? dateFilter : {}), acceptedVendorId: vendorId, status: { not: 'PENDING_PAYMENT' } },
        select: { status: true, grandTotal: true },
      }),
    ]);

    const stats = {
      total:         availableCount + ownBookings.length,
      pending:       availableCount,
      active:        ownBookings.filter(b => ['ACCEPTED', 'DRIVER_ASSIGNED', 'IN_PROGRESS'].includes(b.status)).length,
      completed:     ownBookings.filter(b => b.status === 'COMPLETED').length,
      cancelled:     ownBookings.filter(b => b.status === 'CANCELLED').length,
      totalEarnings: ownBookings.filter(b => b.status === 'COMPLETED').reduce((sum, b) => sum + (b.grandTotal || 0), 0),
    };

    return NextResponse.json({
      success: true,
      bookings: filtered.map(b => ({
        id:              b.id,
        bookingNumber:   b.bookingNumber,
        customerName:    b.customerName,
        customerPhone:   b.customerPhone,
        customerEmail:   b.customerEmail,
        tripType:        b.tripType,
        carCategory:     b.carCategory,
        carCategoryName: b.carCategoryName,
        pickupCity:      b.pickupCity,
        dropCity:        b.dropCity,
        pickupDate:      b.pickupDate,
        pickupTime:      b.pickupTime,
        returnDate:      b.returnDate,
        totalDays:       b.totalDays,
        pickupAddress:   b.pickupAddress,
        dropAddress:     b.dropAddress,
        baseFare:        b.baseFare,
        gstAmount:       b.gstAmount,
        platformFee:     b.platformFee,
        grandTotal:      b.grandTotal,
        status:          b.status,
        paymentStatus:   b.paymentStatus,
        paidAmount:      b.paidAmount,
        driverName:      b.driverName,
        driverPhone:     b.driverPhone,
        vehicleNumber:   b.vehicleNumber,
        vehicleModel:    b.vehicleModel,
        acceptedVendorId: b.acceptedVendorId,
        isOwnBooking:    b.acceptedVendorId === vendorId,
        tripStartOtp:    b.tripStartOtp,
        customerNotes:   b.customerNotes,
        vendorNotes:     b.vendorNotes,
        location:        b.locations,
        createdAt:       b.createdAt,
        updatedAt:       b.updatedAt,
      })),
      stats,
      pagination: {
        page, limit,
        total: search ? filtered.length : total,
        totalPages: Math.ceil((search ? filtered.length : total) / limit),
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor car-rental bookings', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings', details: error?.message }, { status: 500 });
  }
}
