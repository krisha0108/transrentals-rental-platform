// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { prepareNotificationData } from '@/lib/utils/notification-helper';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
import { checkFleetAvailability } from '@/lib/utils/fleet-availability';
export const dynamic = 'force-dynamic';

// Helper to generate a unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// Helper to generate quote number
function generateQuoteNumber(): string {
  const prefix = 'LQ'; // Luxury Quote
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

    // Check if fetching expired quote for resubmit prefill
    const requestIdParam = searchParams.get('requestId');
    const expiredParam = searchParams.get('expired');
    if (requestIdParam && expiredParam === 'true') {
      const expiredQuote = await prisma.luxury_quotes.findFirst({
        where: { requestId: requestIdParam, vendorId, status: 'EXPIRED' },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, quote: expiredQuote });
    }

    // PAGINATION PARAMS
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // DATE FILTER PARAMS
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: any = { vendorId: vendorId };
    if (status && status !== 'all') {
      whereClause.status = status;
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

    const [quotes, total] = await Promise.all([
      prisma.luxury_quotes.findMany({
        where: whereClause,
        include: {
          luxury_quote_requests: {
            select: {
              id: true,
              requestNumber: true,
              customerName: true,
              tripType: true,
              occasion: true,
              pickupCity: true,
              dropCity: true,
              pickupDate: true,
              status: true,
            },
          },
          // Include the booking created from this accepted quote
          luxury_bookings: {
            select: {
              id: true,
              bookingNumber: true,
              status: true,
              paymentStatus: true,
              advancePaid: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.luxury_quotes.count({ where: whereClause }),
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
        vehicleFeatures: q.vehicleFeatures,
        vehicleImages: q.vehicleImages,
        driverName: q.driverName,
        driverPhone: q.driverPhone,
        driverExperience: q.driverExperience,
        baseAmount: q.baseAmount,
        chauffeurCharges: q.chauffeurCharges,
        decorationCharges: q.decorationCharges,
        perKmRate: q.perKmRate,
        perHourRate: q.perHourRate,
        includedKm: q.includedKm,
        includedHours: q.includedHours,
        fuelCharges: q.fuelCharges,
        tollEstimate: q.tollEstimate,
        parkingEstimate: q.parkingEstimate,
        nightHaltCharges: q.nightHaltCharges,
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
        isNegotiable: q.isNegotiable,
        validTill: q.validTill,
        validityDays: q.validityDays,
        status: q.status,
        sentAt: q.sentAt,
        viewCount: q.viewCount,
        request: q.luxury_quote_requests,
        booking: q.luxury_bookings || null,
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
    logger.error('Failed to fetch vendor luxury quotes', error);
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
      vehicleFeatures,
      vehicleImages,

      // Driver details (optional at quote stage)
      driverName,
      driverPhone,
      driverExperience,

      // Pricing
      baseAmount,
      chauffeurCharges = 0,
      decorationCharges = 0,
      perKmRate,
      perHourRate,
      includedKm,
      includedHours,
      fuelCharges = 0,
      tollEstimate = 0,
      parkingEstimate = 0,
      nightHaltCharges = 0,
      gstAmount = 0,

      // Advance Payment
      advanceAmount,
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

      // Negotiation
      isNegotiable = false,

      // Validity (days or custom date)
      validityDays,
      customValidTill,
    } = body;

    // Validate required fields
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    if (!vehicleName || !baseAmount) {
      return NextResponse.json(
        { error: 'Vehicle name and base amount are required' },
        { status: 400 }
      );
    }

    // Get the quote request
    const quoteRequest = await prisma.luxury_quote_requests.findUnique({
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

    // Check fleet vehicle availability for requested dates
    if (fleetId && quoteRequest.pickupDate) {
      const luxStart = new Date(quoteRequest.pickupDate);
      const luxEnd = quoteRequest.returnDate ? new Date(quoteRequest.returnDate) : luxStart;
      const availability = await checkFleetAvailability(fleetId, luxStart, luxEnd);
      if (!availability.available) {
        return NextResponse.json(
          { error: 'This vehicle is already booked for the requested dates. Please select a different vehicle.' },
          { status: 409 }
        );
      }
    }

    // Check if vendor already quoted
    const existingQuote = await prisma.luxury_quotes.findFirst({
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
    const totalAmount = baseAmount + chauffeurCharges + decorationCharges + fuelCharges + tollEstimate + parkingEstimate + nightHaltCharges + gstAmount;

    // Set validity
    const useCustomValidity = customValidTill && !isNaN(new Date(customValidTill).getTime());
    const finalValidityDays = useCustomValidity ? null : (validityDays || 3);

    if (useCustomValidity && new Date(customValidTill) <= new Date()) {
      return NextResponse.json(
        { error: 'Custom validity date must be in the future' },
        { status: 400 }
      );
    }

    let validTill: Date;
    if (useCustomValidity) {
      validTill = new Date(customValidTill);
    } else {
      validTill = new Date();
      validTill.setDate(validTill.getDate() + finalValidityDays!);
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
    const withdrawnQuote = await prisma.luxury_quotes.findFirst({
      where: { requestId, vendorId: vendorId, status: 'WITHDRAWN' },
      select: { id: true },
    });

    const quoteFields = {
      quoteNumber,
      templateId: templateId || null,
      fleetId: fleetId || null,
      vehicleCategory: vehicle_category || quoteRequest.vehicleCategory,
      vehicleName,
      vehicleNumber: vehicleNumber || null,
      vehicleModel: vehicle_model || null,
      vehicleYear: vehicleYear || null,
      vehicleFeatures: vehicleFeatures || null,
      vehicleImages: finalVehicleImages || null,
      driverName: driverName || null,
      driverPhone: driverPhone || null,
      driverExperience: driverExperience || null,
      baseAmount,
      chauffeurCharges,
      decorationCharges,
      perKmRate: perKmRate || null,
      perHourRate: perHourRate || null,
      includedKm: includedKm || null,
      includedHours: includedHours || null,
      fuelCharges,
      tollEstimate,
      parkingEstimate,
      nightHaltCharges,
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
      isNegotiable,
      validTill,
      validityDays: storedValidityDays,
      status: 'SENT',
      sentAt: new Date(),
    };

    // Create the quote (or update existing withdrawn quote)
    const quote = withdrawnQuote
      ? await prisma.luxury_quotes.update({ where: { id: withdrawnQuote.id }, data: quoteFields })
      : await prisma.luxury_quotes.create({ data: { id: generateId(), requestId, vendorId: vendorId, ...quoteFields } });

    // Update quote request stats
    await prisma.luxury_quote_requests.update({
      where: { id: requestId },
      data: {
        status: 'QUOTES_RECEIVED',
        totalQuotesReceived: { increment: 1 },
      },
    });

    // Send notification to customer
    try {
      const notificationTitle = '🚗 New Luxury Car Quote Received!';
      const notificationBody = `${vendor.businessName} has sent you a quote for ${vehicleName}. Total: ₹${totalAmount.toLocaleString()}. Valid till ${validTill.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}. View now!`;

      // Save in-app notification
      // NOTE: Store requestId in quoteId field so customer app can navigate to request details page
      await prisma.notifications.create({
        data: prepareNotificationData({
          customerId: quoteRequest.customerId,
          title: notificationTitle,
          body: notificationBody,
          type: 'quote',
          serviceType: 'luxury',
          quoteId: requestId, // Store request ID so customer can fetch request details
          bookingId: null,
        }),
      });

      // Send push notification
      await sendNotificationToCustomer(
        quoteRequest.customerId,
        {
          title: notificationTitle,
          body: notificationBody,
        },
        {
          type: 'quote',
          requestId: requestId, // Request ID for navigation
          quoteId: quote.id, // Actual quote ID for reference
          quoteNumber: quote.quoteNumber,
          action: 'quote_received',
          vehicleName,
        }
      );

      logger.info(`Notification sent for luxury quote - Quote: ${quote.quoteNumber}, Request: ${requestId}, Customer: ${quoteRequest.customerId}`);
    } catch (notifError) {
      // Log error but don't fail the request
      logger.error('Failed to send luxury quote notification', notifError);
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
    logger.error('Failed to submit luxury quote', error);
    return NextResponse.json(
      { error: 'Failed to submit quote', details: error?.message },
      { status: 500 }
    );
  }
}
