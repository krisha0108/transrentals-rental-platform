/**
 * Notification Helper Utilities
 * Ensures notification data is clean before saving to database
 */

/**
 * Validates and cleans an ID (quote ID or booking ID)
 * Returns null if ID is invalid
 */
export function cleanNotificationId(id: any): string | null {
  if (!id) return null;

  const idStr = String(id).trim();

  // Invalid cases
  if (
    idStr === '' ||
    idStr === 'null' ||
    idStr === 'undefined' ||
    idStr.length < 10 ||
    idStr.endsWith('-') // Trailing dash is invalid
  ) {
    console.warn(`[cleanNotificationId] Invalid ID detected: "${idStr}"`);
    return null;
  }

  return idStr;
}

/**
 * Prepares notification data for database insertion
 * Cleans all IDs and ensures proper format
 */
export function prepareNotificationData(data: {
  customerId: string;
  title: string;
  body: string;
  type?: string;
  serviceType?: string; // bike, bus, truck, equipment, packers, self-drive, luxury
  quoteId?: string | null;
  bookingId?: string | null;
  image?: string | null;
}) {
  const cleanData = {
    customerId: data.customerId,
    title: data.title,
    body: data.body,
    type: data.type || 'general',
    serviceType: data.serviceType || null,
    quoteId: cleanNotificationId(data.quoteId),
    bookingId: cleanNotificationId(data.bookingId),
    image: data.image || null,
    isRead: false,
  };

  // Log if IDs were cleaned
  if (data.quoteId && cleanData.quoteId !== data.quoteId) {
    console.warn(`[prepareNotificationData] Quote ID cleaned: "${data.quoteId}" -> "${cleanData.quoteId}"`);
  }
  if (data.bookingId && cleanData.bookingId !== data.bookingId) {
    console.warn(`[prepareNotificationData] Booking ID cleaned: "${data.bookingId}" -> "${cleanData.bookingId}"`);
  }

  return cleanData;
}

/**
 * Example usage:
 *
 * import { prepareNotificationData } from '@/lib/utils/notification-helper';
 *
 * await prisma.notifications.create({
 *   data: prepareNotificationData({
 *     customerId: 'cm123',
 *     title: 'Quote Received',
 *     body: 'You have a new quote',
 *     type: 'quote',
 *     quoteId: quote.id, // Will be cleaned automatically
 *     bookingId: null,
 *   })
 * });
 */
