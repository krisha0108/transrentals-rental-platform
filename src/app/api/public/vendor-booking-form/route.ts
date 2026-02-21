// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';

export const dynamic = 'force-dynamic';

function generateBookingNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `DR${yy}${mm}${rand}`;
}

// POST — customer submits vendor's shared booking form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vendorSlug,
      serviceType,
      customerName,
      customerPhone,
      customerEmail,
      vehicleType,
      pickupDate,
      returnDate,
      pickupLocation,
      dropLocation,
      notes,
    } = body;

    // Validate required fields
    if (!vendorSlug || !customerName || !customerPhone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    // Look up vendor by slug
    const vendor = await prisma.vendors.findUnique({
      where: { slug: vendorSlug },
      select: { id: true, businessName: true, slug: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Find the booking link for analytics + active check
    const effectiveService = serviceType || 'all';
    const link = await prisma.vendor_booking_links.findFirst({
      where: {
        vendorId: vendor.id,
        serviceType: effectiveService,
        isActive: true,
      },
    });

    // If link is deactivated, reject
    if (link === null && effectiveService !== 'all') {
      // Try 'all' as fallback
      const allLink = await prisma.vendor_booking_links.findFirst({
        where: { vendorId: vendor.id, serviceType: 'all', isActive: true },
      });
      if (!allLink) {
        return NextResponse.json(
          { error: 'This booking form is currently inactive' },
          { status: 403 }
        );
      }
    }

    // Create the direct booking
    const booking = await prisma.vendor_direct_bookings.create({
      data: {
        bookingNumber: generateBookingNumber(),
        vendorId: vendor.id,
        bookingSource: 'shared_form',
        linkId: link?.id ?? null,
        serviceType: effectiveService === 'all' ? (serviceType || 'general') : effectiveService,
        vehicleType: vehicleType || null,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        pickupDate: pickupDate ? new Date(pickupDate) : null,
        returnDate: returnDate ? new Date(returnDate) : null,
        pickupLocation: pickupLocation || null,
        dropLocation: dropLocation || null,
        notes: notes || null,
        status: 'inquiry',
        paymentStatus: 'pending',
      },
    });

    // Increment bookingCount on the link
    if (link) {
      await prisma.vendor_booking_links.update({
        where: { id: link.id },
        data: { bookingCount: { increment: 1 } },
      });
    }

    // Notify vendor via FCM + in-app notification
    await sendVendorDirectNotification({
      vendorId: vendor.id,
      title: 'New Booking Request',
      body: `${customerName} submitted a booking request via your form`,
      type: 'direct_booking_inquiry',
      serviceType: effectiveService,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      data: { screen: 'DirectBookingDetail' },
    });

    return NextResponse.json({
      success: true,
      bookingNumber: booking.bookingNumber,
      message: `Your booking request has been sent to ${vendor.businessName}. They will contact you shortly.`,
    });
  } catch (err) {
    console.error('[VendorBookingForm] Error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

// POST — increment click count (called on page load)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorSlug, serviceType } = body;
    if (!vendorSlug) return NextResponse.json({ ok: true });

    const vendor = await prisma.vendors.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    if (!vendor) return NextResponse.json({ ok: true });

    await prisma.vendor_booking_links.updateMany({
      where: { vendorId: vendor.id, serviceType: serviceType || 'all' },
      data: { clickCount: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
