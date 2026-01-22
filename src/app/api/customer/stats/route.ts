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

    // Get bike booking stats
    let bikeBookingStats: any[] = [];
    try {
      bikeBookingStats = await (prisma.bike_bookings.groupBy as any)({
        by: ['status'],
        where: customerFilter,
        _count: { status: true },
      });
    } catch (e) {
      logger.error('Error fetching bike stats', e);
    }

    // Get car booking stats
    let carBookingStats: any[] = [];
    try {
      carBookingStats = await (prisma.car_bookings.groupBy as any)({
        by: ['status'],
        where: customerFilter,
        _count: { status: true },
      });
    } catch (e) {
      logger.error('Error fetching car stats', e);
    }

    // Get chauffeur booking stats
    let chauffeurBookingStats: any[] = [];
    try {
      chauffeurBookingStats = await (prisma.chauffeur_bookings.groupBy as any)({
        by: ['status'],
        where: customerFilter,
        _count: { status: true },
      });
    } catch (e) {
      logger.error('Error fetching chauffeur stats', e);
    }

    // Get bus quote request stats
    let busQuoteRequestStats: any[] = [];
    try {
      busQuoteRequestStats = await (prisma.bus_quote_requests.groupBy as any)({
        by: ['status'],
        where: {
          OR: [
            ...(customerId ? [{ customerId: customerId }] : []),
            ...(identifier ? [{ customerPhone: identifier }] : []),
            ...(normalizedPhone && normalizedPhone !== identifier ? [{ customerPhone: normalizedPhone }] : []),
            ...(normalizedEmail ? [{ customerEmail: normalizedEmail }] : []),
          ],
        },
        _count: { status: true },
      });
    } catch (e) {
      logger.error('Error fetching bus quote request stats', e);
    }

    // Get bus booking stats
    let busBookingStats: any[] = [];
    try {
      busBookingStats = await (prisma.bus_bookings.groupBy as any)({
        by: ['status'],
        where: {
          OR: [
            ...(customerId ? [{ customerId: customerId }] : []),
            ...(identifier ? [{ customerPhone: identifier }] : []),
            ...(normalizedPhone && normalizedPhone !== identifier ? [{ customerPhone: normalizedPhone }] : []),
            ...(normalizedEmail ? [{ customerEmail: normalizedEmail }] : []),
          ],
        },
        _count: { status: true },
      });
    } catch (e) {
      logger.error('Error fetching bus booking stats', e);
    }

    // Aggregate stats
    const statusMap: Record<string, number> = {
      open: 0,
      confirmed: 0,
      ongoing: 0,
      completed: 0,
      dropped: 0,
    };

    // Map booking statuses to dashboard categories
    // Based on actual Prisma enums: BikeBookingStatus, CarBookingStatus, ChauffeurBookingStatus
    const statusMappings: Record<string, string> = {
      PENDING_PAYMENT: 'open',
      PENDING_VENDOR: 'open',
      BROADCASTED: 'open',
      ACCEPTED: 'confirmed',
      DRIVER_ASSIGNED: 'confirmed',
      IN_PROGRESS: 'ongoing',
      COMPLETED: 'completed',
      CANCELLED: 'dropped',
      EXPIRED: 'dropped',
      REFUNDED: 'dropped',
    };

    // Bus quote request status mappings
    const busQuoteRequestMappings: Record<string, string> = {
      PENDING: 'open',
      QUOTES_RECEIVED: 'open',
      QUOTE_ACCEPTED: 'confirmed',
      BOOKING_CONFIRMED: 'confirmed',
      CANCELLED: 'dropped',
      EXPIRED: 'dropped',
    };

    // Bus booking status mappings
    const busBookingMappings: Record<string, string> = {
      PENDING_PAYMENT: 'open',
      PAYMENT_SUBMITTED: 'open',
      ADVANCE_PAID: 'confirmed',
      CONFIRMED: 'confirmed',
      VEHICLE_ASSIGNED: 'confirmed',
      IN_PROGRESS: 'ongoing',
      COMPLETED: 'completed',
      CANCELLED: 'dropped',
    };

    // Process bike booking stats
    for (const stat of bikeBookingStats) {
      const mappedStatus = statusMappings[stat.status] || 'open';
      statusMap[mappedStatus] += stat._count.status;
    }

    // Process car booking stats
    for (const stat of carBookingStats) {
      const mappedStatus = statusMappings[stat.status] || 'open';
      statusMap[mappedStatus] += stat._count.status;
    }

    // Process chauffeur booking stats
    for (const stat of chauffeurBookingStats) {
      const mappedStatus = statusMappings[stat.status] || 'open';
      statusMap[mappedStatus] += stat._count.status;
    }

    // Process bus quote request stats
    for (const stat of busQuoteRequestStats) {
      const mappedStatus = busQuoteRequestMappings[stat.status] || 'open';
      statusMap[mappedStatus] += stat._count.status;
    }

    // Process bus booking stats
    for (const stat of busBookingStats) {
      const mappedStatus = busBookingMappings[stat.status] || 'open';
      statusMap[mappedStatus] += stat._count.status;
    }

    // Get truck quote request stats
    let truckQuoteRequestStats: any[] = [];
    try {
      truckQuoteRequestStats = await (prisma.truck_quote_requests.groupBy as any)({
        by: ['status'],
        where: {
          OR: [
            ...(customerId ? [{ customerId: customerId }] : []),
            ...(identifier ? [{ customerPhone: identifier }] : []),
            ...(normalizedPhone && normalizedPhone !== identifier ? [{ customerPhone: normalizedPhone }] : []),
            ...(normalizedEmail ? [{ customerEmail: normalizedEmail }] : []),
          ],
        },
        _count: { status: true },
      });
    } catch (e) {
      logger.error('Error fetching truck quote request stats', e);
    }

    // Get truck booking stats
    let truckBookingStats: any[] = [];
    try {
      truckBookingStats = await (prisma.truck_bookings.groupBy as any)({
        by: ['status'],
        where: {
          OR: [
            ...(customerId ? [{ customerId: customerId }] : []),
            ...(identifier ? [{ customerPhone: identifier }] : []),
            ...(normalizedPhone && normalizedPhone !== identifier ? [{ customerPhone: normalizedPhone }] : []),
            ...(normalizedEmail ? [{ customerEmail: normalizedEmail }] : []),
          ],
        },
        _count: { status: true },
      });
    } catch (e) {
      logger.error('Error fetching truck booking stats', e);
    }

    // Process truck stats
    for (const stat of truckQuoteRequestStats) {
      const mappedStatus = busQuoteRequestMappings[stat.status] || 'open';
      statusMap[mappedStatus] += stat._count.status;
    }
    for (const stat of truckBookingStats) {
      const mappedStatus = busBookingMappings[stat.status] || 'open';
      statusMap[mappedStatus] += stat._count.status;
    }

    // Get packers quote request stats
    let packersQuoteRequestStats: any[] = [];
    try {
      packersQuoteRequestStats = await (prisma.packers_quote_requests.groupBy as any)({
        by: ['status'],
        where: {
          OR: [
            ...(customerId ? [{ customerId: customerId }] : []),
            ...(identifier ? [{ customerPhone: identifier }] : []),
            ...(normalizedPhone && normalizedPhone !== identifier ? [{ customerPhone: normalizedPhone }] : []),
            ...(normalizedEmail ? [{ customerEmail: normalizedEmail }] : []),
          ],
        },
        _count: { status: true },
      });
    } catch (e) {
      logger.error('Error fetching packers quote request stats', e);
    }

    // Get packers booking stats
    let packersBookingStats: any[] = [];
    try {
      packersBookingStats = await (prisma.packers_bookings.groupBy as any)({
        by: ['status'],
        where: {
          OR: [
            ...(customerId ? [{ customerId: customerId }] : []),
            ...(identifier ? [{ customerPhone: identifier }] : []),
            ...(normalizedPhone && normalizedPhone !== identifier ? [{ customerPhone: normalizedPhone }] : []),
            ...(normalizedEmail ? [{ customerEmail: normalizedEmail }] : []),
          ],
        },
        _count: { status: true },
      });
    } catch (e) {
      logger.error('Error fetching packers booking stats', e);
    }

    // Process packers stats
    for (const stat of packersQuoteRequestStats) {
      const mappedStatus = busQuoteRequestMappings[stat.status] || 'open';
      statusMap[mappedStatus] += stat._count.status;
    }
    for (const stat of packersBookingStats) {
      const mappedStatus = busBookingMappings[stat.status] || 'open';
      statusMap[mappedStatus] += stat._count.status;
    }

    // Get equipment quote request stats
    let equipmentQuoteRequestStats: any[] = [];
    try {
      equipmentQuoteRequestStats = await (prisma.equipment_quote_requests.groupBy as any)({
        by: ['status'],
        where: {
          OR: [
            ...(customerId ? [{ customerId: customerId }] : []),
            ...(identifier ? [{ customerPhone: identifier }] : []),
            ...(normalizedPhone && normalizedPhone !== identifier ? [{ customerPhone: normalizedPhone }] : []),
            ...(normalizedEmail ? [{ customerEmail: normalizedEmail }] : []),
          ],
        },
        _count: { status: true },
      });
    } catch (e) {
      logger.error('Error fetching equipment quote request stats', e);
    }

    // Get equipment booking stats
    let equipmentBookingStats: any[] = [];
    try {
      equipmentBookingStats = await (prisma.equipment_bookings.groupBy as any)({
        by: ['status'],
        where: {
          OR: [
            ...(customerId ? [{ customerId: customerId }] : []),
            ...(identifier ? [{ customerPhone: identifier }] : []),
            ...(normalizedPhone && normalizedPhone !== identifier ? [{ customerPhone: normalizedPhone }] : []),
            ...(normalizedEmail ? [{ customerEmail: normalizedEmail }] : []),
          ],
        },
        _count: { status: true },
      });
    } catch (e) {
      logger.error('Error fetching equipment booking stats', e);
    }

    // Process equipment stats
    for (const stat of equipmentQuoteRequestStats) {
      const mappedStatus = busQuoteRequestMappings[stat.status] || 'open';
      statusMap[mappedStatus] += stat._count.status;
    }
    for (const stat of equipmentBookingStats) {
      const mappedStatus = busBookingMappings[stat.status] || 'open';
      statusMap[mappedStatus] += stat._count.status;
    }

    // Get luxury quote request stats
    let luxuryQuoteRequestStats: any[] = [];
    try {
      luxuryQuoteRequestStats = await (prisma.luxury_quote_requests.groupBy as any)({
        by: ['status'],
        where: {
          OR: [
            ...(customerId ? [{ customerId: customerId }] : []),
            ...(identifier ? [{ customerPhone: identifier }] : []),
            ...(normalizedPhone && normalizedPhone !== identifier ? [{ customerPhone: normalizedPhone }] : []),
            ...(normalizedEmail ? [{ customerEmail: normalizedEmail }] : []),
          ],
        },
        _count: { status: true },
      });
    } catch (e) {
      logger.error('Error fetching luxury quote request stats', e);
    }

    // Get luxury booking stats
    let luxuryBookingStats: any[] = [];
    try {
      luxuryBookingStats = await (prisma.luxury_bookings.groupBy as any)({
        by: ['status'],
        where: {
          OR: [
            ...(customerId ? [{ customerId: customerId }] : []),
            ...(identifier ? [{ customerPhone: identifier }] : []),
            ...(normalizedPhone && normalizedPhone !== identifier ? [{ customerPhone: normalizedPhone }] : []),
            ...(normalizedEmail ? [{ customerEmail: normalizedEmail }] : []),
          ],
        },
        _count: { status: true },
      });
    } catch (e) {
      logger.error('Error fetching luxury booking stats', e);
    }

    // Luxury quote request status mappings (same as bus/truck)
    const luxuryQuoteRequestMappings: Record<string, string> = {
      PENDING: 'open',
      QUOTES_RECEIVED: 'open',
      QUOTE_ACCEPTED: 'confirmed',
      BOOKING_CONFIRMED: 'confirmed',
      CANCELLED: 'dropped',
      EXPIRED: 'dropped',
    };

    // Luxury booking status mappings (same as bus)
    const luxuryBookingMappings: Record<string, string> = {
      PENDING_PAYMENT: 'open',
      PAYMENT_SUBMITTED: 'open',
      ADVANCE_PAID: 'confirmed',
      CONFIRMED: 'confirmed',
      DRIVER_ASSIGNED: 'confirmed',
      IN_PROGRESS: 'ongoing',
      COMPLETED: 'completed',
      CANCELLED: 'dropped',
    };

    // Process luxury stats
    for (const stat of luxuryQuoteRequestStats) {
      const mappedStatus = luxuryQuoteRequestMappings[stat.status] || 'open';
      statusMap[mappedStatus] += stat._count.status;
    }
    for (const stat of luxuryBookingStats) {
      const mappedStatus = luxuryBookingMappings[stat.status] || 'open';
      statusMap[mappedStatus] += stat._count.status;
    }

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
