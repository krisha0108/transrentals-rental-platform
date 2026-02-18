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

        // 2. Send FCM push notification if vendor has a token
        if (vendor.fcmToken) {
          console.log(`[VendorNotify] Sending FCM push to vendor ${vendor.id}, token: ${vendor.fcmToken.substring(0, 20)}...`);
          const result = await sendPushNotification(
            vendor.fcmToken,
            {
              title: notificationTitle,
              body: notificationBody,
            },
            notificationData
          );
          console.log(`[VendorNotify] FCM result for vendor ${vendor.id}:`, result);
        } else {
          console.log(`[VendorNotify] Vendor ${vendor.id} has NO fcmToken — skipping push`);
        }
      } catch (err) {
        console.error(`[VendorNotify] Failed for vendor ${vendor.id}:`, err);
      }
    })
  );

  console.log(`[VendorNotify] Done notifying vendors for request ${requestNumber}`);
}
