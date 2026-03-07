// @ts-nocheck
/**
 * B2B Module Notification Helper
 * Sends FCM push + saves DB notifications for B2B booking flow events.
 */

import { prisma } from '@/lib/db/prisma';
import { sendFCMNotification } from '@/lib/utils/fcm-helper';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';

// ─── Customer Notifications (saved to notifications table + FCM push) ───

async function notifyCustomer(customerId: string, title: string, body: string, opts: {
  bookingId?: string; type?: string; serviceType?: string;
} = {}) {
  try {
    await prisma.notifications.create({
      data: {
        customerId,
        title,
        body,
        type: opts.type || 'b2b_booking',
        serviceType: opts.serviceType || 'bus',
        bookingId: opts.bookingId || null,
      },
    });
    await sendFCMNotification({
      customerId,
      title,
      body,
      data: {
        screen: 'B2BBookingDetail',
        bookingId: opts.bookingId || '',
        type: opts.type || 'b2b_booking',
      },
    });
  } catch (e) {
    console.error('[B2BNotify] Customer notification failed:', e);
  }
}

// ─── Vendor Notifications ───

async function notifyVendor(vendorId: string, title: string, body: string, opts: {
  bookingId?: string; bookingNumber?: string; type?: string; serviceType?: string;
} = {}) {
  try {
    await sendVendorDirectNotification({
      vendorId,
      title,
      body,
      type: opts.type || 'b2b_booking',
      serviceType: opts.serviceType || 'bus',
      bookingId: opts.bookingId,
      bookingNumber: opts.bookingNumber,
    });
  } catch (e) {
    console.error('[B2BNotify] Vendor notification failed:', e);
  }
}

// ─── Notify all vendors in a location ───

