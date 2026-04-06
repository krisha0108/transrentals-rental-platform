// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import { checkFleetAvailability } from '@/lib/utils/fleet-availability';
export const dynamic = 'force-dynamic';

// Helper to generate a unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// Helper to generate quote number
function generateQuoteNumber(): string {
  const prefix = 'SDQ'; // Self-Drive Quote
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// GET - Get vendor's submitted self-drive quotes
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
      const expiredQuote = await prisma.self_drive_quotes.findFirst({
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

    // SEARCH PARAM
    const search = searchParams.get('search')?.trim() || '';

    const whereClause: any = { vendorId: vendorId };
    if (status && status !== 'all') {
      // Support comma-separated statuses (e.g. "SENT,VIEWED")
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
      whereClause.status = statuses.length === 1 ? statuses[0] : { in: statuses };
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

    // SEARCH FILTERING — match quote number, vehicle name, or customer name/location via request relation
    if (search) {
      whereClause.OR = [
        { quoteNumber: { contains: search } },
        { vehicleName: { contains: search } },
        { vehicleBrand: { contains: search } },
        {
          self_drive_quote_requests_self_drive_quotes_requestIdToself_drive_quote_requests: {
            OR: [
              { customerName: { contains: search } },
              { requestNumber: { contains: search } },
              { locationName: { contains: search } },
              { vehicleCategoryName: { contains: search } },
            ],
          },
        },
      ];
    }

    const baseWhere = { vendorId: vendorId };

    const [quotes, total, totalAll, pendingCount, acceptedCount, acceptedQuotes] = await Promise.all([
      prisma.self_drive_quotes.findMany({
        where: whereClause,
        include: {
          self_drive_quote_requests_self_drive_quotes_requestIdToself_drive_quote_requests: {
            select: {
              id: true,
              requestNumber: true,
              customerName: true,
              vehicleCategoryName: true,
              transmission: true,
              locationName: true,
              pickupDate: true,
              dropDate: true,
              totalDays: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.self_drive_quotes.count({ where: whereClause }),
      prisma.self_drive_quotes.count({ where: baseWhere }),
      prisma.self_drive_quotes.count({ where: { ...baseWhere, status: { in: ['SENT', 'VIEWED'] } } }),
      prisma.self_drive_quotes.count({ where: { ...baseWhere, status: 'ACCEPTED' } }),
      prisma.self_drive_quotes.findMany({
        where: { ...baseWhere, status: 'ACCEPTED' },
        select: { grandTotal: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      quotes: quotes.map((q: any) => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        vehicleName: q.vehicleName,
        vehicleBrand: q.vehicleBrand,
        vehicleCategory: q.vehicleCategory,
        vehicleType: q.vehicleType,
        vehicleImages: q.vehicleImages,
        vehicleFeatures: q.vehicleFeatures,
        registrationNumber: q.registrationNumber,
        vehicleYear: q.vehicleYear,
        vendorFleetId: q.vendorFleetId,
        transmission: q.transmission,
        fuelType: q.fuelType,
        seats: q.seats,
        dailyRate: q.dailyRate,
        baseAmount: q.baseAmount,
        gstAmount: q.gstAmount,
        platformFee: q.platformFee,
        securityDeposit: q.securityDeposit,
        deliveryCharges: q.deliveryCharges,
        pickupCharges: q.pickupCharges,
        grandTotal: q.grandTotal,
        advanceAmount: q.advanceAmount,
        advancePercent: q.advancePercent,
        kmLimitPerDay: q.kmLimitPerDay,
        extraKmRate: q.extraKmRate,
        inclusions: q.inclusions,
        exclusions: q.exclusions,
        termsConditions: q.termsConditions,
        vendorMessage: q.vendorMessage,
        status: q.status,
        validTill: q.validTill,
        validityDays: q.validityDays,
        viewCount: q.viewCount,
        request: q.self_drive_quote_requests_self_drive_quotes_requestIdToself_drive_quote_requests,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: totalAll,
        pending: pendingCount,
        accepted: acceptedCount,
        wonValue: acceptedQuotes.reduce((sum: number, q: any) => sum + (q.grandTotal || 0), 0),
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor self-drive quotes', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Vendor submits a quote for a self-drive request
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
      vendorFleetId, // Fleet vehicle ID from vendor's fleet

      // Vehicle details
      vehicleModelId,
      vehicleName,
      vehicleBrand,
      vehicle_category,
      vehicleType,
      transmission,
      fuelType,
      seats,
      registrationNumber,
      vehicleYear,
      vehicleImages,
      vehicleFeatures,

      // Pricing
      dailyRate,
      totalPrice,
      securityDeposit,
      platformFee = 0, // Removed platform fee
      gstPercent = 0,  // Removed GST

      // KM limits
      kmLimitPerDay = 200,
      extraKmRate = 10,

      // Delivery charges (if applicable)
      deliveryCharges = 0,
      pickupCharges = 0,

      // Advance Payment (vendor decides)
      advancePercent = 30, // 20-50%
      customAdvanceAmount, // Manual advance amount (overrides percent)

      // Terms
      inclusions,
      exclusions,
      termsConditions,

      // Validity (days or custom date)
      validityDays, // 1-7 days (optional if customValidTill is provided)
      customValidTill, // ISO date string (optional, overrides validityDays)

      // Vendor message
      vendorMessage,

      // Template (optional)
      templateId,
    } = body;

    // Validate required fields
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    if (!vehicleName || !dailyRate || !securityDeposit) {
      return NextResponse.json(
        { error: 'Vehicle details and pricing are required' },
        { status: 400 }
      );
    }

    // Validate advance percent (20-50%)
    if (!customAdvanceAmount && (advancePercent < 20 || advancePercent > 50)) {
      return NextResponse.json(
        { error: 'Advance percentage must be between 20% and 50%' },
        { status: 400 }
      );
    }

    // Validate validity: either customValidTill or validityDays
    const useCustomValidity = customValidTill && !isNaN(new Date(customValidTill).getTime());
    const finalValidityDays = useCustomValidity ? null : (validityDays || 3);

    if (!useCustomValidity && (finalValidityDays! < 1 || finalValidityDays! > 7)) {
      return NextResponse.json(
        { error: 'Quote validity must be between 1 and 7 days' },
        { status: 400 }
      );
    }

    if (useCustomValidity && new Date(customValidTill) <= new Date()) {
      return NextResponse.json(
        { error: 'Custom validity date must be in the future' },
        { status: 400 }
      );
    }

    // Get the quote request
    const quoteRequest = await prisma.self_drive_quote_requests.findUnique({
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
    if (vendorFleetId && quoteRequest.pickupDate) {
      const sdStart = new Date(quoteRequest.pickupDate);
      const sdEnd = quoteRequest.dropDate ? new Date(quoteRequest.dropDate) : sdStart;
      const availability = await checkFleetAvailability(vendorFleetId, sdStart, sdEnd);
      if (!availability.available) {
        return NextResponse.json(
          { error: 'This vehicle is already booked for the requested dates. Please select a different vehicle.' },
          { status: 409 }
        );
      }
    }

    // Check if vendor already quoted
    const existingQuote = await prisma.self_drive_quotes.findFirst({
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

    // Calculate pricing (no GST, no platform fee)
    const totalDays = quoteRequest.totalDays;
    const baseAmount = dailyRate * totalDays;
    const gstAmount = 0; // GST removed
    const grandTotal = baseAmount + deliveryCharges + pickupCharges;
    const advanceAmount = customAdvanceAmount > 0
      ? Math.round(customAdvanceAmount)
      : Math.round(grandTotal * advancePercent / 100);

    // Set validity
    let validTill: Date;
    if (useCustomValidity) {
      validTill = new Date(customValidTill);
    } else {
      validTill = new Date();
      validTill.setDate(validTill.getDate() + finalValidityDays!);
    }
    // Calculate validityDays for storage (used by other parts of the system)
    const storedValidityDays = useCustomValidity
      ? Math.max(1, Math.ceil((validTill.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : finalValidityDays!;

    // Fetch fleet vehicle images if vendorFleetId is provided
    let finalVehicleImages = vehicleImages; // Use provided images if any
    if (vendorFleetId && !vehicleImages) {
      try {
        const fleetVehicle = await prisma.vendor_fleets.findUnique({
          where: { id: vendorFleetId },
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
    const withdrawnQuote = await prisma.self_drive_quotes.findFirst({
      where: { requestId, vendorId: vendorId, status: { in: ['WITHDRAWN', 'EXPIRED'] } },
      select: { id: true },
    });

    const quoteFields = {
      quoteNumber,
      vendorFleetId: vendorFleetId || null,
      vehicleModelId: vehicleModelId || null,
      vehicleName,
      vehicleBrand: vehicleBrand || null,
      vehicleCategory: vehicle_category || quoteRequest.vehicleCategory || null,
      vehicleType: vehicleType || null,
      transmission: transmission || null,
      fuelType: fuelType || null,
      seats: seats || null,
      registrationNumber: registrationNumber || null,
      vehicleYear: vehicleYear || null,
      vehicleImages: finalVehicleImages ? JSON.stringify(finalVehicleImages) : null,
      vehicleFeatures: vehicleFeatures ? JSON.stringify(vehicleFeatures) : null,
      dailyRate,
      totalPrice: totalPrice || null,
      baseAmount,
      gstAmount: 0,
      platformFee: 0,
      securityDeposit,
      grandTotal,
      kmLimitPerDay,
      extraKmRate,
      deliveryCharges,
      pickupCharges,
      advancePercent,
      advanceAmount,
      inclusions: inclusions ? JSON.stringify(inclusions) : null,
      exclusions: exclusions ? JSON.stringify(exclusions) : null,
      termsConditions: termsConditions ? JSON.stringify(termsConditions) : null,
      vendorMessage: vendorMessage || null,
      validTill,
      validityDays: storedValidityDays,
      status: 'SENT',
      sentAt: new Date(),
    };

    // Create the quote (or update existing withdrawn quote)
    const quote = withdrawnQuote
      ? await prisma.self_drive_quotes.update({
          where: { id: withdrawnQuote.id },
          data: {
            ...quoteFields,
            vendor_self_drive_templates: templateId ? { connect: { id: templateId } } : { disconnect: true },
          },
        })
      : await prisma.self_drive_quotes.create({
          data: { id: generateId(), requestId, vendorId: vendorId, templateId: templateId || null, ...quoteFields },
        });

    // Update quote request stats
    await prisma.self_drive_quote_requests.update({
      where: { id: requestId },
      data: {
        status: 'QUOTES_RECEIVED',
        totalQuotesReceived: { increment: 1 },
      },
    });

    // Create notification for customer - Store requestId so customer can fetch request details
    try {
      await prisma.notifications.create({
        data: {
          customerId: quoteRequest.customerId,
          title: '🚗 New Self-Drive Quote Received!',
          body: `${vendor.businessName} has sent you a quote for ${vehicleName}. Daily rate: ₹${dailyRate}. Total: ₹${grandTotal}. Valid till ${validTill.toLocaleDateString()}.`,
          type: 'quote',
          serviceType: 'self-drive',
          quoteId: requestId, // Use requestId for navigation
          isRead: false,
        },
      });
      logger.info('Notification created for self-drive quote', { requestId, quoteId: quote.id, customerId: quoteRequest.customerId });

      // Send FCM push notification
      await sendNotificationToCustomer(
        quoteRequest.customerId,
        {
          title: '🚗 New Self-Drive Quote Received!',
          body: `${vendor.businessName} has sent you a quote for ${vehicleName}. Daily rate: ₹${dailyRate}. Total: ₹${grandTotal}.`,
        },
        {
          type: 'new_quote',
          serviceType: 'self-drive',
          requestId: requestId,
          quoteId: quote.id,
        }
      );
    } catch (notifError) {
      // Log but don't fail the request if notification creation fails
      logger.error('Failed to create notification for self-drive quote', notifError);
    }

    return NextResponse.json({
      success: true,
      message: 'Quote submitted successfully',
      quote: {
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        vehicleName: quote.vehicleName,
        dailyRate: quote.dailyRate,
        grandTotal: quote.grandTotal,
        advanceAmount: quote.advanceAmount,
        advancePercent: quote.advancePercent,
        kmLimitPerDay: quote.kmLimitPerDay,
        extraKmRate: quote.extraKmRate,
        validTill: quote.validTill,
        status: quote.status,
      },
    });
  } catch (error: any) {
    logger.error('Failed to submit self-drive quote', error);
    return NextResponse.json(
      { error: 'Failed to submit quote', details: error?.message },
      { status: 500 }
    );
  }
}
