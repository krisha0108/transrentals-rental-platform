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
  confirmed: ['ADVANCE_PAID', 'CONFIRMED', 'DRIVER_ASSIGNED'],
  ongoing: ['IN_PROGRESS'],
  completed: ['COMPLETED'],
  cancelled: ['CANCELLED', 'EXPIRED'],
};

// GET - Get Luxury Bookings & Open Quote Requests for vendor
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId!;


    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: {
        id: true,
        city: true,
        vendor_approved_locations: {
          select: { locationId: true, locations: { select: { name: true } } }
        }
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const approvedLocationIds = vendor.vendor_approved_locations.map((l) => l.locationId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Mobile app status: 'all', 'pending', 'confirmed', 'ongoing', 'completed'
    const type = searchParams.get('type') || (status && status !== 'all' ? status : 'all'); // Web dashboard type parameter

    // PAGINATION PARAMS
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // DATE FILTER PARAMS
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search')?.trim() || '';

    const searchFilter = search
      ? {
          AND: [
            {
              OR: [
                { customerName: { contains: search } },
                { requestNumber: { contains: search } },
                { pickupCity: { contains: search } },
                { dropCity: { contains: search } },
                { vehicleCategoryName: { contains: search } },
              ],
            },
          ],
        }
      : {};

    const bookingSearchFilter = search
      ? {
          AND: [
            {
              OR: [
                { customerName: { contains: search } },
                { bookingNumber: { contains: search } },
                { pickupCity: { contains: search } },
                { dropCity: { contains: search } },
              ],
            },
          ],
        }
      : {};

    let items: any[] = [];
    let total = 0;

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

    // Handle mobile app status parameter
    let effectiveType = type;
    if (status && status !== 'all') {
      // Map mobile status to type
      if (status === 'pending') effectiveType = 'open';
      else if (status === 'confirmed') effectiveType = 'confirmed';
      else if (status === 'ongoing') effectiveType = 'active';
      else if (status === 'completed') effectiveType = 'completed';
    }

    if (effectiveType === 'open' || effectiveType === 'all') {
      // Fetch open quote requests in vendor's area (where vendor hasn't quoted yet)
      const openRequestsWhere = {
        ...dateFilter,
        ...searchFilter,
        status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
        quotesOpenTill: { gte: new Date() },
        OR: [
          { locationId: { in: approvedLocationIds } },
          { locationId: null },
        ],
        luxury_quotes: {
          none: { vendorId: vendor.id, status: { notIn: ['EXPIRED', 'WITHDRAWN'] } },
        },
      };

      const [openRequests, openTotal] = await Promise.all([
        prisma.luxury_quote_requests.findMany({
          where: openRequestsWhere,
          include: {
            locations: { select: { name: true } },
          },
          orderBy: { quotesOpenTill: 'asc' },
          skip: effectiveType === 'open' ? skip : 0,
          take: effectiveType === 'open' ? limit : 10,
        }),
        effectiveType === 'open' ? prisma.luxury_quote_requests.count({ where: openRequestsWhere }) : Promise.resolve(0),
      ]);

      if (effectiveType === 'open') {
        total = openTotal;
      }

      items.push(...openRequests.map((r) => ({
        id: r.id,
        bookingNumber: r.requestNumber,
        type: 'quote_request',
        chauffeur_vehicle_categories: r.vehicle_category,
        vehicleCategoryName: r.vehicleCategoryName,
        specificModel: r.specificModel,
        tripType: r.tripType,
        occasion: r.occasion,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        pickupCity: r.pickupCity,
        pickupAddress: r.pickupAddress,
        dropCity: r.dropCity,
        dropAddress: r.dropAddress,
        pickupDate: r.pickupDate,
        pickupTime: r.pickupTime,
        returnDate: r.returnDate,
        tripDays: r.tripDays,
        tripHours: r.tripHours,
        needDecoration: r.needDecoration,
        decorationType: r.decorationType,
        needChauffeur: r.needChauffeur,
        requirements: r.requirements,
        budgetMin: r.budgetMin,
        budgetMax: r.budgetMax,
        status: 'OPEN_REQUEST',
        quotesOpenTill: r.quotesOpenTill,
        totalQuotesReceived: r.totalQuotesReceived,
        location: r.locations,
        createdAt: r.createdAt,
      })));
    }

    if (effectiveType === 'quoted' || effectiveType === 'all') {
      // Fetch requests where vendor has submitted a quote (pending decision or expired)
      const quotedRequestsWhere = {
        ...dateFilter,
        ...searchFilter,
        status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
        luxury_quotes: {
          some: { vendorId: vendor.id, status: { in: ['SENT', 'VIEWED', 'EXPIRED'] } },
        },
      };

      const [quotedRequests, quotedTotal] = await Promise.all([
        prisma.luxury_quote_requests.findMany({
          where: quotedRequestsWhere,
          include: {
            locations: { select: { name: true } },
            luxury_quotes: {
              where: { vendorId: vendor.id },
              select: { id: true, quoteNumber: true, totalAmount: true, status: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: effectiveType === 'quoted' ? skip : 0,
          take: effectiveType === 'quoted' ? limit : 10,
        }),
        effectiveType === 'quoted' ? prisma.luxury_quote_requests.count({ where: quotedRequestsWhere }) : Promise.resolve(0),
      ]);

      if (effectiveType === 'quoted') {
        total = quotedTotal;
      }

      items.push(...quotedRequests.map((r) => ({
        id: r.id,
        bookingNumber: r.requestNumber,
        type: 'quoted',
        chauffeur_vehicle_categories: r.vehicle_category,
        vehicleCategoryName: r.vehicleCategoryName,
        tripType: r.tripType,
        occasion: r.occasion,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        pickupCity: r.pickupCity,
        pickupAddress: r.pickupAddress,
        dropCity: r.dropCity,
        pickupDate: r.pickupDate,
        pickupTime: r.pickupTime,
        returnDate: r.returnDate,
        needDecoration: r.needDecoration,
        requirements: r.requirements,
        status: r.luxury_quotes[0]?.status === 'EXPIRED' ? 'QUOTE_EXPIRED' : 'QUOTE_SENT',
        requestStatus: r.status,
        myQuote: r.luxury_quotes[0] || null,
        location: r.locations,
        createdAt: r.createdAt,
      })));
    }

    if (effectiveType === 'confirmed' || effectiveType === 'active' || effectiveType === 'completed' || effectiveType === 'all' || effectiveType === 'bookings') {
      // Fetch confirmed LuxuryBookings assigned to this vendor
      let bookingWhere: any = {
        ...dateFilter,
        ...bookingSearchFilter,
        OR: [
          { assignedVendorId: vendor.id },
          { acceptedVendorId: vendor.id },
        ],
      };

      // Apply status filter based on mobile app status or web dashboard type
      if (status && status !== 'all' && mobileStatusMappings[status]) {
        bookingWhere.status = { in: mobileStatusMappings[status] };
      } else if (effectiveType === 'confirmed') {
        bookingWhere.status = { in: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID', 'CONFIRMED', 'DRIVER_ASSIGNED'] };
      } else if (effectiveType === 'active') {
        bookingWhere.status = 'IN_PROGRESS';
      } else if (effectiveType === 'completed') {
        bookingWhere.status = 'COMPLETED';
      }
      // effectiveType === 'bookings' → no status filter → returns all LB statuses

      const isAllMode = effectiveType === 'all';
      const [bookings, bookingsTotal] = await Promise.all([
        prisma.luxury_bookings.findMany({
          where: bookingWhere,
          include: {
            locations: { select: { name: true, slug: true } },
            luxury_quote_requests: { select: { requestNumber: true, vehicleCategoryName: true } },
            luxury_quotes: { select: { quoteNumber: true, vehicleName: true, totalAmount: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: isAllMode ? 0 : skip,
          take: isAllMode ? 20 : limit,
        }),
        !isAllMode ? prisma.luxury_bookings.count({ where: bookingWhere }) : Promise.resolve(0),
      ]);

      if (!isAllMode) {
        total = bookingsTotal;
      }

      items.push(...bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        type: 'booking',
        chauffeur_vehicle_categories: b.carCategory,
        vehicleCategoryName: b.carCategoryName || b.luxury_quote_requests?.vehicleCategoryName,
        vehicleName: b.luxury_quotes?.vehicleName || b.vehicle_models,
        vehicleNumber: b.vehicleNumber,
        tripType: b.tripType,
        occasion: b.occasion,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        customerEmail: b.customerEmail,
        pickupCity: b.pickupCity,
        pickupAddress: b.pickupAddress,
        dropCity: b.dropCity,
        dropAddress: b.dropAddress,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        returnDate: b.returnDate,
        needDecoration: b.needDecoration,
        decorationType: b.decorationType,
        totalAmount: b.grandTotal,
        status: b.status,
        paymentStatus: b.paymentStatus,
        driverName: b.driverName,
        driverPhone: b.driverPhone,
        tripStartOtp: b.tripStartOtp,
        tripEndOtp: b.tripEndOtp,
        location: b.locations,
        createdAt: b.createdAt,
        droppedAt: b.droppedAt,
        dropReason: b.dropReason,
      })));
    }

    // Sort by createdAt desc for 'all' type (newest first)
    if (type === 'all') {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      total = items.length;
    }

    return NextResponse.json({
      success: true,
      bookings: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor luxury bookings', error);
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
    const vendorId = auth.vendorId!;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: {
        id: true,
        city: true,
        vendor_approved_locations: {
          select: { locationId: true }
        }
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const body = await request.json();

    if (body.action === 'stats') {
      const approvedLocationIds = vendor.vendor_approved_locations.map((l) => l.locationId);

      const [openRequests, myQuotes, pending, confirmed, active, completed, totalEarnings] = await Promise.all([
        // Open quote requests in vendor's area (not yet quoted)
        prisma.luxury_quote_requests.count({
          where: {
            status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
            quotesOpenTill: { gte: new Date() },
            OR: [
              { locationId: { in: approvedLocationIds } },
              { locationId: null },
            ],
            luxury_quotes: {
              none: { vendorId: vendor.id },
            },
          },
        }),
        // Vendor's pending quotes
        prisma.luxury_quotes.count({
          where: { vendorId: vendor.id, status: { in: ['SENT', 'VIEWED'] } },
        }),
        // Pending bookings
        prisma.luxury_bookings.count({
          where: {
            OR: [{ assignedVendorId: vendor.id }, { acceptedVendorId: vendor.id }],
            status: { in: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID'] },
          },
        }),
        // Confirmed bookings
        prisma.luxury_bookings.count({
          where: {
            OR: [{ assignedVendorId: vendor.id }, { acceptedVendorId: vendor.id }],
            status: { in: ['CONFIRMED', 'DRIVER_ASSIGNED'] },
          },
        }),
        // Active bookings
        prisma.luxury_bookings.count({
          where: {
            OR: [{ assignedVendorId: vendor.id }, { acceptedVendorId: vendor.id }],
            status: 'IN_PROGRESS',
          },
        }),
        // Completed bookings
        prisma.luxury_bookings.count({
          where: {
            OR: [{ assignedVendorId: vendor.id }, { acceptedVendorId: vendor.id }],
            status: 'COMPLETED',
          },
        }),
        // Total earnings
        prisma.luxury_bookings.aggregate({
          where: {
            OR: [{ assignedVendorId: vendor.id }, { acceptedVendorId: vendor.id }],
            status: 'COMPLETED',
          },
          _sum: { grandTotal: true },
        }),
      ]);

      return NextResponse.json({
        success: true,
        stats: {
          broadcasted: openRequests, // backward compat
          openRequests,
          myQuotes,
          pending,
          confirmed,
          active,
          completed,
          totalEarnings: totalEarnings._sum.grandTotal || 0,
        },
      });
    }

    if (body.action === 'revenue_chart') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date(now);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const vendorFilter = { OR: [{ assignedVendorId: vendor.id }, { acceptedVendorId: vendor.id }] };
      const activeStatuses = ['COMPLETED', 'CONFIRMED', 'DRIVER_ASSIGNED', 'IN_PROGRESS', 'ADVANCE_PAID', 'PENDING_PAYMENT', 'PAYMENT_SUBMITTED'];

      // Get bookings for last 30 days, previous 30 days, and all-time totals
      const [currentPeriodBookings, prevPeriodAgg, allTimeAgg, totalQuoteRequests, allTimeBookingsCount] = await Promise.all([
        prisma.luxury_bookings.findMany({
          where: {
            ...vendorFilter,
            status: { in: activeStatuses },
            createdAt: { gte: thirtyDaysAgo },
          },
          select: { grandTotal: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.luxury_bookings.aggregate({
          where: {
            ...vendorFilter,
            status: { in: activeStatuses },
            createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          },
          _sum: { grandTotal: true },
        }),
        prisma.luxury_bookings.aggregate({
          where: {
            ...vendorFilter,
            status: { in: activeStatuses },
          },
          _sum: { grandTotal: true },
        }),
        prisma.luxury_quote_requests.count({
          where: {
            createdAt: { gte: thirtyDaysAgo },
            OR: [
              { locationId: { in: vendor.vendor_approved_locations.map((l) => l.locationId) } },
              { locationId: null },
            ],
          },
        }),
        prisma.luxury_bookings.count({
          where: {
            ...vendorFilter,
            status: { in: activeStatuses },
          },
        }),
      ]);

      // Build daily data for last 7 days for chart display
      const dailyData: { date: string; revenue: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const dayRevenue = currentPeriodBookings
          .filter((b) => b.createdAt.toISOString().split('T')[0] === dateStr)
          .reduce((sum, b) => sum + (Number(b.grandTotal) || 0), 0);
        dailyData.push({ date: dayLabel, revenue: dayRevenue });
      }

      const totalRevenue30 = currentPeriodBookings.reduce((sum, b) => sum + (Number(b.grandTotal) || 0), 0);
      const prevRevenue = Number(prevPeriodAgg._sum.grandTotal) || 0;
      const allTimeRevenue = Number(allTimeAgg._sum.grandTotal) || 0;

      // Use 30-day revenue if available, otherwise show all-time
      const displayRevenue = totalRevenue30 > 0 ? totalRevenue30 : allTimeRevenue;
      const displayBookings = currentPeriodBookings.length > 0 ? currentPeriodBookings.length : allTimeBookingsCount;
      const periodLabel = totalRevenue30 > 0 ? '30d' : 'all';

      const percentChange = prevRevenue > 0 ? Math.round(((totalRevenue30 - prevRevenue) / prevRevenue) * 100) : totalRevenue30 > 0 ? 100 : 0;
      const avgBooking = displayBookings > 0 ? Math.round(displayRevenue / displayBookings) : 0;
      const conversionRate = totalQuoteRequests > 0 ? Math.round((currentPeriodBookings.length / totalQuoteRequests) * 1000) / 10 : 0;

      return NextResponse.json({
        success: true,
        revenueChart: {
          dailyData,
          totalRevenue: displayRevenue,
          percentChange,
          avgBooking,
          conversionRate,
          totalBookings: displayBookings,
          periodLabel,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('Failed to process vendor luxury request', error);
    return NextResponse.json({ error: 'Failed to process request', details: error?.message }, { status: 500 });
  }
}