async function notifyVendorsInLocation(locationName: string, title: string, body: string, opts: {
  bookingId?: string; bookingNumber?: string; type?: string; serviceType?: string;
} = {}) {
  try {
    const loc = await prisma.locations.findFirst({
      where: {
        OR: [
          { name: { equals: locationName, mode: 'insensitive' } },
          { slug: locationName.toLowerCase().replace(/\s+/g, '-') },
        ],
        isActive: true,
      },
      select: { id: true },
    });

    if (!loc) {
      console.log(`[B2BNotify] No location found for "${locationName}"`);
      return;
    }

    const vendors = await prisma.vendors.findMany({
      where: { vendor_approved_locations: { some: { locationId: loc.id } } },
      select: { id: true },
    });

    console.log(`[B2BNotify] Notifying ${vendors.length} vendors in ${locationName}`);
    await Promise.allSettled(
      vendors.map(v => notifyVendor(v.id, title, body, opts))
    );
  } catch (e) {
    console.error('[B2BNotify] Location vendor notification failed:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PUBLIC API — call these from B2B API routes
// ═══════════════════════════════════════════════════════════════════════

/**
 * 1. B2B Booking Created by Customer/HR
 *    → Notify vendors in pickup location + all managers
 */
export async function onB2BBookingCreated(booking: {
  id: string; bookingNumber: string; serviceType: string;
  pickupLocation: string; companyName: string; vehiclesRequired: number;
}) {
  const svcLabel = booking.serviceType === 'self-drive' ? 'Self Drive' : booking.serviceType?.charAt(0).toUpperCase() + booking.serviceType?.slice(1);
  const title = `New B2B ${svcLabel} Request`;
  const body = `${booking.companyName} needs ${booking.vehiclesRequired} vehicle(s) from ${booking.pickupLocation}. Tap to quote.`;

  // Notify vendors in pickup location
  notifyVendorsInLocation(booking.pickupLocation, title, body, {
    bookingId: booking.id,
    bookingNumber: booking.bookingNumber,
    type: 'b2b_new_booking',
    serviceType: booking.serviceType,
  });
}

/**
 * 2. Vendor Submits Quote
 *    → Notify Customer (HR)
 */
export async function onVendorQuoteSubmitted(quote: {
  bookingId: string; bookingNumber: string; quoteNumber: string;
  vendorName: string; vehicleCount: number; totalPrice: number;
  customerId: string; serviceType: string;
}) {
  const title = 'New Vendor Quote Received';
  const body = `${quote.vendorName} submitted a quote for ${quote.vehicleCount} vehicle(s) at ₹${quote.totalPrice.toLocaleString('en-IN')} for booking ${quote.bookingNumber}.`;

  notifyCustomer(quote.customerId, title, body, {
    bookingId: quote.bookingId,
    type: 'b2b_quote_received',
    serviceType: quote.serviceType,
  });
}

/**
 * 3. Manager Sends Super Quote to Customer
 *    → Notify Customer (HR)
 */
export async function onSuperQuoteSent(data: {
  bookingId: string; bookingNumber: string; quoteNumber: string;
  finalAmount: number; customerId: string; serviceType: string;
}) {
  const title = 'Quote Ready for Approval';
  const body = `Your quote ${data.quoteNumber} for booking ${data.bookingNumber} is ready. Total: ₹${data.finalAmount.toLocaleString('en-IN')}. Tap to review & accept.`;

  notifyCustomer(data.customerId, title, body, {
    bookingId: data.bookingId,
    type: 'b2b_super_quote_sent',
    serviceType: data.serviceType,
  });
}

/**
 * 4. Customer Accepts Super Quote
 *    → Notify all confirmed vendors
 */
export async function onSuperQuoteAccepted(data: {
  bookingId: string; bookingNumber: string; companyName: string;
  serviceType: string; vendorIds: string[];
}) {
  const title = 'B2B Booking Confirmed!';
  const body = `${data.companyName} confirmed booking ${data.bookingNumber}. Prepare vehicles & drivers.`;

  await Promise.allSettled(
    data.vendorIds.map(vendorId =>
      notifyVendor(vendorId, title, body, {
        bookingId: data.bookingId,
        bookingNumber: data.bookingNumber,
        type: 'b2b_booking_confirmed',
        serviceType: data.serviceType,
      })
    )
  );
}

/**
 * 5. Driver Starts Trip (OTP verified)
 *    → Notify Customer (HR)
 */
export async function onTripStarted(data: {
  tripCode: string; bookingId: string; bookingNumber: string;
  driverName: string; vehicleName: string;
  customerId: string; serviceType: string;
}) {
  const title = 'Trip Started';
  const body = `Trip ${data.tripCode} has started. Driver: ${data.driverName}, Vehicle: ${data.vehicleName}.`;

  notifyCustomer(data.customerId, title, body, {
    bookingId: data.bookingId,
    type: 'b2b_trip_started',
    serviceType: data.serviceType,
  });
}

/**
 * 6. Trip Completed
 *    → Notify Customer (HR)
 */
export async function onTripCompleted(data: {
  tripCode: string; bookingId: string; bookingNumber: string;
  customerId: string; serviceType: string;
}) {
  const title = 'Trip Completed';
  const body = `Trip ${data.tripCode} for booking ${data.bookingNumber} has been completed successfully.`;

  notifyCustomer(data.customerId, title, body, {
    bookingId: data.bookingId,
    type: 'b2b_trip_completed',
    serviceType: data.serviceType,
  });
}

/**
 * 7. Invoice Generated
 *    → Notify Customer (HR)
 */
export async function onInvoiceGenerated(data: {
  invoiceNumber: string; bookingId: string; bookingNumber: string;
  totalAmount: number; customerId: string; serviceType: string;
}) {
  const title = 'Invoice Generated';
  const body = `Invoice ${data.invoiceNumber} for ₹${data.totalAmount.toLocaleString('en-IN')} has been generated for booking ${data.bookingNumber}.`;

  notifyCustomer(data.customerId, title, body, {
    bookingId: data.bookingId,
    type: 'b2b_invoice_generated',
    serviceType: data.serviceType,
  });
}
