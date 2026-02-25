// @ts-nocheck
/**
 * Sends push notifications + saves DB notification to all eligible vendors
 * when a new customer quote request is created.
 */

import { prisma } from '@/lib/db/prisma';
import { sendPushNotification } from '@/lib/services/push-notification-service';

interface QuoteRequestNotificationParams {
  requestId: string;
  requestNumber: string;
  locationId: string;
  locationName: string;
  customerName: string;
  serviceType: string;       // 'bike' | 'bus' | 'truck' | 'luxury' | 'packers' | 'self-drive' | 'equipment'
  serviceDisplayName: string; // 'Bike Rental' | 'Bus Rental' | etc.
}

export async function sendQuoteRequestNotificationToVendors(
  params: QuoteRequestNotificationParams
): Promise<void> {
  const { requestId, requestNumber, locationId, locationName, customerName, serviceType, serviceDisplayName } = params;

  // Resolve locationId — some services pass a city name string instead of a DB cuid.
  // Try the given value first; if no vendors found, look up the location by name/slug.
  let resolvedLocationId = locationId;

  let vendors = await prisma.vendors.findMany({
    where: { vendor_approved_locations: { some: { locationId: resolvedLocationId } } },
    select: { id: true, fcmToken: true },
  });

  if (!vendors.length) {
    // Fallback: locationId might be a city name — look up the real DB id
    const loc = await prisma.locations.findFirst({
      where: {
        OR: [
          { id: locationId },
          { slug: locationId.toLowerCase().replace(/\s+/g, '-') },
          { name: { contains: locationId } },
        ],
        isActive: true,
      },
      select: { id: true },
    });

    if (loc) {
      resolvedLocationId = loc.id;
      vendors = await prisma.vendors.findMany({
        where: { vendor_approved_locations: { some: { locationId: resolvedLocationId } } },
        select: { id: true, fcmToken: true },
      });
    }
  }

  if (!vendors.length) {
    console.log(`[VendorNotify] No vendors found for location "${locationId}" (resolved: "${resolvedLocationId}")`);
    return;
  }

  console.log(`[VendorNotify] Notifying ${vendors.length} vendors for ${serviceDisplayName} request ${requestNumber}`);

  const notificationTitle = `New ${serviceDisplayName} Request`;
  const notificationBody = `${customerName} is looking for ${serviceDisplayName} in ${locationName}. Tap to view and send your quote.`;
  const notificationData = {
    screen: 'QuoteRequestDetail',
    serviceType,
    requestId,
    requestNumber,
  };

  // Process all vendors in parallel
  await Promise.allSettled(
    vendors.map(async (vendor) => {
      try {
        // 1. Save notification to vendor's settings
        const settingKey = `vendor_notifications_${vendor.id}`;
        const existing = await prisma.settings.findUnique({ where: { key: settingKey } });
        const data: any = existing?.value
          ? JSON.parse(existing.value as string)
          : { notifications: [] };

        const newNotification = {
          id: `qr_${requestId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          type: 'quote_request',
          title: notificationTitle,
          body: notificationBody,
          requestId,
          requestNumber,
          serviceType,
          read: false,
          createdAt: new Date().toISOString(),
        };

        // Prepend new notification, keep latest 50
        data.notifications = [newNotification, ...(data.notifications || [])].slice(0, 50);

        const serialized = JSON.stringify(data);
        await prisma.settings.upsert({
          where: { key: settingKey },
          create: { key: settingKey, value: serialized },
          update: { value: serialized },
        });

        // 2. Send FCM push to ALL devices of this vendor
        const tokens = await getVendorFcmTokens(vendor.id);
        if (tokens.length === 0) {
          console.log(`[VendorNotify] Vendor ${vendor.id} has NO fcmToken — skipping push`);
        } else {
          await Promise.allSettled(
            tokens.map((token) => sendPushNotification(token, { title: notificationTitle, body: notificationBody }, notificationData))
          );
          console.log(`[VendorNotify] FCM sent to ${tokens.length} device(s) for vendor ${vendor.id}`);
        }
      } catch (err) {
        console.error(`[VendorNotify] Failed for vendor ${vendor.id}:`, err);
      }
    })
  );

  console.log(`[VendorNotify] Done notifying vendors for request ${requestNumber}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Send a notification to a SINGLE specific vendor (e.g. quote accepted, booking assigned)
// ─────────────────────────────────────────────────────────────────────────────

interface VendorDirectNotificationParams {
  vendorId: string;
  title: string;
  body: string;
  type: string;           // 'booking_confirmed' | 'booking_assigned' | 'quote_accepted' etc.
  serviceType: string;
  bookingId?: string;
  bookingNumber?: string;
  data?: Record<string, string>;
}

// Helper: get all FCM tokens for a vendor (multi-device support)
async function getVendorFcmTokens(vendorId: string): Promise<string[]> {
  // 1. Check multi-device tokens from settings table
  const settingKey = `vendor_fcm_tokens_${vendorId}`;
  const setting = await prisma.settings.findUnique({ where: { key: settingKey } });
  if (setting?.value) {
    const data = JSON.parse(setting.value as string);
    const tokens: string[] = (data.tokens || []).map((t: any) => t.token).filter(Boolean);
    if (tokens.length > 0) return tokens;
  }
  // 2. Fallback to single fcmToken on vendors table
  const vendor = await prisma.vendors.findUnique({
    where: { id: vendorId },
    select: { fcmToken: true },
  });
  return vendor?.fcmToken ? [vendor.fcmToken] : [];
}

export async function sendVendorDirectNotification(
  params: VendorDirectNotificationParams
): Promise<void> {
  const { vendorId, title, body, type, serviceType, bookingId, bookingNumber, data: extraData } = params;

  try {
    // 1. Save to vendor's in-app notifications
    const settingKey = `vendor_notifications_${vendorId}`;
    const existing = await prisma.settings.findUnique({ where: { key: settingKey } });
    const notifData: any = existing?.value
      ? JSON.parse(existing.value as string)
      : { notifications: [] };

    const newNotification = {
      id: `${type}_${bookingId || Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      title,
      body,
      bookingId: bookingId || null,
      bookingNumber: bookingNumber || null,
      serviceType,
      read: false,
      createdAt: new Date().toISOString(),
    };

    notifData.notifications = [newNotification, ...(notifData.notifications || [])].slice(0, 50);

    await prisma.settings.upsert({
      where: { key: settingKey },
      create: { key: settingKey, value: JSON.stringify(notifData) },
      update: { value: JSON.stringify(notifData) },
    });

    // 2. Send FCM push to ALL devices
    const tokens = await getVendorFcmTokens(vendorId);
    if (tokens.length === 0) {
      console.log(`[VendorDirectNotify] Vendor ${vendorId} has NO fcmToken — skipping push`);
      return;
    }

    const pushData = {
      screen: 'BookingDetail',
      serviceType,
      bookingId: bookingId || '',
      bookingNumber: bookingNumber || '',
      ...extraData,
    };

    const results = await Promise.allSettled(
      tokens.map((token) => sendPushNotification(token, { title, body }, pushData))
    );
    console.log(`[VendorDirectNotify] Sent to ${tokens.length} device(s) for vendor ${vendorId}:`, results.map(r => r.status));
  } catch (err) {
    console.error(`[VendorDirectNotify] Failed for vendor ${vendorId}:`, err);
  }
}
