// @ts-nocheck
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

function generateBlockedDateId(): string {
  return 'fbd_' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 20);
}

/**
 * Check if a fleet vehicle is available for the given date range.
 * Returns { available: true } or { available: false, conflicts: [...] }
 */
export async function checkFleetAvailability(
  vendorFleetId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string
) {
  const where: any = {
    vendorFleetId,
    isActive: true,
    startDate: { lte: endDate },
    endDate: { gte: startDate },
  };

  if (excludeBookingId) {
    where.bookingId = { not: excludeBookingId };
  }

  const conflicts = await prisma.vendor_fleet_blocked_dates.findMany({
    where,
    select: {
      id: true,
      startDate: true,
      endDate: true,
      reason: true,
      bookingId: true,
      bookingType: true,
    },
  });

  if (conflicts.length > 0) {
    return { available: false, conflicts };
  }

  return { available: true, conflicts: [] };
}

/**
 * Block dates for a booking inside a Prisma transaction.
 * Pass `tx` from $transaction.
 */
export async function blockDatesForBooking(
  tx: any,
  vendorFleetId: string,
  startDate: Date,
  endDate: Date,
  bookingId: string,
  bookingType: string
) {
  return tx.vendor_fleet_blocked_dates.create({
    data: {
      id: generateBlockedDateId(),
      vendorFleetId,
      startDate,
      endDate,
      reason: 'BOOKING',
      bookingId,
      bookingType,
      createdBy: 'system',
      isActive: true,
    },
  });
}

/**
 * Release (soft-delete) blocked dates when a booking is cancelled.
 */
export async function releaseDatesForBooking(bookingId: string, bookingType?: string) {
  const where: any = {
    bookingId,
    isActive: true,
    reason: 'BOOKING',
  };

  if (bookingType) {
    where.bookingType = bookingType;
  }

  return prisma.vendor_fleet_blocked_dates.updateMany({
    where,
    data: { isActive: false },
  });
}

/**
 * Vendor manually blocks dates (for maintenance, etc.)
 */
export async function blockDatesManually(
  vendorFleetId: string,
  startDate: Date,
  endDate: Date,
  vendorId: string,
  notes?: string
) {
  return prisma.vendor_fleet_blocked_dates.create({
    data: {
      id: generateBlockedDateId(),
      vendorFleetId,
      startDate,
      endDate,
      reason: 'MAINTENANCE',
      notes: notes || null,
      createdBy: vendorId,
      isActive: true,
    },
  });
}

/**
 * Get blocked dates for a fleet vehicle, optionally filtered by date range.
 */
export async function getBlockedDatesForFleet(
  vendorFleetId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = {
    vendorFleetId,
    isActive: true,
  };

  if (startDate && endDate) {
    where.startDate = { lte: endDate };
    where.endDate = { gte: startDate };
  }

  return prisma.vendor_fleet_blocked_dates.findMany({
    where,
    orderBy: { startDate: 'asc' },
  });
}
