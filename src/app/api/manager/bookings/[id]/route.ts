import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get single booking detail for manager
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id: bookingId } = resolvedParams;

    // Get current user and verify they are a manager
    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: {
        manager_locations: true,
        manager_services: true,
      },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    // Get assigned location IDs
    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);

    // Find the booking
    const booking = await prisma.bike_bookings.findUnique({
      where: { id: bookingId },
      include: {
        customers: {
          select: { id: true, name: true, email: true, phone: true },
        },
        vendors_bike_bookings_assignedVendorIdTovendors: {
          select: { id: true, businessName: true, phone: true, email: true },
        },
        vendors_bike_bookings_acceptedVendorIdTovendors: {
          select: { id: true, businessName: true, phone: true, email: true },
        },
        locations: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if manager has access to this booking's location
    if (assignedLocationIds.length > 0 && !assignedLocationIds.includes(booking.locationId || '')) {
      return NextResponse.json(
        { error: 'Access denied. You are not assigned to this location.' },
        { status: 403 }
      );
    }

    // Get the active vendor (accepted takes priority over assigned)
    const activeVendor = booking.vendors_bike_bookings_acceptedVendorIdTovendors || booking.vendors_bike_bookings_assignedVendorIdTovendors;

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        customerName: booking.customers?.name || booking.customerName,
        customerEmail: booking.customers?.email || booking.customerEmail,
        customerPhone: booking.customers?.phone || booking.customerPhone,
        vendorName: activeVendor?.businessName,
        vendorPhone: activeVendor?.phone,
        vendorEmail: activeVendor?.email,
        locationId: booking.locationId,
        locationName: booking.locations?.name || booking.locationName,
        requestedVehicleName: booking.requestedVehicleName,
        requestedCategory: booking.requestedCategory,
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        dropDate: booking.dropDate,
        dropTime: booking.dropTime,
        totalDays: booking.totalDays,
        dailyRate: booking.dailyRate,
        totalAmount: booking.totalAmount,
        gstAmount: booking.gstAmount,
        securityDeposit: booking.securityDeposit,
        grandTotal: booking.grandTotal,
        advanceAmount: booking.advanceAmount,
        advancePaymentRef: booking.advancePaymentRef,
        advancePaymentProof: booking.advancePaymentProof,
        advancePaymentDate: booking.advancePaymentDate,
        advancePaymentVerified: booking.advancePaymentVerified,
        advanceVerifiedAt: booking.advanceVerifiedAt,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        paidAmount: booking.paidAmount,
        tripStartOtp: booking.tripStartOtp,
        tripOtpVerified: booking.tripOtpVerified,
        pickedUpAt: booking.pickedUpAt,
        returnedAt: booking.returnedAt,
        customerNotes: booking.customerNotes,
        adminNotes: booking.adminNotes,
        createdAt: booking.createdAt,
        customer: booking.customers,
        assignedVendor: booking.vendors_bike_bookings_assignedVendorIdTovendors,
        acceptedVendor: booking.vendors_bike_bookings_acceptedVendorIdTovendors,
      },
    });
  } catch (error: any) {
    logger.error('Manager booking detail error', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Update booking (verify payment, update status, add notes)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id: bookingId } = resolvedParams;

    // Get current user and verify they are a manager
    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: {
        manager_locations: true,
        manager_services: true,
      },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    // Get assigned location IDs
    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);

    // Find the booking
    const booking = await prisma.bike_bookings.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if manager has access to this booking's location
    if (assignedLocationIds.length > 0 && !assignedLocationIds.includes(booking.locationId || '')) {
      return NextResponse.json(
        { error: 'Access denied. You are not assigned to this location.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ...data } = body;

    let updateData: any = {};

    switch (action) {
      case 'verify_payment':
        // Verify advance payment
        if (booking.status !== 'PAYMENT_SUBMITTED') {
          return NextResponse.json(
            { error: 'Payment verification is only allowed for PAYMENT_SUBMITTED status' },
            { status: 400 }
          );
        }
        updateData = {
          advancePaymentVerified: true,
          advanceVerifiedBy: manager.id,
          advanceVerifiedAt: new Date(),
          status: 'PAYMENT_VERIFIED',
          paidAmount: booking.advanceAmount || 0,
        };
        break;

      case 'reject_payment':
        // Reject payment - set back to pending
        if (booking.status !== 'PAYMENT_SUBMITTED') {
          return NextResponse.json(
            { error: 'Payment rejection is only allowed for PAYMENT_SUBMITTED status' },
            { status: 400 }
          );
        }
        updateData = {
          advancePaymentVerified: false,
          advancePaymentProof: null,
          advancePaymentRef: null,
          advancePaymentDate: null,
          status: 'PENDING_PAYMENT',
          adminNotes: data.reason
            ? `${booking.adminNotes || ''}\n[${new Date().toISOString()}] Payment rejected: ${data.reason}`.trim()
            : booking.adminNotes,
        };
        break;

      case 'broadcast':
        // Broadcast to all vendors
        if (!['PAYMENT_VERIFIED', 'PENDING_VENDOR'].includes(booking.status)) {
          return NextResponse.json(
            { error: 'Broadcast is only allowed for PAYMENT_VERIFIED or PENDING_VENDOR status' },
            { status: 400 }
          );
        }
        updateData = {
          status: 'BROADCASTED',
          broadcastedAt: new Date(),
        };
        break;

      case 'update_notes':
        // Update admin notes
        updateData = {
          adminNotes: data.adminNotes,
        };
        break;

      case 'cancel':
        // Cancel booking
        if (['COMPLETED', 'CANCELLED', 'IN_PROGRESS'].includes(booking.status)) {
          return NextResponse.json(
            { error: 'Cannot cancel booking in this status' },
            { status: 400 }
          );
        }
        updateData = {
          status: 'CANCELLED',
          cancellationReason: data.reason || 'Cancelled by manager',
          adminNotes: `${booking.adminNotes || ''}\n[${new Date().toISOString()}] Cancelled by manager: ${data.reason || 'No reason provided'}`.trim(),
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update the booking
    const updatedBooking = await prisma.bike_bookings.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        assignedVendor: {
          select: { id: true, businessName: true, phone: true, email: true },
        },
        acceptedVendor: {
          select: { id: true, businessName: true, phone: true, email: true },
        },
        location: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Booking ${action.replace('_', ' ')} successfully`,
      booking: updatedBooking,
    });
  } catch (error: any) {
    logger.error('Manager booking update error', error);
    return NextResponse.json(
      { error: 'Failed to update booking', details: error?.message },
      { status: 500 }
    );
  }
}
