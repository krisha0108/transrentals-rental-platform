import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

/**
 * GET - Get customer booking stats from local trans_cms database
 * Query params: identifier (phone or email)
 */
export async function GET(request: NextRequest) {
  try {
    // Check database availability
    if (!prisma) {
      logger.error('Database not available - Prisma client is undefined');
      return NextResponse.json(
        {
          success: false,
          error: 'Database not available',
          stats: { open: 0, confirmed: 0, ongoing: 0, completed: 0, dropped: 0, total: 0 }
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get('identifier');
    const customerId = searchParams.get('customer_id');

    if (!identifier && !customerId) {
      return NextResponse.json({ error: 'Identifier or customer_id required' }, { status: 400 });
    }

    // Normalize phone number for search (remove spaces, keep +)
    const normalizedPhone = identifier ? identifier.replace(/\s+/g, '') : null;
    const normalizedEmail = identifier ? identifier.toLowerCase().trim() : null;

    // Build customer filter - try multiple matching strategies
    const customerFilterConditions: any[] = [];

    // Match by customer ID (most reliable)
    if (customerId) {
      customerFilterConditions.push({ customerId: customerId });
    }

    // Match by exact phone/email
    if (identifier) {
      customerFilterConditions.push({ customerPhone: identifier });
      customerFilterConditions.push({ customerEmail: identifier });
    }

    // Match by normalized phone (without spaces)
    if (normalizedPhone && normalizedPhone !== identifier) {
      customerFilterConditions.push({ customerPhone: normalizedPhone });
    }

    // Match by email (case insensitive)
    if (normalizedEmail && normalizedEmail !== identifier) {
      customerFilterConditions.push({ customerEmail: normalizedEmail });
    }

    const customerFilter = {
      OR: customerFilterConditions,
    };

    // Quote request statuses to exclude (they have corresponding bookings already)
    const excludedQuoteStatuses = ['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED'];

    // Quote filter (phone/email/customerId based)
    const quoteFilter = {
      OR: [
        ...(customerId ? [{ customerId }] : []),
        ...(identifier ? [{ customerPhone: identifier }] : []),
        ...(normalizedPhone && normalizedPhone !== identifier ? [{ customerPhone: normalizedPhone }] : []),
        ...(normalizedEmail ? [{ customerEmail: normalizedEmail }] : []),
      ],
    };

    // --- Batch 1: bike, self-drive, bike-bookings, car-bookings, chauffeur-bookings ---
    const [
      bikeQuoteRequestStats,
      selfDriveQuoteRequestStats,
      bikeBookingStats,
      carBookingStats,
      chauffeurBookingStats,
    ] = await Promise.all([
      (prisma.bike_quote_requests.groupBy as any)({
        by: ['status'],
        where: { ...quoteFilter, status: { notIn: excludedQuoteStatuses as any } },
        _count: { status: true },
      }).catch((e: any) => { logger.error('bike_quote_requests groupBy failed', e); return []; }),

      (prisma.self_drive_quote_requests.groupBy as any)({
        by: ['status'],
        where: { ...quoteFilter, status: { notIn: excludedQuoteStatuses as any } },
        _count: { status: true },
      }).catch((e: any) => { logger.error('self_drive_quote_requests groupBy failed', e); return []; }),

      (prisma.bike_bookings.groupBy as any)({
        by: ['status'],
        where: customerFilter,
        _count: { status: true },
      }).catch((e: any) => { logger.error('bike_bookings groupBy failed', e); return []; }),

      (prisma.car_bookings.groupBy as any)({
        by: ['status'],
        where: customerFilter,
        _count: { status: true },
      }).catch((e: any) => { logger.error('car_bookings groupBy failed', e); return []; }),

      (prisma.chauffeur_bookings.groupBy as any)({
        by: ['status'],
        where: customerFilter,
        _count: { status: true },
      }).catch((e: any) => { logger.error('chauffeur_bookings groupBy failed', e); return []; }),
    ]);

    // --- Batch 2: bus quotes, bus bookings, truck quotes, truck bookings, packers quotes ---
    const [
      busQuoteRequestStats,
      busBookingStats,
      truckQuoteRequestStats,
      truckBookingStats,
      packersQuoteRequestStats,
    ] = await Promise.all([
      (prisma.bus_quote_requests.groupBy as any)({
        by: ['status'],
        where: { ...quoteFilter, status: { notIn: excludedQuoteStatuses as any } },
        _count: { status: true },
      }).catch((e: any) => { logger.error('bus_quote_requests groupBy failed', e); return []; }),

      (prisma.bus_bookings.groupBy as any)({
        by: ['status'],
        where: quoteFilter,
        _count: { status: true },
      }).catch((e: any) => { logger.error('bus_bookings groupBy failed', e); return []; }),

      (prisma.truck_quote_requests.groupBy as any)({
        by: ['status'],
        where: { ...quoteFilter, status: { notIn: excludedQuoteStatuses as any } },
        _count: { status: true },
      }).catch((e: any) => { logger.error('truck_quote_requests groupBy failed', e); return []; }),

      (prisma.truck_bookings.groupBy as any)({
        by: ['status'],
        where: quoteFilter,
        _count: { status: true },
      }).catch((e: any) => { logger.error('truck_bookings groupBy failed', e); return []; }),

      (prisma.packers_quote_requests.groupBy as any)({
        by: ['status'],
        where: { ...quoteFilter, status: { notIn: excludedQuoteStatuses as any } },
        _count: { status: true },
      }).catch((e: any) => { logger.error('packers_quote_requests groupBy failed', e); return []; }),
    ]);

    // --- Batch 3: packers bookings, equipment quotes, equipment bookings, luxury quotes, luxury bookings ---
    const [
      packersBookingStats,
      equipmentQuoteRequestStats,
      equipmentBookingStats,
      luxuryQuoteRequestStats,
      luxuryBookingStats,
    ] = await Promise.all([
      (prisma.packers_bookings.groupBy as any)({
        by: ['status'],
        where: quoteFilter,
        _count: { status: true },
      }).catch((e: any) => { logger.error('packers_bookings groupBy failed', e); return []; }),

      (prisma.equipment_quote_requests.groupBy as any)({
        by: ['status'],
        where: { ...quoteFilter, status: { notIn: excludedQuoteStatuses as any } },
        _count: { status: true },
      }).catch((e: any) => { logger.error('equipment_quote_requests groupBy failed', e); return []; }),

      (prisma.equipment_bookings.groupBy as any)({
        by: ['status'],
        where: quoteFilter,
        _count: { status: true },
      }).catch((e: any) => { logger.error('equipment_bookings groupBy failed', e); return []; }),

      (prisma.luxury_quote_requests.groupBy as any)({
        by: ['status'],
        where: { ...quoteFilter, status: { notIn: excludedQuoteStatuses as any } },
        _count: { status: true },
      }).catch((e: any) => { logger.error('luxury_quote_requests groupBy failed', e); return []; }),

      (prisma.luxury_bookings.groupBy as any)({
        by: ['status'],
        where: quoteFilter,
        _count: { status: true },
      }).catch((e: any) => { logger.error('luxury_bookings groupBy failed', e); return []; }),
    ]);

    // --- Aggregate stats ---
    const statusMap: Record<string, number> = {
      open: 0, confirmed: 0, ongoing: 0, completed: 0, dropped: 0,
    };

    // Status mapping tables
    const statusMappings: Record<string, string> = {
      PENDING_PAYMENT: 'confirmed', PAYMENT_VERIFIED: 'confirmed',
      PENDING_VENDOR: 'confirmed', BROADCASTED: 'confirmed',
      ACCEPTED: 'confirmed', DRIVER_ASSIGNED: 'confirmed',
      READY_FOR_PICKUP: 'ongoing', IN_PROGRESS: 'ongoing',
      COMPLETED: 'completed', CANCELLED: 'dropped',
      EXPIRED: 'dropped', REFUNDED: 'dropped',
    };

    const quoteRequestMappings: Record<string, string> = {
      PENDING: 'open', QUOTES_RECEIVED: 'open',
      QUOTE_ACCEPTED: 'confirmed', BOOKING_CONFIRMED: 'confirmed',
      CANCELLED: 'dropped', EXPIRED: 'dropped',
    };

    const busBookingMappings: Record<string, string> = {
      PENDING_PAYMENT: 'confirmed', PAYMENT_SUBMITTED: 'confirmed',
      PAYMENT_VERIFIED: 'confirmed', ADVANCE_PAID: 'confirmed',
      CONFIRMED: 'confirmed', VEHICLE_ASSIGNED: 'confirmed',
      TEAM_ASSIGNED: 'confirmed', LOADING: 'ongoing',
      IN_TRANSIT: 'ongoing', UNLOADING: 'ongoing',
      PACKING: 'ongoing', UNPACKING: 'ongoing',
      DELIVERED: 'ongoing', IN_USE: 'ongoing',
      IN_PROGRESS: 'ongoing', RETURNED: 'completed',
      COMPLETED: 'completed', CANCELLED: 'dropped',
    };

    const luxuryBookingMappings: Record<string, string> = {
      PENDING_PAYMENT: 'confirmed', PAYMENT_SUBMITTED: 'confirmed',
      PAYMENT_VERIFIED: 'confirmed', ADVANCE_PAID: 'confirmed',
      CONFIRMED: 'confirmed', DRIVER_ASSIGNED: 'confirmed',
      IN_PROGRESS: 'ongoing', COMPLETED: 'completed', CANCELLED: 'dropped',
    };

    const applyMapping = (stats: any[], mapping: Record<string, string>) => {
      for (const stat of stats) {
        const mappedStatus = mapping[stat.status] || 'open';
        statusMap[mappedStatus] += stat._count.status;
      }
    };

    applyMapping(bikeQuoteRequestStats, quoteRequestMappings);
    applyMapping(selfDriveQuoteRequestStats, quoteRequestMappings);
    applyMapping(bikeBookingStats, statusMappings);
    applyMapping(carBookingStats, statusMappings);
    applyMapping(chauffeurBookingStats, statusMappings);
    applyMapping(busQuoteRequestStats, quoteRequestMappings);
    applyMapping(busBookingStats, busBookingMappings);
    applyMapping(truckQuoteRequestStats, quoteRequestMappings);
    applyMapping(truckBookingStats, busBookingMappings);
    applyMapping(packersQuoteRequestStats, quoteRequestMappings);
    applyMapping(packersBookingStats, busBookingMappings);
    applyMapping(equipmentQuoteRequestStats, quoteRequestMappings);
    applyMapping(equipmentBookingStats, busBookingMappings);
    applyMapping(luxuryQuoteRequestStats, quoteRequestMappings);
    applyMapping(luxuryBookingStats, luxuryBookingMappings);

    const total = Object.values(statusMap).reduce((sum, count) => sum + count, 0);

    return NextResponse.json({
      success: true,
      stats: {
        open: statusMap.open,
        confirmed: statusMap.confirmed,
        ongoing: statusMap.ongoing,
        completed: statusMap.completed,
        dropped: statusMap.dropped,
        total,
      },
    });
  } catch (error) {
    logger.error('Customer stats error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

// POST endpoint for backwards compatibility
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = body.identifier || body.phone || body.email;

    if (!identifier) {
      return NextResponse.json({ error: 'Identifier required' }, { status: 400 });
    }

    // Reuse GET logic
    const url = new URL(request.url);
    url.searchParams.set('identifier', identifier);
    return GET(new NextRequest(url));
  } catch (error) {
    logger.error('Customer stats POST error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
