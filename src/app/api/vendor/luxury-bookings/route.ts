// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import logger from '@/lib/security/logger';
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

    const vendor = await prisma.vendors.findFirst({
      where: { id: auth.vendorId },
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let items: any[] = [];
    let total = 0;

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
      const openRequests = await prisma.luxury_quote_requests.findMany({
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
        include: {
          locations: { select: { name: true } },
        },
        orderBy: { quotesOpenTill: 'asc' },
        take: effectiveType === 'open' ? limit : 10,
      });

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
      // Fetch requests where vendor has submitted a quote (pending decision)
      const quotedRequests = await prisma.luxury_quote_requests.findMany({
        where: {
          status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
          luxury_quotes: {
            some: { vendorId: vendor.id, status: { in: ['SENT', 'VIEWED'] } },
          },
        },
        include: {
          locations: { select: { name: true } },
          luxury_quotes: {
            where: { vendorId: vendor.id },
            select: { id: true, quoteNumber: true, totalAmount: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: effectiveType === 'quoted' ? limit : 10,
      });

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
        status: 'QUOTE_SENT',
        myQuote: r.luxury_quotes[0] || null,
        location: r.locations,
        createdAt: r.createdAt,
      })));
    }

    if (effectiveType === 'confirmed' || effectiveType === 'active' || effectiveType === 'completed' || effectiveType === 'all') {
      // Fetch confirmed LuxuryBookings assigned to this vendor
      let bookingWhere: any = {
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

      const bookings = await prisma.luxury_bookings.findMany({
        where: bookingWhere,
        include: {
          locations: { select: { name: true, slug: true } },
          luxury_quote_requests: { select: { requestNumber: true, vehicleCategoryName: true } },
          luxury_quotes: { select: { quoteNumber: true, vehicleName: true, totalAmount: true } },
        },
        orderBy: [{ pickupDate: 'asc' }, { createdAt: 'desc' }],
        take: effectiveType === 'all' ? 20 : limit,
      });

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
      })));
    }

    // Sort by pickupDate for 'all' type
    if (type === 'all') {
      items.sort((a, b) => {
        // Open requests first, then by pickup date
        if (a.type === 'quote_request' && b.type !== 'quote_request') return -1;
        if (a.type !== 'quote_request' && b.type === 'quote_request') return 1;
        return new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime();
      });
    }

    return NextResponse.json({
      success: true,
      bookings: items,
      pagination: { page, limit, total: items.length, totalPages: 1 },
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

    const vendor = await prisma.vendors.findFirst({
      where: { id: auth.vendorId },
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

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('Failed to process vendor luxury request', error);
    return NextResponse.json({ error: 'Failed to process request', details: error?.message }, { status: 500 });
  }
}
