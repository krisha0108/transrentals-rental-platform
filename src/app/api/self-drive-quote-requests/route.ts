// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { calculateRentalDuration } from '@/lib/utils';
import logger from '@/lib/security/logger';
import { sendQuoteRequestNotificationToVendors } from '@/lib/utils/vendor-notification-sender';
import crypto from 'crypto';
export const dynamic = 'force-dynamic';

// Helper to generate request number
function generateRequestNumber(): string {
  const prefix = 'SDQ'; // Self-Drive Quote Request
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `${prefix}-${Date.now()}-${random}`;
}

function generateB2BId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

function generateB2BBookingNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `B2B-${year}-${random}`;
}

// POST - Customer creates a Self-Drive Quote Request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[SelfDriveQuoteRequest] Received:', JSON.stringify(body, null, 2));

    const {
      // Customer details
      customerName,
      customerEmail,
      customerPhone,
      customerId,

      // Vehicle preference
      vehicleModelId,
      vehicleModelName,
      vehicleBrand,
      vehicle_category,
      vehicleCategoryName,
      vehicleType,
      transmission,
      fuelType,
      minSeats,

      // Location
      locationId,
      locationName,
      pickupAddress,
      dropAddress,

      // Dates
      pickupDate,
      pickupTime,
      dropDate,
      dropTime,

      // Requirements
      isDeliveryRequested = false,
      customerNotes,
      licenseNumber,

      // Budget hint
      budgetMin,
      budgetMax,

      // B2B fields
      isB2B,
      numberOfVehicles,
      numberOfPersons,
      // Travel-agent fields
      taBookingMode, // 'PERSONAL' | 'COMPANY' (only COMPANY routes to b2b)
    } = body;

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: 'Customer details are required' },
        { status: 400 }
      );
    }

    if (!locationId || !pickupDate || !dropDate) {
      return NextResponse.json(
        { error: 'Location and dates are required' },
        { status: 400 }
      );
    }

    // Find location if locationId provided
    const location = await prisma.locations.findUnique({
      where: { id: locationId },
      select: { id: true, name: true },
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Invalid location' },
        { status: 400 }
      );
    }

    // ============ B2B / TRAVEL-AGENT COMPANY FLOW ============
    // Approved B2B customers OR travel agents picking COMPANY mode route into
    // b2b_bookings (manager queue, no upfront payment).
    if ((isB2B || taBookingMode === 'COMPANY') && customerId) {
      const customer = await prisma.customers.findUnique({
        where: { id: customerId },
        select: { id: true, name: true, email: true, phone: true, companyName: true, isB2B: true, b2bStatus: true },
      });

      // Resolve linked travel agent (raw SQL — column may not be in client cache)
      let linkedTravelAgentId: string | null = null;
      if (customer?.id) {
        try {
          const linkRows: any[] = await (prisma as any).$queryRawUnsafe(
            `SELECT linkedTravelAgentId FROM customers WHERE id = ? LIMIT 1`, customer.id,
          );
          linkedTravelAgentId = linkRows[0]?.linkedTravelAgentId || null;
        } catch { /* non-fatal */ }
      }

      const isApprovedB2B = customer?.isB2B && customer?.b2bStatus === 'APPROVED';
      const isLinkedTaCompany = !!linkedTravelAgentId && taBookingMode === 'COMPANY';
      if (!customer || (!isApprovedB2B && !isLinkedTaCompany)) {
        return NextResponse.json({ error: 'B2B access not approved' }, { status: 403 });
      }

      const bookingId = generateB2BId();
      // For travel-agent COMPANY booking, prefix the booking number with TA-CO.
      const bookingNumber = isLinkedTaCompany
        ? `TA-CO-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`
        : generateB2BBookingNumber();

      // Build vehicle preference JSON for specialNotes
      const vehiclePreference = {
        vehicleModelId: vehicleModelId || null,
        vehicleModelName: vehicleModelName || null,
        vehicleBrand: vehicleBrand || null,
        vehicleCategory: vehicleCategoryName || null,
        transmission: transmission || null,
        fuelType: fuelType || null,
        minSeats: minSeats || null,
        isDeliveryRequested: isDeliveryRequested || false,
        pickupAddress: pickupAddress || null,
        customerNotes: customerNotes || null,
      };

      // For TA bookings, fetch agency name + agent phone to display.
      let companyName: string = customer.companyName || customer.name;
      let resolvedCustomerPhone: string = customer.phone;
      if (isLinkedTaCompany && linkedTravelAgentId) {
        try {
          const agentRows: any[] = await (prisma as any).$queryRawUnsafe(
            `SELECT agencyName, phone FROM travel_agents WHERE id = ? LIMIT 1`, linkedTravelAgentId,
          );
          if (agentRows[0]?.agencyName) companyName = agentRows[0].agencyName;
          const agentPhone: string | null = agentRows[0]?.phone || null;
          if (
            agentPhone &&
            (typeof resolvedCustomerPhone !== 'string' || resolvedCustomerPhone.startsWith('ta-'))
          ) {
            resolvedCustomerPhone = agentPhone;
          }
        } catch { /* fall back */ }
      }

      const booking = await prisma.b2b_bookings.create({
        data: {
          id: bookingId,
          bookingNumber,
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: resolvedCustomerPhone,
          companyName,
          serviceType: 'self-drive',
          vehiclesRequired: numberOfVehicles ? parseInt(numberOfVehicles) : 1,
          passengerCount: numberOfPersons ? parseInt(numberOfPersons) : null,
          vehicleCategory: vehicleCategoryName || null,
          pickupLocation: location.name,
          dropLocation: null,
          tripType: 'SELF_DRIVE',
          scheduledDate: new Date(pickupDate),
          scheduledTime: pickupTime || '10:00',
          returnDate: dropDate ? new Date(dropDate) : null,
          returnTime: dropTime || null,
          specialNotes: JSON.stringify(vehiclePreference),
          status: 'OPEN_FOR_QUOTES',
        },
      });

      // Tag the b2b row for travel-agent COMPANY bookings.
      if (isLinkedTaCompany && linkedTravelAgentId) {
        try {
          await (prisma as any).$executeRawUnsafe(
            `UPDATE b2b_bookings SET travelAgentId = ?, bookingMode = ? WHERE id = ?`,
            linkedTravelAgentId, 'COMPANY', booking.id,
          );
        } catch (e) { console.error('[self-drive-quote-requests] TA b2b tag failed', e); }
      }

      return NextResponse.json({
        success: true,
        isB2B: true,
        ...(isLinkedTaCompany && { isTravelAgent: true, bookingMode: 'COMPANY' }),
        message: isLinkedTaCompany
          ? 'Company self-drive booking sent to manager. Quote will be shared shortly.'
          : 'B2B self-drive booking created. Vendors will be notified.',
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: booking.status,
        },
      });
    }

    // ============ REGULAR FLOW ============
    // Generate request number
    const requestNumber = generateRequestNumber();

    // Validate customerId if provided - must exist in customers table
    let validCustomerId = null;
    if (customerId) {
      const customerExists = await prisma.customers.findUnique({
        where: { id: customerId },
        select: { id: true },
      });
      validCustomerId = customerExists ? customerId : null;
    }

    // Set expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Quotes open for 48 hours
    const quotesOpenTill = new Date();
    quotesOpenTill.setHours(quotesOpenTill.getHours() + 48);

    // Calculate total days
    const pickupDateTime = new Date(pickupDate);
    const dropDateTime = new Date(dropDate);
    // Calculate duration with proper time precision
    const duration = calculateRentalDuration(
      pickupDate,
      pickupTime || '10:00',
      dropDate,
      dropTime || pickupTime || '10:00'
    );
    const totalDays = duration.totalDays;
    const totalHours = duration.totalHours;

    // Create the quote request
    const quoteRequest = await prisma.self_drive_quote_requests.create({
      data: {
        requestNumber,
        customerId: validCustomerId,
        customerName,
        customerEmail,
        customerPhone,
        vehicleModelId: vehicleModelId || null,
        vehicleModelName: vehicleModelName || null,
        vehicleBrand: vehicleBrand || null,
        vehicleCategory: vehicle_category || null,
        vehicleCategoryName: vehicleCategoryName || vehicle_category || null,
        vehicleType: vehicleType || null,
        transmission: transmission || null,
        fuelType: fuelType || null,
        minSeats: minSeats || null,
        numberOfVehicles: numberOfVehicles ? Math.max(1, parseInt(numberOfVehicles)) : 1,
        locationId: location.id,
        locationName: location.name,
        pickupAddress: pickupAddress || null,
        dropAddress: dropAddress || null,
        pickupDate: pickupDateTime,
        pickupTime: pickupTime || '10:00',
        dropDate: dropDateTime,
        dropTime: dropTime || '10:00',
        totalDays,
        isDeliveryRequested,
        customerNotes: customerNotes || null,
        licenseNumber: licenseNumber || null,
        budgetMin: budgetMin || null,
        budgetMax: budgetMax || null,
        status: 'PENDING',
        expiresAt,
        quotesOpenTill,
        source: body.source || 'web',
      },
    });

    // Travel-agent PERSONAL tagging — resolve customer (id → email → phone)
    // and write travelAgentId + bookingMode='PERSONAL' if the customer is
    // linked to a travel agent.
    try {
      let lookupId: string | null = customerId || null;
      if (!lookupId && customerEmail) {
        const c = await prisma.customers.findFirst({
          where: { email: String(customerEmail).toLowerCase() }, select: { id: true },
        });
        if (c) lookupId = c.id;
      }
      if (!lookupId && customerPhone) {
        const c = await prisma.customers.findFirst({
          where: { phone: String(customerPhone) }, select: { id: true },
        });
        if (c) lookupId = c.id;
      }
      if (lookupId) {
        const linkRows: any[] = await (prisma as any).$queryRawUnsafe(
          `SELECT linkedTravelAgentId FROM customers WHERE id = ? LIMIT 1`, lookupId,
        );
        const agentId = linkRows[0]?.linkedTravelAgentId || null;
        if (agentId) {
          await (prisma as any).$executeRawUnsafe(
            `UPDATE self_drive_quote_requests SET travelAgentId = ?, bookingMode = ? WHERE id = ?`,
            agentId, 'PERSONAL', quoteRequest.id,
          );
        }
      }
    } catch (e) { console.error('[self-drive-quote-requests] TA tag failed', e); }

    // Non-blocking vendor notification
    sendQuoteRequestNotificationToVendors({
      requestId: quoteRequest.id,
      requestNumber: quoteRequest.requestNumber,
      locationId: location?.id || locationId,
      locationName: location?.name || locationName,
      customerName,
      serviceType: 'self-drive',
      serviceDisplayName: 'Self Drive',
    }).catch((err: any) => console.error('[Notification] Failed:', err));

    return NextResponse.json({
      success: true,
      message: 'Quote request submitted. Vendors will send quotes within 24-48 hours.',
      quoteRequest: {
        id: quoteRequest.id,
        requestNumber: quoteRequest.requestNumber,
        status: quoteRequest.status,
        chauffeur_vehicle_categories: quoteRequest.vehicleCategoryName,
        vehicleModelName: quoteRequest.vehicleModelName,
        transmission: quoteRequest.transmission,
        locationName: quoteRequest.locationName,
        pickupDate: quoteRequest.pickupDate,
        dropDate: quoteRequest.dropDate,
        totalDays: quoteRequest.totalDays,
        expiresAt: quoteRequest.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('[SelfDriveQuoteRequest] Error:', error);
    logger.error('Failed to create self-drive quote request', error);
    return NextResponse.json(
      { error: 'Failed to create quote request', details: error?.message, stack: error?.stack },
      { status: 500 }
    );
  }
}

// GET - List Self-Drive Quote Requests for a customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    const status = searchParams.get('status');

    if (!customerId && !phone && !email) {
      return NextResponse.json(
        { error: 'Customer ID, phone, or email required' },
        { status: 400 }
      );
    }

    // Build where clause with OR conditions for flexible customer matching
    const whereClause: any = {};
    const customerConditions: any[] = [];

    console.log('🔍 Self-Drive Quote Requests - Params:', { customerId, phone, email, status });

    if (customerId) {
      customerConditions.push({ customerId: customerId });
    }
    if (phone) {
      customerConditions.push({ customerPhone: phone });
    }
    if (email) {
      customerConditions.push({ customerEmail: email });
    }

    // Use OR if multiple conditions, otherwise single condition
    if (customerConditions.length > 1) {
      whereClause.OR = customerConditions;
    } else if (customerConditions.length === 1) {
      Object.assign(whereClause, customerConditions[0]);
    }

    console.log('🔍 Where Clause:', JSON.stringify(whereClause, null, 2));

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const requests = await prisma.self_drive_quote_requests.findMany({
      where: whereClause,
      include: {
        self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests: {
          where: { status: { in: ['SENT', 'VIEWED'] } },
          select: {
            id: true,
            quoteNumber: true,
            vendorId: true,
            vehicleName: true,
            transmission: true,
            fuelType: true,
            dailyRate: true,
            grandTotal: true,
            advanceAmount: true,
            advancePercent: true,
            kmLimitPerDay: true,
            extraKmRate: true,
            status: true,
            validTill: true,
            vendors: {
              select: {
                businessName: true,
                rating: true,
              },
            },
          },
          orderBy: { grandTotal: 'asc' },
        },
        locations: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        vehicleModelName: r.vehicleModelName,
        vehicleBrand: r.vehicleBrand,
        chauffeur_vehicle_categories: r.vehicleCategory,
        vehicleCategoryName: r.vehicleCategoryName,
        vehicleType: r.vehicleType,
        transmission: r.transmission,
        fuelType: r.fuelType,
        numberOfVehicles: r.numberOfVehicles,
        locationId: r.locationId,
        locationName: r.locationName,
        pickupDate: r.pickupDate,
        pickupTime: r.pickupTime,
        dropDate: r.dropDate,
        dropTime: r.dropTime,
        totalDays: r.totalDays,
        isDeliveryRequested: r.isDeliveryRequested,
        status: r.status,
        totalQuotesReceived: r.totalQuotesReceived,
        quotes: r.self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch self-drive quote requests', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests', details: error?.message },
      { status: 500 }
    );
  }
}
