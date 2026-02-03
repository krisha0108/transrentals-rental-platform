import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * GET - Fetch luxury booking details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params;
    const bookingId = resolvedParams.id;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Fetch booking with all related data
    const booking = await prisma.luxury_bookings.findUnique({
      where: { id: bookingId },
      include: {
        customers: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        locations: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        vendors_luxury_bookings_assignedVendorIdTovendors: {
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
        vendors_luxury_bookings_acceptedVendorIdTovendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            email: true,
            logo: true,
            rating: true,
            totalRatings: true,
          },
        },
        luxury_quotes: {
          select: {
            id: true,
            quoteNumber: true,
            vehicleName: true,
            vehicleNumber: true,
            vehicleModel: true,
            vehicleYear: true,
            vehicleFeatures: true,
            vehicleImages: true,
            baseAmount: true,
            chauffeurCharges: true,
            decorationCharges: true,
            gstAmount: true,
            totalAmount: true,
            advanceAmount: true,
            advancePercent: true,
            inclusions: true,
            exclusions: true,
            termsConditions: true,
            vendorMessage: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields
    let vehicleImages = [];
    if (booking.vehicleImages) {
      try {
        vehicleImages = typeof booking.vehicleImages === 'string'
          ? JSON.parse(booking.vehicleImages)
          : booking.vehicleImages;
      } catch (e) {
        vehicleImages = [];
      }
    }

    let inclusions = [];
    let exclusions = [];
    if (booking.luxury_quotes) {
      if (booking.luxury_quotes.inclusions) {
        try {
          inclusions = typeof booking.luxury_quotes.inclusions === 'string'
            ? JSON.parse(booking.luxury_quotes.inclusions)
            : booking.luxury_quotes.inclusions;
        } catch (e) {
          inclusions = [];
        }
      }
      if (booking.luxury_quotes.exclusions) {
        try {
          exclusions = typeof booking.luxury_quotes.exclusions === 'string'
            ? JSON.parse(booking.luxury_quotes.exclusions)
            : booking.luxury_quotes.exclusions;
        } catch (e) {
          exclusions = [];
        }
      }
    }

    // Calculate balance amount
    const balanceAmount = booking.grandTotal - (booking.advancePaid || 0);

    // Format response
    const response = {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      customerId: booking.customerId,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      tripType: booking.tripType,
      eventType: booking.eventType,
      occasion: booking.occasion,
      carCategory: booking.carCategory,
      carCategoryName: booking.carCategoryName,
      vehicleNumber: booking.vehicleNumber,
      vehicleModel: booking.vehicleModel,
      vehicleBrand: booking.vehicleBrand,
      vehicleColor: booking.vehicleColor,
      vehicleImages,
      pickupCity: booking.pickupCity,
      pickupAddress: booking.pickupAddress,
      dropCity: booking.dropCity,
      dropAddress: booking.dropAddress,
      pickupDate: booking.pickupDate,
      pickupTime: booking.pickupTime,
      returnDate: booking.returnDate,
      returnTime: booking.returnTime,
      totalDays: booking.totalDays,
      totalHours: booking.totalHours,
      needDecoration: booking.needDecoration,
      decorationType: booking.decorationType,
      needChauffeur: booking.needChauffeur,
      chauffeurAttire: booking.chauffeurAttire,
      customerNotes: booking.customerNotes,
      driverName: booking.driverName,
      driverPhone: booking.driverPhone,
      driverPhoto: booking.driverPhoto,
      baseFare: booking.baseFare,
      decorationCharges: booking.decorationCharges,
      chauffeurCharges: booking.chauffeurCharges,
      gstAmount: booking.gstAmount,
      grandTotal: booking.grandTotal,
      advanceAmount: booking.advanceAmount,
      advancePaid: booking.advancePaid,
      advancePercent: booking.advancePercent,
      balanceAmount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      tripStartOtp: booking.tripStartOtp,
      tripEndOtp: booking.tripEndOtp,
      tripStartedAt: booking.tripStartedAt,
      tripEndedAt: booking.tripEndedAt,
      actualHours: booking.actualHours,
      extraHourCharges: booking.extraHourCharges,
      finalAmount: booking.finalAmount,
      completedAt: booking.completedAt,
      cancelledAt: booking.cancelledAt,
      cancelledBy: booking.cancelledBy,
      cancellationReason: booking.cancellationReason,
      rating: booking.rating,
      review: booking.review,
      driverRating: booking.driverRating,
      vehicleRating: booking.vehicleRating,
      acceptedAt: booking.acceptedAt,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      customer: booking.customers,
      location: booking.locations,
      vendor: booking.vendors_luxury_bookings_assignedVendorIdTovendors || booking.vendors_luxury_bookings_acceptedVendorIdTovendors,
      quote: booking.luxury_quotes ? {
        ...booking.luxury_quotes,
        inclusions,
        exclusions,
      } : null,
    };

    return NextResponse.json({
      success: true,
      booking: response,
    });
  } catch (error: any) {
    logger.error('Failed to fetch luxury booking details', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch booking details', details: error?.message },
      { status: 500 }
    );
  }
}
