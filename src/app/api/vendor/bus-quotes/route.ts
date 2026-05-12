// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { prepareNotificationData } from '@/lib/utils/notification-helper';
import { sendFCMNotification } from '@/lib/utils/fcm-helper';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate a unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// Helper to generate quote number
function generateQuoteNumber(): string {
  const prefix = 'BQ'; // Bus Quote
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// GET - Get vendor's submitted quotes
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // PAGINATION PARAMS
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // DATE FILTER PARAMS
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search')?.trim() || '';

    // SEARCH FILTER
    const searchFilter: any = search
      ? {
          OR: [
            { quoteNumber: { contains: search } },
            { vehicleName: { contains: search } },
            { bus_bookings: { bookingNumber: { contains: search } } },
            {
              bus_quote_requests_bus_quotes_requestIdTobus_quote_requests: {
                customerName: { contains: search },
              },
            },
            {
              bus_quote_requests_bus_quotes_requestIdTobus_quote_requests: {
                requestNumber: { contains: search },
              },
            },
            {
              bus_quote_requests_bus_quotes_requestIdTobus_quote_requests: {
                pickupCity: { contains: search },
              },
            },
          ],
        }
      : {};

    const whereClause: any = { vendorId: vendorId, ...searchFilter };
    if (status && status !== 'all') {
      const statuses = status.split(",").map((s) => s.trim()).filter(Boolean);
      whereClause.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    // DATE FILTERING — filter on sentAt (when vendor actually sent the quote),
    // not createdAt (draft insert time). Normalize startDate to local midnight
    // so an IST server doesn't drop the first 5.5h of the day.
    if (startDate || endDate) {
      whereClause.sentAt = {};
      if (startDate) {
        const startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        whereClause.sentAt.gte = startDateTime;
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        whereClause.sentAt.lte = endDateTime;
      }
    }

    const [quotes, total] = await Promise.all([
      prisma.bus_quotes.findMany({
        where: whereClause,
        include: {
          bus_quote_requests_bus_quotes_requestIdTobus_quote_requests: {
            select: {
              id: true,
              requestNumber: true,
              customerName: true,
              tripType: true,
              pickupCity: true,
              dropCity: true,
              pickupDate: true,
              status: true,
            },
          },
          bus_bookings: { select: { id: true, bookingNumber: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bus_quotes.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      quotes: quotes.map((q: any) => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        requestId: q.requestId,
        vendorId: q.vendorId,
        templateId: q.templateId,
        fleetId: q.fleetId,
        vehicleCategory: q.vehicleCategory,
        vehicleName: q.vehicleName,
        vehicleNumber: q.vehicleNumber,
        vehicleModel: q.vehicleModel,
        vehicleYear: q.vehicleYear,
        seats: q.seats,
        vehicleFeatures: q.vehicleFeatures,
        vehicleImages: q.vehicleImages,
        driverName: q.driverName,
        driverPhone: q.driverPhone,
        driverExperience: q.driverExperience,
        baseAmount: q.baseAmount,
        perKmRate: q.perKmRate,
        perDayRate: q.perDayRate,
        includedKm: q.includedKm,
        includedHours: q.includedHours,
        driverAllowance: q.driverAllowance,
        nightHaltCharges: q.nightHaltCharges,
        tollEstimate: q.tollEstimate,
        permitCharges: q.permitCharges,
        parkingEstimate: q.parkingEstimate,
        gstAmount: q.gstAmount,
        totalAmount: q.totalAmount,
        advanceAmount: q.advanceAmount,
        advancePercent: q.advancePercent,
        extraKmRate: q.extraKmRate,
        extraHourRate: q.extraHourRate,
        inclusions: q.inclusions,
        exclusions: q.exclusions,
        termsConditions: q.termsConditions,
        vendorMessage: q.vendorMessage,
        validTill: q.validTill,
        validityDays: q.validityDays,
        status: q.status,
        sentAt: q.sentAt,
        viewCount: q.viewCount,
        request: q.bus_quote_requests_bus_quotes_requestIdTobus_quote_requests,
        bookingId: q.bus_bookings?.id || null,
        bookingNumber: q.bus_bookings?.bookingNumber || null,
        bookingStatus: q.bus_bookings?.status || null,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor bus quotes', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Vendor submits a quote for a request
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    // Get vendor
    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: { id: true, businessName: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      requestId,
      templateId, // Optional - use a saved template
      fleetId, // Optional - fleet vehicle ID if selected from vendor's fleet

      // Vehicle details
      vehicle_category,
      vehicleName,
      vehicleNumber,
      vehicle_model,
      vehicleYear,
      seats,
      vehicleFeatures,
      vehicleImages,

      // Driver details (optional at quote stage)
      driverName,
      driverPhone,
      driverExperience,

      // Pricing
      baseAmount,
      perKmRate,
      perDayRate,
      includedKm,
      includedHours,
      driverAllowance = 0,
      nightHaltCharges = 0,
      tollEstimate = 0,
      permitCharges = 0,
      parkingEstimate = 0,
      gstAmount = 0,

      // Advance Payment
      advanceAmount = 0,
      advancePercent = 30,
      customAdvanceAmount,

      // Extra charges info
      extraKmRate,
      extraHourRate,

      // Vendor message
      vendorMessage,

      // Content
      inclusions = [],
      exclusions = [],
      termsConditions = [],

      // Validity (days)
      validityDays,
      customValidTill,
    } = body;

    // Validate required fields
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    if (!vehicleName || !seats || !baseAmount) {
      return NextResponse.json(
        { error: 'Vehicle details and pricing are required' },
        { status: 400 }
      );
    }

    // Get the quote request
    const quoteRequest = await prisma.bus_quote_requests.findUnique({
      where: { id: requestId },
    });

    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    // Check if request is still open
    if (quoteRequest.status !== 'PENDING' && quoteRequest.status !== 'QUOTES_RECEIVED') {
      return NextResponse.json(
        { error: 'This request is no longer accepting quotes' },
        { status: 400 }
      );
    }

    // Check if quotes are still open
    if (quoteRequest.quotesOpenTill && new Date() > new Date(quoteRequest.quotesOpenTill)) {
      return NextResponse.json(
        { error: 'Quote submission window has closed' },
        { status: 400 }
      );
    }

    // Check if vendor already quoted
    const existingQuote = await prisma.bus_quotes.findFirst({
      where: {
        requestId,
        vendorId: vendorId,
        status: { notIn: ['WITHDRAWN', 'EXPIRED'] },
      },
    });

    if (existingQuote) {
      return NextResponse.json(
        { error: 'You have already submitted a quote for this request' },
        { status: 400 }
      );
    }

    // Generate quote number
    const quoteNumber = generateQuoteNumber();

    // Calculate total
    const totalAmount = baseAmount + driverAllowance + nightHaltCharges + tollEstimate + permitCharges + parkingEstimate + gstAmount;

    // Set validity
    const useCustomValidity = customValidTill && !isNaN(new Date(customValidTill).getTime());
    const finalValidityDays = useCustomValidity ? null : (validityDays || 3);
    let validTill: Date;
    if (useCustomValidity) {
      validTill = new Date(customValidTill);
    } else {
      validTill = new Date();
      validTill.setDate(validTill.getDate() + finalValidityDays!);
      validTill.setHours(23, 59, 59, 999);
    }
    const storedValidityDays = useCustomValidity
      ? Math.max(1, Math.ceil((validTill.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : finalValidityDays!;

    // Fetch fleet vehicle images if fleetId is provided
    let finalVehicleImages = vehicleImages; // Use provided images if any
    if (fleetId && !vehicleImages) {
      try {
        const fleetVehicle = await prisma.vendor_fleets.findUnique({
          where: { id: fleetId },
          include: {
            vehicle_models: {
              select: {
                sideImage: true, // Featured image from admin
              },
            },
          },
        });

        if (fleetVehicle) {
          const images: string[] = [];

          // Add featured image from vehicle model (admin's image)
          if (fleetVehicle.vehicle_models?.sideImage) {
            images.push(fleetVehicle.vehicle_models.sideImage);
          }

          // Add vendor's fleet images (up to 5 more)
          if (fleetVehicle.images) {
            try {
              const vendorImages = JSON.parse(fleetVehicle.images);
              if (Array.isArray(vendorImages)) {
                // Add up to 5 vendor images
                images.push(...vendorImages.slice(0, 5));
              }
            } catch (e) {
              logger.warn('Failed to parse vendor fleet images', e);
            }
          }

          // Only set if we have at least one image
          if (images.length > 0) {
            finalVehicleImages = images;
          }
        }
      } catch (error) {
        logger.warn('Failed to fetch fleet vehicle images', error);
        // Continue without images - don't fail the quote submission
      }
    }

    // Check if a withdrawn quote exists (re-quote after withdrawal)
    const withdrawnQuote = await prisma.bus_quotes.findFirst({
      where: { requestId, vendorId: vendorId, status: { in: ['WITHDRAWN', 'EXPIRED'] } },
      select: { id: true },
    });

    const quoteFields = {
      quoteNumber,
      fleetId: fleetId || null,
      vehicleCategory: vehicle_category || quoteRequest.vehicleCategory,
      vehicleName,
      vehicleNumber: vehicleNumber || null,
      vehicleModel: vehicle_model || null,
      vehicleYear: vehicleYear || null,
      seats,
      vehicleFeatures: vehicleFeatures || null,
      vehicleImages: finalVehicleImages ? JSON.stringify(finalVehicleImages) : null,
      driverName: driverName || null,
      driverPhone: driverPhone || null,
      driverExperience: driverExperience || null,
      baseAmount,
      perKmRate: perKmRate || null,
      perDayRate: perDayRate || null,
      includedKm: includedKm || null,
      includedHours: includedHours || null,
      driverAllowance,
      nightHaltCharges,
      tollEstimate,
      permitCharges,
      parkingEstimate,
      gstAmount,
      totalAmount,
      advanceAmount: customAdvanceAmount > 0
        ? Math.round(customAdvanceAmount)
        : (advanceAmount || Math.round(totalAmount * advancePercent / 100)),
      advancePercent,
      extraKmRate: extraKmRate || null,
      extraHourRate: extraHourRate || null,
      inclusions: Array.isArray(inclusions) ? JSON.stringify(inclusions) : (inclusions || null),
      exclusions: Array.isArray(exclusions) ? JSON.stringify(exclusions) : (exclusions || null),
      termsConditions: Array.isArray(termsConditions) ? JSON.stringify(termsConditions) : (termsConditions || null),
      vendorMessage: vendorMessage || null,
      validTill,
      status: 'SENT',
      sentAt: new Date(),
    };

    // Create the quote (or update existing withdrawn/expired quote)
    const quote = withdrawnQuote
      ? await prisma.bus_quotes.update({
          where: { id: withdrawnQuote.id },
          data: {
            ...quoteFields,
            vendor_bus_templates: templateId ? { connect: { id: templateId } } : { disconnect: true },
          },
        })
      : await prisma.bus_quotes.create({
          data: { id: generateId(), requestId, vendorId: vendorId, templateId: templateId || null, ...quoteFields },
        });

    // Update quote request stats
    await prisma.bus_quote_requests.update({
      where: { id: requestId },
      data: {
        status: 'QUOTES_RECEIVED',
        totalQuotesReceived: { increment: 1 },
      },
    });

    // Create notification for customer
    try {
      const notifTitle = '🚌 New Bus Rental Quote Received!';
      const notifBody = `${vendor.businessName} has sent you a quote for ${vehicleName || 'bus rental'}. Total: ₹${totalAmount}.`;

      // Save to database - Store requestId so customer can fetch request details
      await prisma.notifications.create({
        data: prepareNotificationData({
          customerId: quoteRequest.customerId,
          title: notifTitle,
          body: notifBody,
          type: 'quote',
          serviceType: 'bus',
          quoteId: requestId, // Use requestId for navigation
          bookingId: null,
        }),
      });

      // Send FCM push notification ⭐
      await sendFCMNotification({
        customerId: quoteRequest.customerId,
        title: notifTitle,
        body: notifBody,
        data: {
          type: 'quote',
          serviceType: 'bus',
          quoteId: requestId, // Use requestId for navigation
        },
      });

      logger.info('Notification created and sent for bus quote', { requestId, quoteId: quote.id, customerId: quoteRequest.customerId });
    } catch (notifError) {
      logger.error('Failed to create/send notification for bus quote', notifError);
    }

    return NextResponse.json({
      success: true,
      message: 'Quote submitted successfully',
      quote: {
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        vehicleName: quote.vehicleName,
        totalAmount: quote.totalAmount,
        validTill: quote.validTill,
        status: quote.status,
      },
    });
  } catch (error: any) {
    console.error('🔴 BUS QUOTE POST ERROR:', error?.message, error?.stack?.split('\n').slice(0,4).join(' | '));
    logger.error('Failed to submit bus quote', error);
    return NextResponse.json(
      { error: 'Failed to submit quote', details: error?.message },
      { status: 500 }
    );
  }
}
