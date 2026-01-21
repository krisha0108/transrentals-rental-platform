import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// POST - Verify or reject a payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, bookingType, action, notes } = body;

    if (!bookingId || !action) {
      return NextResponse.json(
        { success: false, error: 'Booking ID and action are required' },
        { status: 400 }
      );
    }

    // Handle Bike Booking
    if (bookingType === 'bike') {
      const bikeBooking = await prisma.bike_bookings.findUnique({
        where: { id: bookingId },
      });

      if (!bikeBooking) {
        return NextResponse.json(
          { success: false, error: 'Bike booking not found' },
          { status: 404 }
        );
      }

      if (action === 'verify') {
        // Check if booking was created from an accepted quote (has assignedVendorId or acceptedVendorId)
        // In this case, it should go DIRECTLY to that vendor, NOT broadcast!
        const hasAcceptedVendor = !!(bikeBooking.assignedVendorId || bikeBooking.acceptedVendorId);
        const vendorId = bikeBooking.assignedVendorId || bikeBooking.acceptedVendorId;

        await prisma.bike_bookings.update({
          where: { id: bookingId },
          data: {
            // If vendor already assigned (from quote acceptance), use ACCEPTED status
            // If no vendor assigned, broadcast to all
            status: hasAcceptedVendor ? 'ACCEPTED' : 'BROADCASTED',
            paymentStatus: 'PARTIAL', // Advance paid
            advancePaymentVerified: true,
            paidAmount: bikeBooking.advanceAmount || bikeBooking.grandTotal,
            assignedVendorId: vendorId || null,
            acceptedVendorId: vendorId || null,
            acceptedAt: hasAcceptedVendor ? new Date() : null,
            broadcastedAt: hasAcceptedVendor ? null : new Date(),
            responseDeadline: hasAcceptedVendor ? null : new Date(Date.now() + 4 * 60 * 60 * 1000),
          },
        });

        return NextResponse.json({
          success: true,
          message: hasAcceptedVendor
            ? 'Payment verified. Booking confirmed with vendor.'
            : 'Payment verified. Booking broadcasted to vendors.',
        });
      } else if (action === 'reject') {
        await prisma.bike_bookings.update({
          where: { id: bookingId },
          data: {
            paymentStatus: 'FAILED',
            advancePaymentVerified: false,
            customerNotes: notes
              ? `${bikeBooking.customerNotes || ''}\n\nPayment rejected: ${notes}`
              : bikeBooking.customerNotes,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Payment rejected.',
        });
      }

      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Handle Car Booking (Self-Drive)
    if (bookingType === 'car' || bookingType === 'self-drive') {
      const carBooking = await prisma.car_bookings.findUnique({
        where: { id: bookingId },
      });

      if (!carBooking) {
        return NextResponse.json(
          { success: false, error: 'Car booking not found' },
          { status: 404 }
        );
      }

      if (action === 'verify') {
        // Check if booking was created from an accepted quote (has assignedVendorId or acceptedVendorId)
        // In this case, it should go DIRECTLY to that vendor, NOT broadcast!
        const hasAcceptedVendor = !!(carBooking.assignedVendorId || carBooking.acceptedVendorId);
        const vendorId = carBooking.assignedVendorId || carBooking.acceptedVendorId;

        await prisma.car_bookings.update({
          where: { id: bookingId },
          data: {
            // If vendor already assigned (from quote acceptance), use ACCEPTED status
            // If no vendor assigned, broadcast to all
            status: hasAcceptedVendor ? 'ACCEPTED' : 'BROADCASTED',
            paymentStatus: 'PARTIAL', // Advance paid
            advancePaymentVerified: true,
            paidAmount: carBooking.advanceAmount || carBooking.grandTotal,
            assignedVendorId: vendorId || null,
            acceptedVendorId: vendorId || null,
            acceptedAt: hasAcceptedVendor ? new Date() : null,
            broadcastedAt: hasAcceptedVendor ? null : new Date(),
            responseDeadline: hasAcceptedVendor ? null : new Date(Date.now() + 4 * 60 * 60 * 1000),
          },
        });

        return NextResponse.json({
          success: true,
          message: hasAcceptedVendor
            ? 'Payment verified. Booking confirmed with vendor.'
            : 'Payment verified. Booking broadcasted to vendors.',
        });
      } else if (action === 'reject') {
        await prisma.car_bookings.update({
          where: { id: bookingId },
          data: {
            paymentStatus: 'FAILED',
            advancePaymentVerified: false,
            adminNotes: notes
              ? `Payment rejected: ${notes}`
              : 'Payment verification failed',
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Payment rejected.',
        });
      }

      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Handle Bus Booking
    if (bookingType === 'bus') {
      const busBooking = await prisma.bus_bookings.findUnique({
        where: { id: bookingId },
      });

      if (!busBooking) {
        return NextResponse.json(
          { success: false, error: 'Bus booking not found' },
          { status: 404 }
        );
      }

      if (action === 'verify') {
        await prisma.bus_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'ADVANCE_PAID',
            paymentStatus: 'PAID',
            advancePaymentVerified: true,
            advancePaid: busBooking.advanceAmount || 0,
            advancePaidAt: new Date(),
            confirmedAt: new Date(),
            adminNotes: notes ? `Payment verified: ${notes}` : 'Payment verified',
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Bus booking payment verified successfully.',
        });
      } else if (action === 'reject') {
        await prisma.bus_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'PENDING_PAYMENT',
            paymentStatus: 'FAILED',
            advancePaymentVerified: false,
            adminNotes: notes ? `Payment rejected: ${notes}` : 'Payment verification failed',
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Bus booking payment rejected.',
        });
      }

      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Handle Truck Booking
    if (bookingType === 'truck') {
      const truckBooking = await prisma.truck_bookings.findUnique({
        where: { id: bookingId },
      });

      if (!truckBooking) {
        return NextResponse.json(
          { success: false, error: 'Truck booking not found' },
          { status: 404 }
        );
      }

      if (action === 'verify') {
        await prisma.truck_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'ADVANCE_PAID',
            paymentStatus: 'PAID',
            advancePaymentVerified: true,
            advancePaid: truckBooking.advanceAmount || 0,
            advancePaidAt: new Date(),
            vendorNotes: notes ? `Payment verified: ${notes}` : 'Payment verified',
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Truck booking payment verified successfully.',
        });
      } else if (action === 'reject') {
        await prisma.truck_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'PENDING_PAYMENT',
            paymentStatus: 'FAILED',
            advancePaymentVerified: false,
            vendorNotes: notes ? `Payment rejected: ${notes}` : 'Payment verification failed',
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Truck booking payment rejected.',
        });
      }

      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Handle Equipment Booking
    if (bookingType === 'equipment') {
      const equipmentBooking = await prisma.equipment_bookings.findUnique({
        where: { id: bookingId },
      });

      if (!equipmentBooking) {
        return NextResponse.json(
          { success: false, error: 'Equipment booking not found' },
          { status: 404 }
        );
      }

      if (action === 'verify') {
        await prisma.equipment_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'ADVANCE_PAID',
            paymentStatus: 'PAID',
            advancePaid: equipmentBooking.advanceAmount || 0,
            advancePaidAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Equipment booking payment verified successfully.',
        });
      } else if (action === 'reject') {
        await prisma.equipment_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'PENDING_PAYMENT',
            paymentStatus: 'FAILED',
            advancePaid: 0,
            advancePaidAt: null,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Equipment booking payment rejected.',
        });
      }

      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Handle Packers Booking
    if (bookingType === 'packers') {
      const packersBooking = await prisma.packers_bookings.findUnique({
        where: { id: bookingId },
      });

      if (!packersBooking) {
        return NextResponse.json(
          { success: false, error: 'Packers booking not found' },
          { status: 404 }
        );
      }

      if (action === 'verify') {
        await prisma.packers_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'ADVANCE_PAID',
            paymentStatus: 'PAID',
            advancePaid: packersBooking.advanceAmount || 0,
            advancePaidAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Packers & Movers booking payment verified successfully.',
        });
      } else if (action === 'reject') {
        await prisma.packers_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'PENDING_PAYMENT',
            paymentStatus: 'FAILED',
            advancePaid: 0,
            advancePaidAt: null,
            vendorNotes: notes ? `Payment rejected: ${notes}` : 'Payment verification failed',
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Packers & Movers booking payment rejected.',
        });
      }

      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Handle Luxury Car Booking
    if (bookingType === 'luxury') {
      const luxuryBooking = await prisma.luxury_bookings.findUnique({
        where: { id: bookingId },
      });

      if (!luxuryBooking) {
        return NextResponse.json(
          { success: false, error: 'Luxury booking not found' },
          { status: 404 }
        );
      }

      if (action === 'verify') {
        await prisma.luxury_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'ADVANCE_PAID',
            paymentStatus: 'PAID',
            advancePaid: luxuryBooking.advanceAmount || 0,
            advancePaidAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Luxury Car booking payment verified successfully.',
        });
      } else if (action === 'reject') {
        await prisma.luxury_bookings.update({
          where: { id: bookingId },
          data: {
            status: 'PENDING_PAYMENT',
            paymentStatus: 'FAILED',
            advancePaid: 0,
            advancePaidAt: null,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Luxury Car booking payment rejected.',
        });
      }

      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Handle Chauffeur Booking (existing logic)
    const booking = await prisma.chauffeur_bookings.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (action === 'verify') {
      // Verify payment - update status and broadcast to vendors
      // Check if this is a single vendor (assigned) or broadcast booking
      const isSingleVendor = !!booking.assignedVendorId;

      // Calculate advance amount (30% of grand total by default, or use existing paidAmount if already set)
      const advanceAmount = booking.paidAmount > 0
        ? booking.paidAmount
        : booking.partialPayment || Math.round(booking.grandTotal * 0.3);

      await prisma.chauffeur_bookings.update({
        where: { id: bookingId },
        data: {
          paymentStatus: advanceAmount >= booking.grandTotal ? 'PAID' : 'PARTIAL',
          paidAmount: advanceAmount,
          status: isSingleVendor ? 'PENDING_VENDOR' : 'BROADCASTED',
          broadcastedAt: new Date(),
          responseDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
          adminNotes: notes ? `Payment verified: ${notes}` : 'Payment verified',
        },
      });

      return NextResponse.json({
        success: true,
        message: isSingleVendor
          ? 'Payment verified. Booking sent to assigned vendor.'
          : 'Payment verified. Booking broadcasted to all vendors.',
      });
    } else if (action === 'reject') {
      // Reject payment
      await prisma.chauffeur_bookings.update({
        where: { id: bookingId },
        data: {
          paymentStatus: 'FAILED',
          adminNotes: notes || 'Payment verification failed',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Payment rejected.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    logger.error('Failed to verify payment', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
