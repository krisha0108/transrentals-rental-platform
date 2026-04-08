import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Fetch booking by booking number or ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingNumber: string }> | { bookingNumber: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params;
    const { bookingNumber } = resolvedParams;

    const bookingInclude = {
      locations: { select: { id: true, name: true, slug: true } },
      accepted_driver: { select: { id: true, name: true, phone: true, email: true, profilePhoto: true } },
      vendors_chauffeur_bookings_acceptedVendorIdTovendors: {
        select: { id: true, businessName: true, ownerName: true, phone: true, logo: true, city: true, rating: true },
      },
    };

    // Try to find by ID first, then by booking number
    let booking = await prisma.chauffeur_bookings.findUnique({
      where: { id: bookingNumber },
      include: bookingInclude,
    }).catch(() => null);

    // If not found by ID, try by booking number
    if (!booking) {
      booking = await prisma.chauffeur_bookings.findUnique({
        where: { bookingNumber },
        include: bookingInclude,
      });
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    const acceptedDriver = (booking as any).accepted_driver;
    const acceptedVendor = (booking as any).vendors_chauffeur_bookings_acceptedVendorIdTovendors;

    // Fetch vehicle photos — try driver_vehicles first, then vendor_fleets
    let vehicleImages: Record<string, string | null> = {};
    let vendorVehicleImages: string[] = [];

    if (booking.vehicleNumber) {
      // 1. Driver's personal fleet
      const driverVehicle = await prisma.driver_vehicles.findFirst({
        where: { registrationNo: booking.vehicleNumber },
        select: {
          photoFront: true, photoBack: true,
          photoLeftSide: true, photoRightSide: true, photoInterior: true,
          color: true, fuelType: true, seatingCapacity: true, year: true,
        },
      });
      if (driverVehicle) {
        vehicleImages = {
          photoFront: driverVehicle.photoFront,
          photoBack: driverVehicle.photoBack,
          photoLeftSide: driverVehicle.photoLeftSide,
          photoRightSide: driverVehicle.photoRightSide,
          photoInterior: driverVehicle.photoInterior,
        };
        vehicleImages._color = driverVehicle.color;
        vehicleImages._fuelType = driverVehicle.fuelType;
        vehicleImages._seats = driverVehicle.seatingCapacity ? String(driverVehicle.seatingCapacity) : null;
        vehicleImages._year = driverVehicle.year ? String(driverVehicle.year) : null;
      }

      // 2. Vendor fleet (if driver vehicle has no photos)
      const hasDriverPhotos = !!(vehicleImages.photoFront || vehicleImages.photoBack ||
        vehicleImages.photoLeftSide || vehicleImages.photoRightSide || vehicleImages.photoInterior);
      if (!hasDriverPhotos && booking.acceptedVendorId) {
        // Try exact reg number match first
        let vendorVehicle = await prisma.vendor_fleets.findFirst({
          where: { registrationNumber: booking.vehicleNumber, vendorId: booking.acceptedVendorId },
          select: { images: true, color: true, fuelType: true, seatingCapacity: true, yearOfManufacture: true },
        });

        // Fallback: case-insensitive reg number (trim + uppercase)
        if (!vendorVehicle && booking.vehicleNumber) {
          const allVendorVehicles = await prisma.vendor_fleets.findMany({
            where: { vendorId: booking.acceptedVendorId },
            select: { images: true, color: true, fuelType: true, seatingCapacity: true, yearOfManufacture: true, registrationNumber: true },
          });
          vendorVehicle = allVendorVehicles.find(v =>
            v.registrationNumber?.trim().toUpperCase() === booking.vehicleNumber?.trim().toUpperCase()
          ) || null;
        }

        if (vendorVehicle) {
          try {
            const imgs = vendorVehicle.images ? JSON.parse(vendorVehicle.images) : [];
            if (Array.isArray(imgs)) {
              vendorVehicleImages = imgs.filter(Boolean);
            } else if (imgs && typeof imgs === 'object') {
              // vendor_fleets.images is stored as {front, back, leftSide, rightSide, inside}
              vendorVehicleImages = (Object.values(imgs) as string[]).filter(Boolean);
            }
          } catch {}
          if (!vehicleImages._color) vehicleImages._color = vendorVehicle.color;
          if (!vehicleImages._fuelType) vehicleImages._fuelType = vendorVehicle.fuelType;
          if (!vehicleImages._seats) vehicleImages._seats = vendorVehicle.seatingCapacity ? String(vendorVehicle.seatingCapacity) : null;
          if (!vehicleImages._year) vehicleImages._year = vendorVehicle.yearOfManufacture ? String(vendorVehicle.yearOfManufacture) : null;
        }
      }
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        customerId: booking.customerId,
        acceptedVendorId: booking.acceptedVendorId,
        tripType: booking.tripType,
        carCategory: booking.carCategory,
        carCategoryName: booking.carCategoryName,
        pickupCity: booking.pickupCity,
        dropCity: booking.dropCity,
        intermediateStops: booking.intermediateStops
          ? (() => { try { return JSON.parse(booking.intermediateStops); } catch { return []; } })()
          : [],
        pickupAddress: booking.pickupAddress,
        dropAddress: booking.dropAddress,
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        returnDate: booking.returnDate,
        totalDays: booking.totalDays,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        baseFare: booking.baseFare,
        perKmRate: booking.perKmRate,
        chargeableKm: booking.chargeableKm,
        kmCharges: booking.kmCharges,
        driverBatta: booking.driverBatta,
        nightCharges: booking.nightCharges,
        tollCharges: booking.tollCharges,
        gstAmount: booking.gstAmount,
        platformFee: booking.platformFee,
        grandTotal: booking.grandTotal,
        paidAmount: booking.paidAmount,
        advanceAmount: booking.advanceAmount,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        // Driver info — vendor-assigned fields take priority, fallback to accepted_driver
        driverName: booking.driverName || acceptedDriver?.name || null,
        driverPhone: booking.driverPhone || acceptedDriver?.phone || null,
        driverEmail: acceptedDriver?.email || null,
        driverPhoto: booking.driverPhoto || acceptedDriver?.profilePhoto || null,
        acceptedDriverId: booking.acceptedDriverId,
        acceptedStaffId: booking.acceptedStaffId,
        // Vehicle info — only show when explicitly assigned to this booking
        vehicleNumber: booking.vehicleNumber || null,
        vehicleModel: booking.vehicleModel || null,
        vehicleColor: (booking as any).vehicleColor || vehicleImages._color || null,
        vehicleFuelType: (booking as any).vehicleFuelType || vehicleImages._fuelType || null,
        vehicleSeats: (booking as any).vehicleSeats || vehicleImages._seats || null,
        vehicleYear: (booking as any).vehicleYear || vehicleImages._year || null,
        vehiclePhoto: (booking as any).vehiclePhoto || vehicleImages.photoFront || null,
        vehiclePhotos: {
          front: vehicleImages.photoFront || null,
          back: vehicleImages.photoBack || null,
          leftSide: vehicleImages.photoLeftSide || null,
          rightSide: vehicleImages.photoRightSide || null,
          interior: vehicleImages.photoInterior || null,
        },
        vendorVehicleImages,
        // Vendor info
        vendor: acceptedVendor ? {
          id: acceptedVendor.id,
          businessName: acceptedVendor.businessName,
          ownerName: acceptedVendor.ownerName,
          phone: acceptedVendor.phone,
          logo: acceptedVendor.logo,
          city: acceptedVendor.city,
          rating: acceptedVendor.rating,
        } : null,
        tripStartOtp: booking.tripStartOtp,
        tripStartedAt: booking.tripStartedAt,
        tripEndedAt: booking.tripEndedAt,
        rating: booking.rating,
        review: booking.review,
        vendorNotes: booking.vendorNotes,
        cancelledAt: booking.cancelledAt,
        cancellationReason: booking.cancellationReason,
        droppedAt: booking.droppedAt,
        dropReason: booking.dropReason,
        createdAt: booking.createdAt,
        location: booking.locations,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch booking', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update booking (cancel, rate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingNumber: string }> | { bookingNumber: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params;
    const { bookingNumber } = resolvedParams;
    const body = await request.json();
    const { action } = body;

    // Find the booking by ID first, then by booking number
    let booking = await prisma.chauffeur_bookings.findUnique({
      where: { id: bookingNumber },
    }).catch(() => null);

    if (!booking) {
      booking = await prisma.chauffeur_bookings.findUnique({
        where: { bookingNumber },
      });
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'cancel': {
        // Check if booking can be cancelled
        const cancellableStatuses = ['PENDING_PAYMENT', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'DRIVER_ASSIGNED'];
        if (!cancellableStatuses.includes(booking.status)) {
          return NextResponse.json(
            { success: false, error: 'Booking cannot be cancelled at this stage' },
            { status: 400 }
          );
        }

        const updatedBooking = await prisma.chauffeur_bookings.update({
          where: { id: booking.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancellationReason: body.cancellationReason || 'Customer cancelled',
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Booking cancelled successfully',
          booking: updatedBooking,
        });
      }

      case 'rate': {
        // Check if booking is completed
        if (booking.status !== 'COMPLETED') {
          return NextResponse.json(
            { success: false, error: 'Only completed bookings can be rated' },
            { status: 400 }
          );
        }

        // Check if already rated
        if (booking.rating) {
          return NextResponse.json(
            { success: false, error: 'Booking has already been rated' },
            { status: 400 }
          );
        }

        const { rating, review } = body;

        if (!rating || rating < 1 || rating > 5) {
          return NextResponse.json(
            { success: false, error: 'Rating must be between 1 and 5' },
            { status: 400 }
          );
        }

        const updatedBooking = await prisma.chauffeur_bookings.update({
          where: { id: booking.id },
          data: {
            rating: parseInt(rating),
            review: review || null,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Thank you for your feedback!',
          booking: updatedBooking,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    logger.error('Failed to update booking', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update booking', details: error?.message },
      { status: 500 }
    );
  }
}
