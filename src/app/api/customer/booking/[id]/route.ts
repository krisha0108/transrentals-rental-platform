import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

/**
 * GET - Get single booking details from local trans_cms database
 * Supports BikeBooking, CarBooking, and ChauffeurBooking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Try to find the booking in each table
    let booking: any = null;
    let bookingType: 'bike' | 'car' | 'chauffeur' | null = null;

    // Try BikeBooking first
    try {
      booking = await prisma.bike_bookings.findUnique({
        where: { id: bookingId },
        include: {
          locations: { select: { name: true } },
          vendors_bike_bookings_assignedVendorIdTovendors: {
            select: {
              id: true,
              businessName: true,
              phone: true,
              email: true,
              logo: true,
            },
          },
          vendors_bike_bookings_acceptedVendorIdTovendors: {
            select: {
              id: true,
              businessName: true,
              phone: true,
              email: true,
              logo: true,
            },
          },
          vehicle_models: {
            select: { sideImage: true, images: true }
          },
        },
      });
      if (booking) bookingType = 'bike';
    } catch (e) {
      logger.error('Error fetching bike booking', e);
    }

    // Try CarBooking if not found
    if (!booking) {
      try {
        booking = await prisma.car_bookings.findUnique({
          where: { id: bookingId },
          include: {
            locations: { select: { name: true } },
            vendors_car_bookings_assignedVendorIdTovendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
                logo: true,
              },
            },
            vendors_car_bookings_acceptedVendorIdTovendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
                logo: true,
              },
            },
          },
        });
        if (booking) bookingType = 'car';
      } catch (e) {
        logger.error('Error fetching car booking', e);
      }
    }

    // Try ChauffeurBooking if not found
    if (!booking) {
      try {
        booking = await prisma.chauffeur_bookings.findUnique({
          where: { id: bookingId },
          include: {
            locations: { select: { name: true } },
            vendors_chauffeur_bookings_assignedVendorIdTovendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
                logo: true,
              },
            },
            vendors_chauffeur_bookings_acceptedVendorIdTovendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
                logo: true,
              },
            },
          },
        });
        if (booking) bookingType = 'chauffeur';
      } catch (e) {
        logger.error('Error fetching chauffeur booking', e);
      }
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Map status to display status
    const statusMap: Record<string, string> = {
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

    // Transform booking to common format
    const transformedBooking = transformBooking(booking, bookingType!, statusMap);

    // Build vendor info for quotations (if vendor has accepted)
    const quotations: any[] = [];
    const acceptedVendor = booking.vendors_bike_bookings_acceptedVendorIdTovendors || booking.vendors_car_bookings_acceptedVendorIdTovendors || booking.vendors_chauffeur_bookings_acceptedVendorIdTovendors;
    const assignedVendor = booking.vendors_bike_bookings_assignedVendorIdTovendors || booking.vendors_car_bookings_assignedVendorIdTovendors || booking.vendors_chauffeur_bookings_assignedVendorIdTovendors;
    if (acceptedVendor || assignedVendor) {
      const vendor = acceptedVendor || assignedVendor;
      const totalAmount = bookingType === 'bike'
        ? booking.totalAmount
        : booking.grandTotal;

      quotations.push({
        id: 1,
        booking_id: bookingId,
        vendor_id: vendor.id,
        vendors: {
          id: vendor.id,
          name: vendor.businessName,
          company_name: vendor.businessName,
          phone: vendor.phone,
          email: vendor.email,
          image: vendor.logo,
        },
        price: totalAmount || 0,
        min_price: totalAmount || 0,
        status: booking.status === 'ACCEPTED' || booking.status === 'COMPLETED' || booking.status === 'IN_PROGRESS' ? 1 : 0,
        payment_status: booking.paymentStatus === 'PAID' ? 'advance_done' : 'pending',
        created_at: booking.acceptedAt?.toISOString() || booking.createdAt.toISOString(),
      });
    }

    // Build assigned vehicle info for chauffeur bookings
    let assignedVehicle = null;
    if (bookingType === 'chauffeur' && booking.vehicleNumber) {
      assignedVehicle = {
        id: 1,
        vehicle_name: booking.vehicle_models || booking.carCategoryName || 'Assigned Vehicle',
        vehicle_type: booking.carCategory || 'car',
        model: booking.vehicle_models || '',
        reg_no: booking.vehicleNumber || '',
        image: booking.driverPhoto || '', // Fallback or dedicated assigned vehicle image if available in schema
      };
    }

    // Build assigned driver info for chauffeur bookings
    let assignedDriver = null;
    if (bookingType === 'chauffeur' && booking.driverName) {
      assignedDriver = {
        id: 1,
        name: booking.driverName,
        phone: booking.driverPhone || '',
        image: booking.driverPhoto || '',
      };
    }

    // Provide redirect URL to the service-specific booking page
    // car (CarBooking) = Self-drive → /customer/car-bookings/
    // chauffeur (ChauffeurBooking) = Car with driver → /customer/car-rental-bookings/
    let redirectUrl = null;
    if (bookingType === 'bike') {
      redirectUrl = `/customer/bike-bookings/${booking.bookingNumber}`;
    } else if (bookingType === 'car') {
      // Self-drive car bookings
      redirectUrl = `/customer/car-bookings/${booking.bookingNumber}`;
    } else if (bookingType === 'chauffeur') {
      // Car with driver bookings
      redirectUrl = `/customer/car-rental-bookings/${booking.bookingNumber}`;
    }

    return NextResponse.json({
      success: true,
      booking: transformedBooking,
      bookingNumber: booking.bookingNumber,
      bookingType,
      redirectUrl,
      quotations,
      assigned_vehicle: assignedVehicle,
      assigned_driver: assignedDriver,
      vehicleImage: (bookingType === 'bike')
        ? ((booking as any).vehicle_models?.sideImage || (booking as any).vehicle_models?.images?.split(',')[0] || '/images/fleet/default-bike.jpg')
        : (bookingType === 'car')
          ? '/images/fleet/default-car.jpg'
          : '/images/fleet/default-car.jpg',
    });
  } catch (error) {
    logger.error('Customer booking detail error', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch booking details' },
      { status: 500 }
    );
  }
}

function transformBooking(
  booking: any,
  bookingType: 'bike' | 'car' | 'chauffeur',
  statusMap: Record<string, string>
) {
  const serviceNames: Record<string, string> = {
    bike: 'Bike Rental',
    car: 'Self-Drive Car',
    chauffeur: 'Car with Driver',
  };

  const baseBooking = {
    id: booking.id,
    service_id: 1,
    service_name: serviceNames[bookingType],
    location_id: booking.locationId,
    location_name: booking.locationName || booking.locations?.name || '',
    destination: null as string | null,
    journey_datetime: booking.pickupDate.toISOString(),
    return_datetime: null as string | null,
    status: statusMap[booking.status] || 'open',
    created_at: booking.createdAt.toISOString(),
    other_info: booking.customerNotes || null,
  };

  if (bookingType === 'bike') {
    return {
      ...baseBooking,
      bike_type: booking.requestedCategory || null,
      bike_duration: booking.totalDays?.toString() || null,
    };
  }

  if (bookingType === 'car') {
    return {
      ...baseBooking,
      return_datetime: booking.dropDate?.toISOString() || null,
      car_type: booking.requestedCategory || null,
      transmission: booking.requestedTransmission || null,
      fuel_type: booking.requestedFuelType || null,
      is_doorstep_delivery: booking.isDeliveryRequested ? 1 : 0,
    };
  }

  if (bookingType === 'chauffeur') {
    return {
      ...baseBooking,
      destination: booking.dropCity || null,
      return_datetime: booking.returnDate?.toISOString() || null,
      trip_type: booking.tripType || null,
      car_type: booking.carCategory || null,
      package: booking.localPackageId || null,
      total_passangers: null,
    };
  }

  return baseBooking;
}
