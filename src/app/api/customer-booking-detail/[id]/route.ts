// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Unified endpoint to fetch booking details (works for all types including quote requests)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 });
    }

    // Try to find in different tables
    // 1. Try bus quote requests first
    const busQuoteRequest = await prisma.bus_quote_requests.findUnique({
      where: { id },
      include: {
        bus_quotes: {
          include: {
            vendors: {
              select: {
                businessName: true,
                phone: true,
                rating: true,
                totalRatings: true,
              },
            },
          },
        },
      },
    });

    if (busQuoteRequest) {
      return NextResponse.json({
        success: true,
        type: 'bus_quote_request',
        booking: null,
        quoteRequest: {
          id: busQuoteRequest.id,
          requestNumber: busQuoteRequest.requestNumber,
          tripType: busQuoteRequest.tripType,
          chauffeur_vehicle_categories: busQuoteRequest.vehicle_category,
          vehicleCategoryName: busQuoteRequest.vehicleCategoryName,
          passengers: busQuoteRequest.passengers,
          pickupCity: busQuoteRequest.pickupCity,
          pickupAddress: busQuoteRequest.pickupAddress,
          dropCity: busQuoteRequest.dropCity,
          dropAddress: busQuoteRequest.dropAddress,
          pickupDate: busQuoteRequest.pickupDate,
          pickupTime: busQuoteRequest.pickupTime,
          returnDate: busQuoteRequest.returnDate,
          returnTime: busQuoteRequest.returnTime,
          tripDays: busQuoteRequest.tripDays,
          requirements: busQuoteRequest.requirements,
          needAC: busQuoteRequest.needAC,
          needLuxury: busQuoteRequest.needLuxury,
          needSleeper: busQuoteRequest.needSleeper,
          status: busQuoteRequest.status,
          totalQuotesReceived: busQuoteRequest.totalQuotesReceived,
          expiresAt: busQuoteRequest.expiresAt,
          createdAt: busQuoteRequest.createdAt,
          quotes: busQuoteRequest.bus_quotes.map((q) => ({
            id: q.id,
            quoteNumber: q.quoteNumber,
            vehicleName: q.vehicleName,
            chauffeur_vehicle_categories: q.vehicle_category,
            seats: q.seats,
            vehicleFeatures: q.vehicleFeatures,
            vehicleImages: q.vehicleImages,
            baseAmount: q.baseAmount,
            driverAllowance: q.driverAllowance,
            nightHaltCharges: q.nightHaltCharges,
            tollEstimate: q.tollEstimate,
            permitCharges: q.permitCharges,
            gstAmount: q.gstAmount,
            totalAmount: q.totalAmount,
            inclusions: q.inclusions,
            exclusions: q.exclusions,
            validTill: q.validTill,
            status: q.status,
            vendor: q.vendor,
            sentAt: q.sentAt,
          })),
        },
        redirectTo: 'BusQuoteRequestDetail',
      });
    }

    // 2. Try bus bookings
    const busBooking = await prisma.bus_bookings.findUnique({
      where: { id },
      include: {
        vendors: {
          select: {
            businessName: true,
            phone: true,
          },
        },
      },
    });

    if (busBooking) {
      return NextResponse.json({
        success: true,
        type: 'bus_booking',
        booking: busBooking,
        redirectTo: 'BusBookingDetail',
      });
    }

    // 3. Try truck bookings
    const truckBooking = await prisma.truck_bookings.findUnique({
      where: { id },
      include: {
        vendors: {
          select: {
            businessName: true,
            phone: true,
          },
        },
        quoteRequest: {
          select: {
            requestNumber: true,
          },
        },
      },
    });

    if (truckBooking) {
      return NextResponse.json({
        success: true,
        type: 'truck_booking',
        booking: truckBooking,
        redirectTo: 'TruckBookingDetail',
      });
    }

    // 4. Try truck quote requests
    const truckQuoteRequest = await prisma.truck_quote_requests.findUnique({
      where: { id },
      include: {
        truck_quotes: {
          include: {
            vendors: {
              select: {
                businessName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (truckQuoteRequest) {
      return NextResponse.json({
        success: true,
        type: 'truck_quote_request',
        quoteRequest: truckQuoteRequest,
        redirectTo: 'TruckQuoteRequestDetail',
      });
    }

    // 5. Try equipment bookings
    const equipmentBooking = await prisma.equipment_bookings.findUnique({
      where: { id },
      include: {
        vendors: {
          select: {
            businessName: true,
            phone: true,
          },
        },
        quoteRequest: {
          select: {
            requestNumber: true,
          },
        },
      },
    });

    if (equipmentBooking) {
      return NextResponse.json({
        success: true,
        type: 'equipment_booking',
        booking: equipmentBooking,
        redirectTo: 'EquipmentBookingDetail',
      });
    }

    // 6. Try equipment quote requests
    const equipmentQuoteRequest = await prisma.equipment_quote_requests.findUnique({
      where: { id },
      include: {
        equipment_quotes: {
          include: {
            vendors: {
              select: {
                businessName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (equipmentQuoteRequest) {
      return NextResponse.json({
        success: true,
        type: 'equipment_quote_request',
        quoteRequest: equipmentQuoteRequest,
        redirectTo: 'EquipmentQuoteRequestDetail',
      });
    }

    // 7. Try packers bookings
    const packersBooking = await prisma.packers_bookings.findUnique({
      where: { id },
      include: {
        vendors: {
          select: {
            businessName: true,
            phone: true,
          },
        },
        quoteRequest: {
          select: {
            requestNumber: true,
          },
        },
      },
    });

    if (packersBooking) {
      return NextResponse.json({
        success: true,
        type: 'packers_booking',
        booking: packersBooking,
        redirectTo: 'PackersBookingDetail',
      });
    }

    // 8. Try packers quote requests
    const packersQuoteRequest = await prisma.packers_quote_requests.findUnique({
      where: { id },
      include: {
        packers_quotes: {
          include: {
            vendors: {
              select: {
                businessName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (packersQuoteRequest) {
      return NextResponse.json({
        success: true,
        type: 'packers_quote_request',
        quoteRequest: packersQuoteRequest,
        redirectTo: 'PackersQuoteRequestDetail',
      });
    }

    const luxuryQuoteRequest = await prisma.luxury_quote_requests.findUnique({
      where: { id },
    });

    if (luxuryQuoteRequest) {
      return NextResponse.json({
        success: true,
        type: 'luxury_quote_request',
        quoteRequest: luxuryQuoteRequest,
        redirectTo: 'LuxuryQuoteRequestDetail',
      });
    }

    // Not found in any table
    return NextResponse.json(
      { success: false, error: 'Booking or quote request not found' },
      { status: 404 }
    );
  } catch (error: any) {
    logger.error('Failed to fetch booking details', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch details', details: error?.message },
      { status: 500 }
    );
  }
}
