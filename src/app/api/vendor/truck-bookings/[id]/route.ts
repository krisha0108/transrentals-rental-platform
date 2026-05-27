// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';
import { releaseDatesForBooking } from '@/lib/utils/fleet-availability';

export const dynamic = 'force-dynamic';

// GET - Get Truck Booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const vendor = await prisma.vendors.findFirst({
      where: { id: auth.vendorId },
      select: { id: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const booking = await prisma.truck_bookings.findFirst({
      where: { id, vendorId: vendor.id },
      include: {
        truck_quote_requests: {
          select: {
            id: true,
            requestNumber: true,
            truckBodyType: true,
            tripDirection: true,
            estimatedVolume: true,
            estimatedWeight: true,
            goodsDescription: true,
            pickupPincode: true,
            dropPincode: true,
            hasPickupLift: true,
            hasDropLift: true,
            expectedDeliveryDate: true,
            expectedDeliveryTime: true,
            requiresLabour: true,
            labourCount: true,
            hasMultipleStops: true,
            multipleStopsDetails: true,
            receiverName: true,
            receiverPhone: true,
            requiresPOD: true,
            isFlexibleDate: true,
            needInsurance: true,
            needPackaging: true,
            budgetMin: true,
            budgetMax: true,
            requirements: true,
            locations: {
              select: { name: true, slug: true }
            }
          }
        },
        truck_quotes: {
          select: {
            quoteNumber: true,
            vehicleName: true,
            vehicleCategory: true,
            totalAmount: true,
            advancePercent: true,
            advanceAmount: true,
            inclusions: true,
            exclusions: true,
            termsConditions: true,
            validTill: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.vendorId !== auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Use location from truck_quote_requests if available, fallback to existing fields
    const pickupCity = booking.truck_quote_requests?.locations?.name || booking.pickupCity || 'N/A';
    const dropCity = booking.dropCity || 'N/A';

    const qr = booking.truck_quote_requests as any;
    const transformedBooking = {
      ...booking,
      pickupCity,
      dropCity,
      // Surface extended quote-request fields onto the booking object for UI convenience
      truckBodyType: qr?.truckBodyType,
      tripDirection: qr?.tripDirection,
      estimatedVolume: qr?.estimatedVolume,
      estimatedWeight: qr?.estimatedWeight,
      goodsDescription: booking.goodsDescription || qr?.goodsDescription,
      pickupPincode: qr?.pickupPincode,
      dropPincode: qr?.dropPincode,
      hasPickupLift: qr?.hasPickupLift,
      hasDropLift: qr?.hasDropLift,
      expectedDeliveryDate: qr?.expectedDeliveryDate,
      expectedDeliveryTime: qr?.expectedDeliveryTime,
      requiresLabour: qr?.requiresLabour,
      hasMultipleStops: qr?.hasMultipleStops,
      multipleStopsDetails: qr?.multipleStopsDetails,
      receiverName: qr?.receiverName,
      receiverPhone: qr?.receiverPhone,
      requiresPOD: qr?.requiresPOD,
      isFlexibleDate: qr?.isFlexibleDate,
      needInsurance: qr?.needInsurance,
      needPackaging: qr?.needPackaging,
      budgetMin: qr?.budgetMin,
      budgetMax: qr?.budgetMax,
    };

    return NextResponse.json({
      success: true,
      booking: {
        ...transformedBooking,
        // Full accepted-quote terms for the "Quote Details" section
        quote: booking.truck_quotes ? {
          quoteNumber:     booking.truck_quotes.quoteNumber,
          vehicleName:     booking.truck_quotes.vehicleName,
          vehicleCategory: booking.truck_quotes.vehicleCategory,
          totalAmount:     booking.truck_quotes.totalAmount,
          advancePercent:  booking.truck_quotes.advancePercent,
          advanceAmount:   booking.truck_quotes.advanceAmount,
          inclusions:      booking.truck_quotes.inclusions,
          exclusions:      booking.truck_quotes.exclusions,
          termsConditions: booking.truck_quotes.termsConditions,
          validTill:       booking.truck_quotes.validTill?.toISOString() || null,
        } : null,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch truck booking', error);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

// PATCH - Update truck booking (assign driver, accept, reject, etc.)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const auth = await getVendorAuth(request);

        if (!auth.authenticated || !auth.vendorId) {
            return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
        }

        const vendor = await prisma.vendors.findFirst({
            where: { id: auth.vendorId },
            select: { id: true },
        });

        if (!vendor) {
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }

        const body = await request.json();
        const { action, ...data } = body;

        // Find the booking
        const booking = await prisma.truck_bookings.findUnique({
            where: { id },
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Verify vendor owns this booking
        if (booking.vendorId !== vendor.id) {
            return NextResponse.json(
                { error: 'You can only modify your own bookings' },
                { status: 403 }
            );
        }

        let updateData: any = {};
        let message = '';

        switch (action) {
            case 'assign_driver':
                // Check if booking can have driver assigned
                const assignableStatuses = ['ADVANCE_PAID', 'ACCEPTED', 'PAYMENT_VERIFIED', 'CONFIRMED'];
                if (!assignableStatuses.includes(booking.status)) {
                    return NextResponse.json(
                        { error: 'Driver can only be assigned to paid or accepted bookings' },
                        { status: 400 }
                    );
                }

                let driverName = data.driverName;
                let driverPhone = data.driverPhone;
                let assignedDriverId = data.assignedDriverId;
                let assignedVehicleId = data.assignedVehicleId;
                let vehicleNumber = data.vehicleNumber;

                // If assignedDriverId provided, fetch driver details from vendor_staff
                if (assignedDriverId && (!driverName || !driverPhone)) {
                    const staffDriver = await prisma.vendor_staff.findUnique({
                        where: { id: assignedDriverId },
                        select: { name: true, phone: true }
                    });
                    if (staffDriver) {
                        driverName = staffDriver.name;
                        driverPhone = staffDriver.phone;
                    }
                }

                // If assignedVehicleId provided, fetch vehicle number from vendor_fleets
                if (assignedVehicleId && !vehicleNumber) {
                    const fleetVehicle = await prisma.vendor_fleets.findUnique({
                        where: { id: assignedVehicleId },
                        select: { registrationNumber: true }
                    });
                    if (fleetVehicle?.registrationNumber) {
                        vehicleNumber = fleetVehicle.registrationNumber;
                    }
                }

                if (!driverName || !driverPhone) {
                    return NextResponse.json(
                        { error: 'Driver name and phone are required' },
                        { status: 400 }
                    );
                }

                updateData = {
                    status: 'VEHICLE_ASSIGNED',
                    driverName,
                    driverPhone,
                    ...(assignedDriverId && { assignedDriverId }),
                    ...(assignedVehicleId && { assignedVehicleId }),
                    ...(vehicleNumber && { vehicleNumber }),
                };
                message = 'Driver assigned successfully';
                break;

            case 'accept':
                if (booking.status !== 'PENDING_VENDOR' && booking.status !== 'BROADCASTED' && booking.status !== 'PAYMENT_VERIFIED') {
                    return NextResponse.json(
                        { error: 'Booking cannot be accepted in current status' },
                        { status: 400 }
                    );
                }

                updateData = {
                    status: 'ACCEPTED',
                    acceptedAt: new Date(),
                };
                message = 'Booking accepted successfully';
                break;

            case 'reject':
                if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
                    return NextResponse.json(
                        { error: 'Cannot reject completed or cancelled booking' },
                        { status: 400 }
                    );
                }

                updateData = {
                    status: 'CANCELLED',
                    cancellationReason: data.reason || 'Vendor rejected',
                    cancelledAt: new Date(),
                };
                message = 'Booking rejected';
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }

        // Update the booking
        const updatedBooking = await prisma.truck_bookings.update({
            where: { id },
            data: updateData,
        });

        // Release blocked dates on cancellation
        if (action === 'reject') {
          releaseDatesForBooking(id, 'truck').catch((err) =>
            logger.error('Failed to release blocked dates for truck booking', err)
          );
        }

        return NextResponse.json({
            success: true,
            message,
            booking: updatedBooking,
        });

    } catch (error: any) {
        logger.error('Failed to update truck booking', error);
        return NextResponse.json(
            { error: 'Failed to update booking', details: error?.message },
            { status: 500 }
        );
    }
}
