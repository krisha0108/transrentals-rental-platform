// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
import { releaseDatesForBooking } from '@/lib/utils/fleet-availability';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
export const dynamic = 'force-dynamic';

// GET - Get Equipment Booking details for vendor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId!;


    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: { id: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const { id } = await params;

    const booking = await prisma.equipment_bookings.findFirst({
      where: { id, vendorId: vendor.id },
      include: {
        equipment_quote_requests: {
          include: {
            locations: {
              select: { name: true, slug: true },
            },
          },
        },
        equipment_quotes: {
          select: {
            quoteNumber: true,
            dailyRate: true,
            securityDeposit: true,
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

    // Calculate derived fields for frontend
    const dailyRate = booking.rentalDays > 0 ? Math.round(booking.baseAmount / booking.rentalDays) : 0;
    const additionalCharges = (booking.operatorCharges || 0) + (booking.deliveryCharges || 0) + (booking.pickupCharges || 0) + (booking.installationCharges || 0);

    // Use location from equipment_quote_requests if available, fallback to deliveryCity
    const locationName = booking.equipment_quote_requests?.locations?.name || booking.deliveryCity || 'N/A';

    const transformedBooking = {
      ...booking,
      dailyRate,
      additionalCharges,
      deliveryLocation: locationName,
      deliveryCity: locationName,
      pickupCity: locationName,
    };

    return NextResponse.json({
      success: true,
      booking: {
        ...transformedBooking,
        quote: booking.equipment_quotes ? {
          quoteNumber:     booking.equipment_quotes.quoteNumber,
          dailyRate:       booking.equipment_quotes.dailyRate,
          securityDeposit: booking.equipment_quotes.securityDeposit,
          totalAmount:     booking.equipment_quotes.totalAmount,
          advancePercent:  booking.equipment_quotes.advancePercent,
          advanceAmount:   booking.equipment_quotes.advanceAmount,
          inclusions:      booking.equipment_quotes.inclusions,
          exclusions:      booking.equipment_quotes.exclusions,
          termsConditions: booking.equipment_quotes.termsConditions,
          validTill:       booking.equipment_quotes.validTill?.toISOString() || null,
        } : null,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor equipment booking', error);
    return NextResponse.json({ error: 'Failed to fetch booking', details: error?.message }, { status: 500 });
  }
}

// PATCH - Update Equipment Booking status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getVendorAuth(request);

    if (!auth.authenticated || !auth.vendorId) {

      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    }

    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: { id: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, ...data } = body;

    const booking = await prisma.equipment_bookings.findFirst({
      where: { id, vendorId: vendor.id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    switch (action) {
      case 'assign_driver':
      case 'assign_operator': {
        // Check if booking can have operator assigned
        const assignableStatuses = ['ADVANCE_PAID', 'CONFIRMED'];
        if (!assignableStatuses.includes(booking.status)) {
          return NextResponse.json(
            { error: 'Operator can only be assigned to paid or confirmed bookings' },
            { status: 400 }
          );
        }

        if (!data.operatorName || !data.operatorPhone) {
          return NextResponse.json(
            { error: 'Operator name and phone are required' },
            { status: 400 }
          );
        }

        const updatedBooking = await prisma.equipment_bookings.update({
          where: { id },
          data: {
            status: 'CONFIRMED',
            operatorName: data.operatorName,
            operatorPhone: data.operatorPhone,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Operator assigned successfully',
          booking: updatedBooking,
        });
      }

      case 'accept': {
        if (booking.status !== 'PENDING_VENDOR' && booking.status !== 'BROADCASTED' && booking.status !== 'PAYMENT_VERIFIED') {
          return NextResponse.json(
            { error: 'Booking cannot be accepted in current status' },
            { status: 400 }
          );
        }

        const updatedBooking = await prisma.equipment_bookings.update({
          where: { id },
          data: {
            status: 'ACCEPTED',
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Booking accepted successfully',
          booking: updatedBooking,
        });
      }

      case 'reject': {
        if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
          return NextResponse.json(
            { error: 'Cannot reject completed or cancelled booking' },
            { status: 400 }
          );
        }

        const updatedBooking = await prisma.equipment_bookings.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            cancellationReason: data.reason || 'Vendor rejected',
            cancelledAt: new Date(),
          },
        });

        // Release blocked dates
        releaseDatesForBooking(id, 'equipment').catch((err) =>
          logger.error('Failed to release blocked dates for equipment booking', err)
        );

        return NextResponse.json({
          success: true,
          message: 'Booking rejected',
          booking: updatedBooking,
        });
      }

      case 'dispatch': {
        if (booking.status !== 'CONFIRMED') {
          return NextResponse.json({ error: 'Must be confirmed before dispatch' }, { status: 400 });
        }

        const { estimatedDelivery, deliveryNotes } = data;

        const updatedBooking = await prisma.equipment_bookings.update({
          where: { id },
          data: {
            status: 'DISPATCHED',
            scheduledDelivery: estimatedDelivery ? new Date(estimatedDelivery) : new Date(),
            deliveryNotes: deliveryNotes || null,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Equipment dispatched',
          booking: { id: updatedBooking.id, status: updatedBooking.status },
        });
      }

      case 'deliver': {
        if (booking.status !== 'DISPATCHED') {
          return NextResponse.json({ error: 'Must be dispatched before delivery' }, { status: 400 });
        }

        const { otp, deliveryNotes } = data;
        if (otp !== booking.deliveryOtp) {
          return NextResponse.json({ error: 'Invalid delivery OTP' }, { status: 400 });
        }

        const updatedBooking = await prisma.equipment_bookings.update({
          where: { id },
          data: {
            status: 'DELIVERED',
            deliveredAt: new Date(),
            deliveryNotes: deliveryNotes || booking.deliveryNotes,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Equipment delivered',
          booking: { id: updatedBooking.id, status: updatedBooking.status },
        });
      }

      case 'start_rent': {
        if (booking.status !== 'DELIVERED') {
          return NextResponse.json({ error: 'Must be delivered before rent starts' }, { status: 400 });
        }

        const updatedBooking = await prisma.equipment_bookings.update({
          where: { id },
          data: {
            status: 'ON_RENT',
            inUseFrom: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Rental period started',
          booking: { id: updatedBooking.id, status: updatedBooking.status },
        });
      }

      case 'schedule_pickup': {
        if (booking.status !== 'ON_RENT') {
          return NextResponse.json({ error: 'Can only schedule pickup for active rentals' }, { status: 400 });
        }

        const { pickupDate } = data;

        const updatedBooking = await prisma.equipment_bookings.update({
          where: { id },
          data: {
            status: 'PICKUP_SCHEDULED',
            scheduledPickup: pickupDate ? new Date(pickupDate) : new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Pickup scheduled',
          booking: { id: updatedBooking.id, status: updatedBooking.status },
        });
      }

      case 'complete': {
        if (!['ON_RENT', 'PICKUP_SCHEDULED'].includes(booking.status)) {
          return NextResponse.json({ error: 'Cannot complete in current status' }, { status: 400 });
        }

        const { otp, damageDescription, extraCharges } = data;
        if (otp !== booking.returnOtp) {
          return NextResponse.json({ error: 'Invalid return OTP' }, { status: 400 });
        }

        let finalAmount = booking.totalAmount;
        if (extraCharges) {
          finalAmount += extraCharges;
        }

        const updatedBooking = await prisma.equipment_bookings.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            returnedAt: new Date(),
            damageDescription: damageDescription || null,
            extraUsageCharges: extraCharges || 0,
            finalAmount: finalAmount,
            paymentStatus: 'COMPLETED',
          },
        });

        sendVendorDirectNotification({
          vendorId: vendor.id,
          title: '✅ Equipment Booking Completed!',
          body: `Equipment booking #${updatedBooking.bookingNumber} has been completed successfully.`,
          type: 'trip_completed',
          serviceType: 'equipment',
          bookingId: id,
          bookingNumber: updatedBooking.bookingNumber,
        }).catch((err: any) => logger.error('[EquipmentComplete] Vendor notify failed:', err));

        return NextResponse.json({
          success: true,
          message: 'Booking completed successfully',
          booking: { id: updatedBooking.id, status: updatedBooking.status, totalAmount: updatedBooking.totalAmount },
        });
      }

      case 'update_usage': {
        if (booking.status !== 'ON_RENT') {
          return NextResponse.json({ error: 'Usage updates only for active rentals' }, { status: 400 });
        }

        const { notes } = data;
        const updatedBooking = await prisma.equipment_bookings.update({
          where: { id },
          data: {
            vendorNotes: notes || booking.vendorNotes,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Usage notes updated',
          booking: { id: updatedBooking.id },
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('Failed to update vendor equipment booking', error);
    return NextResponse.json({ error: 'Failed to update booking', details: error?.message }, { status: 500 });
  }
}
