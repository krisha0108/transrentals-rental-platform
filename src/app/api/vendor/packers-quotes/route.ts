// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate a unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

function generateQuoteNumber(): string {
  const prefix = 'PQ';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// GET - Get Packers Quotes submitted by vendor
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);

    if (!auth.authenticated || !auth.vendorId) {
      logger.warn('Unauthorized packers quotes access', { error: auth.error });
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const vendorId = auth.vendorId;
    logger.info('Fetching packers quotes for vendor', { vendorId });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // PAGINATION PARAMS
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // DATE FILTER PARAMS
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let whereClause: any = { vendorId: vendorId };
    if (status && status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    // DATE FILTERING - Add to where clause
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

    logger.info('Query params', { status, page, limit, startDate, endDate, whereClause });

    let quotes, total;
    try {
      [quotes, total] = await Promise.all([
        prisma.packers_quotes.findMany({
          where: whereClause,
          include: {
            packers_quote_requests: {
              select: {
                id: true,
                requestNumber: true,
                customerName: true,
                shiftingType: true,
                pickupCity: true,
                dropCity: true,
                preferredDate: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.packers_quotes.count({ where: whereClause }),
      ]);

      logger.info('Packers quotes fetched successfully', { total, returned: quotes.length });
    } catch (dbError: any) {
      logger.error('Database error fetching packers quotes', {
        error: dbError?.message,
        code: dbError?.code,
        meta: dbError?.meta,
        vendorId,
        whereClause
      });
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      quotes: quotes.map((q: any) => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        requestId: q.requestId,
        vendorId: q.vendorId,
        vendorFleetId: q.vendorFleetId,
        packingCharges: q.packingCharges,
        loadingCharges: q.loadingCharges,
        transportCharges: q.transportCharges,
        unloadingCharges: q.unloadingCharges,
        unpackingCharges: q.unpackingCharges,
        storageCharges: q.storageCharges,
        insuranceCharges: q.insuranceCharges,
        materialCharges: q.materialCharges,
        gstAmount: q.gstAmount,
        totalAmount: q.totalAmount,
        teamSize: q.teamSize,
        vehicleType: q.vehicleType,
        vehicleImages: q.vehicleImages,
        estimatedDuration: q.estimatedDuration,
        packingMaterials: q.packingMaterials,
        inclusions: q.inclusions,
        exclusions: q.exclusions,
        termsConditions: q.termsConditions,
        status: q.status,
        validTill: q.validTill,
        validityDays: q.validityDays,
        request: q.packers_quote_requests,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor packers quotes', error);
    return NextResponse.json({ error: 'Failed to fetch quotes', details: error?.message }, { status: 500 });
  }
}

// POST - Submit a new Packers Quote
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
      packingCharges,
      loadingCharges,
      transportCharges,
      unloadingCharges,
      unpackingCharges,
      storageCharges,
      insuranceCharges,
      materialCharges,
      gstAmount,
      teamSize,
      estimatedDays,
      vehicleType,
      vehicleCount,
      fleetVehicleId,
      vehicleImages,
      packingMaterials,
      inclusions,
      exclusions,
      termsConditions,
      validityDays,
      notes,
    } = body;

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Verify request exists and is open for quotes
    const quoteRequest = await prisma.packers_quote_requests.findUnique({
      where: { id: requestId },
    });

    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    if (quoteRequest.status !== 'PENDING' && quoteRequest.status !== 'QUOTES_RECEIVED') {
      return NextResponse.json({ error: 'This request is no longer accepting quotes' }, { status: 400 });
    }

    if (new Date() > new Date(quoteRequest.quotesOpenTill)) {
      return NextResponse.json({ error: 'Quote submission window has closed' }, { status: 400 });
    }

    // Check if vendor already submitted a quote
    const existingQuote = await prisma.packers_quotes.findFirst({
      where: { requestId, vendorId: vendorId },
    });

    if (existingQuote) {
      return NextResponse.json({ error: 'You have already submitted a quote for this request' }, { status: 400 });
    }

    // Calculate total
    const totalAmount =
      (packingCharges || 0) +
      (loadingCharges || 0) +
      (transportCharges || 0) +
      (unloadingCharges || 0) +
      (unpackingCharges || 0) +
      (storageCharges || 0) +
      (insuranceCharges || 0) +
      (materialCharges || 0) +
      (gstAmount || 0);

    if (totalAmount <= 0) {
      return NextResponse.json({ error: 'Total amount must be greater than zero' }, { status: 400 });
    }

    const quoteNumber = generateQuoteNumber();
    const validTill = new Date();
    validTill.setDate(validTill.getDate() + (validityDays || 7));

    // Get vehicle type from fleet if fleetVehicleId provided, otherwise use form value
    let finalVehicleType = vehicleType || '';
    let finalVehicleImages = vehicleImages; // Use provided images if any

    if (fleetVehicleId) {
      const fleetVehicle = await prisma.vendor_fleets.findUnique({
        where: { id: fleetVehicleId },
        include: {
          chauffeur_vehicle_categories: { select: { name: true } },
          vehicle_models: {
            select: {
              sideImage: true, // Featured image from admin
            },
          },
        },
      });

      if (fleetVehicle) {
        // Set vehicle type from fleet
        if (fleetVehicle.chauffeur_vehicle_categories?.name) {
          const count = vehicleCount || 1;
          finalVehicleType = count > 1
            ? `${count} x ${fleetVehicle.chauffeur_vehicle_categories.name}`
            : fleetVehicle.chauffeur_vehicle_categories.name;
        }

        // Fetch fleet vehicle images if no manual images provided
        if (!vehicleImages) {
          try {
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
          } catch (error) {
            logger.warn('Failed to fetch fleet vehicle images', error);
            // Continue without images - don't fail the quote submission
          }
        }
      }
    }

    // If still no vehicle type, construct from vehicleCount
    if (!finalVehicleType) {
      const count = vehicleCount || 1;
      finalVehicleType = count > 1 ? `${count} Vehicles` : '1 Vehicle';
    }

    // Convert estimatedDays to estimatedDuration string
    const days = estimatedDays || 1;
    const estimatedDuration = days === 1 ? '1 day' : `${days} days`;

    const quote = await prisma.$transaction(async (tx) => {
      const newQuote = await tx.packers_quotes.create({
        data: {
          id: generateId(),
          quoteNumber,
          requestId,
          vendorId: vendorId,
          vendorFleetId: fleetVehicleId || null,
          packingCharges: packingCharges || 0,
          loadingCharges: loadingCharges || 0,
          transportCharges: transportCharges || 0,
          unloadingCharges: unloadingCharges || 0,
          unpackingCharges: unpackingCharges || 0,
          storageCharges: storageCharges || 0,
          insuranceCharges: insuranceCharges || 0,
          materialCharges: materialCharges || 0,
          gstAmount: gstAmount || 0,
          totalAmount,
          teamSize: teamSize || 3,
          vehicleType: finalVehicleType,
          vehicleImages: finalVehicleImages ? JSON.stringify(finalVehicleImages) : null,
          estimatedDuration,
          packingMaterials: Array.isArray(packingMaterials) ? JSON.stringify(packingMaterials) : (packingMaterials && packingMaterials.trim() !== '' ? packingMaterials : '[]'),
          inclusions: Array.isArray(inclusions) ? JSON.stringify(inclusions) : (inclusions && inclusions.trim() !== '' ? inclusions : '[]'),
          exclusions: Array.isArray(exclusions) ? JSON.stringify(exclusions) : (exclusions && exclusions.trim() !== '' ? exclusions : '[]'),
          termsConditions: Array.isArray(termsConditions) ? JSON.stringify(termsConditions) : (termsConditions && termsConditions.trim() !== '' ? termsConditions : '[]'),
          status: 'SENT',
          validTill,
        },
      });

      // Update request status and quote count
      await tx.packers_quote_requests.update({
        where: { id: requestId },
        data: {
          status: 'QUOTES_RECEIVED',
          totalQuotesReceived: { increment: 1 },
        },
      });

      return newQuote;
    });

    return NextResponse.json({
      success: true,
      message: 'Quote submitted successfully',
      quote: {
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        totalAmount: quote.totalAmount,
        status: quote.status,
        validTill: quote.validTill,
      },
    });
  } catch (error: any) {
    logger.error('Failed to submit packers quote', error);
    return NextResponse.json({ error: 'Failed to submit quote', details: error?.message }, { status: 500 });
  }
}

// PATCH - Update a Packers Quote (before accepted)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);

    if (!auth.authenticated || !auth.vendorId) {

      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    }

    const vendorId = auth.vendorId;

    const body = await request.json();
    const { quoteId, ...updateData } = body;

    if (!quoteId) {
      return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
    }

    const quote = await prisma.packers_quotes.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (quote.vendorId !== vendorId) {
      return NextResponse.json({ error: 'Unauthorized to update this quote' }, { status: 403 });
    }

    if (quote.status !== 'DRAFT' && quote.status !== 'SENT') {
      return NextResponse.json({ error: 'Cannot update quote in current status' }, { status: 400 });
    }

    // Calculate new total if charges are updated
    const totalAmount =
      (updateData.packingCharges ?? quote.packingCharges) +
      (updateData.loadingCharges ?? quote.loadingCharges) +
      (updateData.transportCharges ?? quote.transportCharges) +
      (updateData.unloadingCharges ?? quote.unloadingCharges) +
      (updateData.unpackingCharges ?? quote.unpackingCharges) +
      (updateData.storageCharges ?? quote.storageCharges) +
      (updateData.insuranceCharges ?? quote.insuranceCharges) +
      (updateData.materialCharges ?? quote.materialCharges) +
      (updateData.gstAmount ?? quote.gstAmount);

    const updatedQuote = await prisma.packers_quotes.update({
      where: { id: quoteId },
      data: {
        ...updateData,
        totalAmount,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Quote updated successfully',
      quote: {
        id: updatedQuote.id,
        quoteNumber: updatedQuote.quoteNumber,
        totalAmount: updatedQuote.totalAmount,
        status: updatedQuote.status,
      },
    });
  } catch (error: any) {
    logger.error('Failed to update packers quote', error);
    return NextResponse.json({ error: 'Failed to update quote', details: error?.message }, { status: 500 });
  }
}
