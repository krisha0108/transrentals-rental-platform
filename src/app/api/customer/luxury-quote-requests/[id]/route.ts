import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * GET - Get luxury quote request details with all quotes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params;
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    // Build where clause
    const whereClause: any = {
      id: resolvedParams.id,
    };

    // Add customer identification - at least one must match
    if (customerId || phone || email) {
      whereClause.OR = [];
      if (customerId) {
        whereClause.OR.push({ customerId: customerId });
      }
      if (phone) {
        whereClause.OR.push({ customerPhone: phone });
      }
      if (email) {
        whereClause.OR.push({ customerEmail: email });
      }
    }

    logger.info('Fetching luxury quote request', {
      requestId: resolvedParams.id,
      customerId,
      phone,
      email,
    });

    // Find the quote request
    const quoteRequest = await prisma.luxury_quote_requests.findFirst({
      where: whereClause,
      include: {
        luxury_quotes: {
          where: { status: { not: 'DRAFT' } },
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
                logo: true,
                rating: true,
                totalRatings: true,
                address: true,
                city: true,
                state: true,
              },
            },
          },
          orderBy: { totalAmount: 'asc' },
        },
        location: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
      },
    });

    if (!quoteRequest) {
      return NextResponse.json(
        { success: false, message: 'Quote request not found' },
        { status: 404 }
      );
    }

    // Mark quotes as viewed if not already
    if (quoteRequest.quotesViewed < quoteRequest.totalQuotesReceived) {
      await prisma.luxury_quote_requests.update({
        where: { id: resolvedParams.id },
        data: { quotesViewed: quoteRequest.luxury_quotes.length },
      });

      // Update individual quote status from SENT to VIEWED
      await prisma.luxury_quotes.updateMany({
        where: {
          requestId: resolvedParams.id,
          status: 'SENT',
        },
        data: { status: 'VIEWED' },
      });
    }

    const result = {
      id: quoteRequest.id,
      requestNumber: quoteRequest.requestNumber,
      customerName: quoteRequest.customerName,
      customerEmail: quoteRequest.customerEmail,
      customerPhone: quoteRequest.customerPhone,
      tripType: quoteRequest.tripType,
      occasion: quoteRequest.occasion,
      chauffeur_vehicle_categories: quoteRequest.vehicle_category,
      vehicleCategoryName: quoteRequest.vehicleCategoryName,
      specificModel: quoteRequest.specificModel,
      passengers: quoteRequest.passengers,
      pickupCity: quoteRequest.pickupCity,
      pickupAddress: quoteRequest.pickupAddress,
      dropCity: quoteRequest.dropCity,
      dropAddress: quoteRequest.dropAddress,
      routeDetails: quoteRequest.routeDetails,
      pickupDate: quoteRequest.pickupDate,
      pickupTime: quoteRequest.pickupTime,
      returnDate: quoteRequest.returnDate,
      returnTime: quoteRequest.returnTime,
      tripDays: quoteRequest.tripDays,
      tripHours: quoteRequest.tripHours,
      packageType: quoteRequest.packageType,
      requirements: quoteRequest.requirements,
      needChauffeur: quoteRequest.needChauffeur,
      needDecoration: quoteRequest.needDecoration,
      decorationType: quoteRequest.decorationType,
      budgetMin: quoteRequest.budgetMin,
      budgetMax: quoteRequest.budgetMax,
      status: quoteRequest.status,
      totalQuotesReceived: quoteRequest.totalQuotesReceived,
      quotesViewed: quoteRequest.luxury_quotes.length,
      location: quoteRequest.location,
      quotes: quoteRequest.luxury_quotes.map((q) => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        vendorId: q.vendorId,
        vendor: q.vendor,
        chauffeur_vehicle_categories: q.vehicle_category,
        vehicleName: q.vehicleName,
        vehicleNumber: q.vehicleNumber,
        vehicle_models: q.vehicle_models,
        vehicleYear: q.vehicleYear,
        vehicleFeatures: (() => {
          try {
            if (!q.vehicleFeatures) return null;
            if (typeof q.vehicleFeatures === 'string') {
              if (q.vehicleFeatures.startsWith('[') || q.vehicleFeatures.startsWith('{')) {
                return JSON.parse(q.vehicleFeatures);
              }
              return q.vehicleFeatures;
            }
            return q.vehicleFeatures;
          } catch (e) {
            logger.error('Failed to parse vehicleFeatures', { error: e, quoteId: q.id });
            return null;
          }
        })(),
        vehicleImages: (() => {
          try {
            if (!q.vehicleImages) return [];
            if (typeof q.vehicleImages === 'string') {
              if (q.vehicleImages.startsWith('[') || q.vehicleImages.startsWith('{')) {
                return JSON.parse(q.vehicleImages);
              }
              return [];
            }
            return q.vehicleImages;
          } catch (e) {
            logger.error('Failed to parse vehicleImages', { error: e, quoteId: q.id });
            return [];
          }
        })(),
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
        vendorMessage: q.vendorMessage,
        termsConditions: q.termsConditions,
        inclusions: q.inclusions,
        exclusions: q.exclusions,
        status: q.status,
        validTill: q.validTill,
        createdAt: q.createdAt,
      })),
      expiresAt: quoteRequest.expiresAt,
      quotesOpenTill: quoteRequest.quotesOpenTill,
      createdAt: quoteRequest.createdAt,
      updatedAt: quoteRequest.updatedAt,
    };

    return NextResponse.json({
      success: true,
      quoteRequest: result,
    });
  } catch (error: any) {
    logger.error('Failed to fetch luxury quote request details', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch quote request', details: error?.message },
      { status: 500 }
    );
  }
}
