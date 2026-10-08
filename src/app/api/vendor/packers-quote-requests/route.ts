// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { isVendorServiceActive } from '@/lib/services/vendor-service-status';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get available Packers Quote Requests for vendor to quote on
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: { id: true, city: true, vendor_approved_locations: { where: { isActive: true }, select: { locationId: true } } },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const approvedLocationIds = vendor.vendor_approved_locations.map((l) => l.locationId);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // PAGINATION PARAMS
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // A vendor who's deactivated Packers & Movers on /vendor/services must
    // stop seeing NEW (unclaimed) requests — their own quote history (the
    // 'quoted' tab) stays visible, so only non-'quoted' types are gated.
    if (type !== 'quoted' && !(await isVendorServiceActive(vendorId, 'packers'))) {
      return NextResponse.json({
        success: true,
        requests: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    // DATE FILTER PARAMS
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search')?.trim() || '';

    // Build where clause based on type
    let whereClause: any = {
      status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
      quotesOpenTill: { gte: new Date() },
      expiresAt: { gte: new Date() },
    };

    // DATE FILTERING — parse as local midnight to avoid UTC/IST shift
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        const [sy, sm, sd] = startDate.split('-').map(Number);
        whereClause.createdAt.gte = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      }
      if (endDate) {
        const [ey, em, ed] = endDate.split('-').map(Number);
        whereClause.createdAt.lte = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      }
    }

    // Scope to the vendor's approved locations — this had no location
    // filtering at all before, so every vendor saw every pickup city's
    // requests. Requests with no locationId tagged still show (same
    // fallback used for bike/bus/truck). Not applied to 'quoted', which
    // keeps a vendor's own quote history visible regardless of coverage.
    if (type !== 'quoted') {
      whereClause.OR = [{ locationId: { in: approvedLocationIds } }, { locationId: null }];
    }

    if (type === 'quoted') {
      // Get requests where vendor has already submitted a quote
      const quotedRequestIds = await prisma.packers_quotes.findMany({
        where: { vendorId: vendorId },
        select: { requestId: true },
      });
      whereClause = {
        id: { in: quotedRequestIds.map((q) => q.requestId) },
        status: { in: ['PENDING', 'QUOTES_RECEIVED', 'QUOTE_ACCEPTED'] },
        // Re-apply date filters if they exist
        ...(startDate || endDate ? { createdAt: whereClause.createdAt } : {}),
      };
    } else if (type === 'new') {
      // Exclude requests where vendor has an active (non-expired/withdrawn) quote
      const activeQuotedRequestIds = await prisma.packers_quotes.findMany({
        where: { vendorId: vendorId, status: { notIn: ['EXPIRED', 'WITHDRAWN'] } },
        select: { requestId: true },
      });
      whereClause.id = { notIn: activeQuotedRequestIds.map((q) => q.requestId) };
    }

    if (search) {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { customerName: { contains: search } },
            { requestNumber: { contains: search } },
            { pickupCity: { contains: search } },
            { dropCity: { contains: search } },
            { shiftingType: { contains: search } },
          ],
        },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.packers_quote_requests.findMany({
        where: whereClause,
        include: {
          packers_quotes: {
            where: { vendorId: vendorId },
            select: { id: true, quoteNumber: true, totalAmount: true, status: true },
          },
          locations: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.packers_quote_requests.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      requests: requests.map((r) => {
        // Extract time from preferredDate DateTime
        const preferredDateTime = new Date(r.preferredDate);
        const hours = preferredDateTime.getHours().toString().padStart(2, '0');
        const minutes = preferredDateTime.getMinutes().toString().padStart(2, '0');
        const movingTime = `${hours}:${minutes}`;

        return {
          id: r.id,
          requestNumber: r.requestNumber,
          customerName: r.customerName,
          customerEmail: r.customerEmail,
          customerPhone: r.customerPhone,
          serviceType: r.serviceType,
          shiftingType: r.shiftingType,
          specificType: r.propertySize,
          propertySize: r.propertySize,
          inventoryList: r.inventoryList,
          hasHeavyItems: r.hasHeavyItems,
          heavyItemsDesc: r.heavyItemsDesc,
          hasFragileItems: r.hasFragileItems,
          fragileItemsDesc: r.fragileItemsDesc,
          hasVehicle: r.hasVehicle,
          vehicleDetails: r.vehicleDetails,
          fromAddress: r.pickupAddress,
          toAddress: r.dropAddress,
          pickupCity: r.pickupCity,
          pickupAddress: r.pickupAddress,
          pickupFloor: r.pickupFloor,
          hasPickupLift: r.hasPickupLift,
          pickupParkingDist: r.pickupParkingDist,
          dropCity: r.dropCity,
          dropAddress: r.dropAddress,
          dropFloor: r.dropFloor,
          hasDropLift: r.hasDropLift,
          dropParkingDist: r.dropParkingDist,
          movingDate: r.preferredDate,
          movingTime: movingTime,
          preferredDate: r.preferredDate,
          isFlexibleDate: r.isFlexibleDate,
          flexibleDateRange: r.flexibleDateRange,
          needPacking: r.needPacking,
          needUnpacking: r.needUnpacking,
          needStorage: r.needStorage,
          storageDays: r.storageDays,
          needInsurance: r.needInsurance,
          insuranceValue: r.insuranceValue,
          requirements: r.requirements,
          budgetMin: r.budgetMin,
          budgetMax: r.budgetMax,
          status: r.status,
          totalQuotesReceived: r.totalQuotesReceived,
          quotesOpenTill: r.quotesOpenTill,
          expiresAt: r.expiresAt,
          myQuote: r.packers_quotes[0] || null,
          hasQuoted: r.packers_quotes.length > 0,
          location: r.locations,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          // ── Newly-added packers fields ──
          shiftingScope: r.shiftingScope,
          pickupPincode: r.pickupPincode,
          dropPincode: r.dropPincode,
          expectedDeliveryDate: r.expectedDeliveryDate,
          expectedDeliveryTime: r.expectedDeliveryTime,
          boxesCount: r.boxesCount,
          bagsCount: r.bagsCount,
          estimatedWeight: r.estimatedWeight,
          estimatedVolumeCubFt: r.estimatedVolumeCubFt,
          needLoading: r.needLoading,
          needUnloading: r.needUnloading,
          labourCount: r.labourCount,
          vehicleType: r.vehicleType,
          partLoadAccepted: r.partLoadAccepted,
          requiresPOD: r.requiresPOD,
          receiverName: r.receiverName,
          receiverPhone: r.receiverPhone,
          hasMultipleStops: r.hasMultipleStops,
          multipleStopsDetails: r.multipleStopsDetails,
        };
      }),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    logger.error('Failed to fetch packers quote requests for vendor', error);
    return NextResponse.json({ error: 'Failed to fetch requests', details: error?.message }, { status: 500 });
  }
}
