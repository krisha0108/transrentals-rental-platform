// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { prepareNotificationData } from '@/lib/utils/notification-helper';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate a unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

function generateQuoteNumber(): string {
  const prefix = 'TQ';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// GET - Get vendor's submitted truck quotes
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);

    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Unauthorized',
        quotes: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      }, { status: 401 });
    }

    const vendorId = auth.vendorId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1') || 1;
    const limit = parseInt(searchParams.get('limit') || '20') || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = { vendorId: vendorId };
    if (status && status !== 'all' && status !== '') {
      whereClause.status = status;
    }

    const [quotes, total] = await Promise.all([
      prisma.truck_quotes.findMany({
        where: whereClause,
        include: {
          truck_quote_requests: {
            select: {
              id: true,
              requestNumber: true,
              customerName: true,
              pickupCity: true,
              dropCity: true,
              pickupDate: true,
              status: true
            }
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.truck_quotes.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      quotes: quotes.map((q: any) => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        vehicleName: q.vehicleName,
        vehicleCategory: q.vehicleCategory,
        vehicleImages: q.vehicleImages,
        vehicleNumber: q.vehicleNumber,
        vehicleCapacity: q.vehicleCapacity,
        vendorFleetId: q.vendorFleetId,
        driverName: q.driverName,
        driverPhone: q.driverPhone,
        labourIncluded: q.labourIncluded,
        labourCount: q.labourCount,
        labourCharges: q.labourCharges,
        baseAmount: q.baseAmount,
        perKmRate: q.perKmRate,
        loadingCharges: q.loadingCharges,
        unloadingCharges: q.unloadingCharges,
        packagingCharges: q.packagingCharges,
        insuranceCharges: q.insuranceCharges,
        tollEstimate: q.tollEstimate,
        gstAmount: q.gstAmount,
        totalAmount: q.totalAmount,
        inclusions: q.inclusions,
        exclusions: q.exclusions,
        termsConditions: q.termsConditions,
        status: q.status,
        validTill: q.validTill,
        viewCount: q.viewCount || 0,
        request: q.truck_quote_requests || null,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor truck quotes', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch quotes',
      details: error?.message,
      quotes: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
    }, { status: 500 });
  }
}

// POST - Vendor submits a quote
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

    // Debug log FULL body
    console.log('=== TRUCK QUOTE API - FULL BODY ===');
    console.log(JSON.stringify(body, null, 2));
    console.log('Body keys:', Object.keys(body));
    console.log('vehicleName in body:', body.vehicleName);

    const {
      requestId, vendorFleetId, vehicle_category, vehicleName, vehicleNumber, vehicleCapacity,
      driverName, driverPhone, labourIncluded, labourCount, labourCharges,
      baseAmount, perKmRate, loadingCharges, unloadingCharges, packagingCharges,
      insuranceCharges, tollEstimate, gstAmount, vehicleImages, inclusions, exclusions, termsConditions,
      validityDays = 3,
    } = body;

    // Debug log to see what's being received after destructuring
    console.log('After destructuring - vehicleName:', vehicleName);

    const missingFields = [];
    if (!requestId) missingFields.push('requestId');
    if (!vehicleName) missingFields.push('vehicleName');
    if (baseAmount === undefined || baseAmount === null || baseAmount === '') missingFields.push('baseAmount');

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `Missing required fields: ${missingFields.join(', ')}`,
        received: { requestId, vehicleName, baseAmount },
        fullBody: body,
        bodyKeys: Object.keys(body)
      }, { status: 400 });
    }

    const quoteRequest = await prisma.truck_quote_requests.findUnique({ where: { id: requestId } });
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }
    if (quoteRequest.status !== 'PENDING' && quoteRequest.status !== 'QUOTES_RECEIVED') {
      return NextResponse.json({ error: 'This request is no longer accepting quotes' }, { status: 400 });
    }

    const existingQuote = await prisma.truck_quotes.findFirst({ where: { requestId, vendorId: vendorId } });
    if (existingQuote) {
      return NextResponse.json({ error: 'You have already submitted a quote for this request' }, { status: 400 });
    }

    const quoteNumber = generateQuoteNumber();
    const totalAmount = (baseAmount || 0) + (labourCharges || 0) + (loadingCharges || 0) + (unloadingCharges || 0) + (packagingCharges || 0) + (insuranceCharges || 0) + (tollEstimate || 0) + (gstAmount || 0);
    const validTill = new Date();
    validTill.setDate(validTill.getDate() + validityDays);

    // Fetch fleet vehicle images if vendorFleetId is provided and no manual images
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

    const quote = await prisma.truck_quotes.create({
      data: {
        id: generateId(),
        quoteNumber,
        requestId,
        vendorId: vendorId,
        vendorFleetId: vendorFleetId || null,
        vehicleCategory: vehicle_category || quoteRequest.vehicleCategory,
        vehicleName,
        vehicleNumber: vehicleNumber || null,
        vehicleCapacity: vehicleCapacity || null,
        vehicleImages: finalVehicleImages ? JSON.stringify(finalVehicleImages) : null,
        driverName: driverName || null,
        driverPhone: driverPhone || null,
        labourIncluded: labourIncluded || false,
        labourCount: labourCount || null,
        labourCharges: labourCharges || 0,
        baseAmount,
        perKmRate: perKmRate || null,
        loadingCharges: loadingCharges || 0,
        unloadingCharges: unloadingCharges || 0,
        packagingCharges: packagingCharges || 0,
        insuranceCharges: insuranceCharges || 0,
        tollEstimate: tollEstimate || 0,
        gstAmount: gstAmount || 0,
        totalAmount,
        inclusions: Array.isArray(inclusions) ? JSON.stringify(inclusions) : (inclusions || '[]'),
        exclusions: Array.isArray(exclusions) ? JSON.stringify(exclusions) : (exclusions || '[]'),
        termsConditions: Array.isArray(termsConditions) ? JSON.stringify(termsConditions) : (termsConditions || '[]'),
        validTill,
        status: 'SENT',
      },
    });

    await prisma.truck_quote_requests.update({
      where: { id: requestId },
      data: { status: 'QUOTES_RECEIVED', totalQuotesReceived: { increment: 1 } },
    });

    // Send notification to customer - Store requestId so customer can fetch request details
    try {
      const notificationTitle = '🚛 New Truck/Transporter Quote Received!';
      const notificationBody = `${vendor.businessName} has sent you a quote for ${vehicleName}. Total: ₹${totalAmount.toLocaleString()}. Valid till ${validTill.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}. View now!`;

      // Save in-app notification
      await prisma.notifications.create({
        data: prepareNotificationData({
          customerId: quoteRequest.customerId,
          title: notificationTitle,
          body: notificationBody,
          type: 'quote',
          serviceType: 'truck',
          quoteId: requestId, // Use requestId for navigation
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
          requestId: requestId,
          quoteId: quote.id,
          quoteNumber: quote.quoteNumber,
          action: 'quote_received',
        }
      );

      logger.info(`Notification sent for truck/transporter quote - Quote: ${quote.quoteNumber}, Request: ${requestId}, Customer: ${quoteRequest.customerId}`);
    } catch (notifError) {
      // Log error but don't fail the request
      logger.error('Failed to send truck/transporter quote notification', notifError);
    }

    return NextResponse.json({
      success: true,
      message: 'Quote submitted successfully',
      quote: { id: quote.id, quoteNumber: quote.quoteNumber, totalAmount: quote.totalAmount, validTill: quote.validTill, status: quote.status },
    });
  } catch (error: any) {
    logger.error('Failed to submit truck quote', error);
    return NextResponse.json({ error: 'Failed to submit quote', details: error?.message }, { status: 500 });
  }
}
