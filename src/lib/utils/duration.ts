/**
 * Client-side duration calculation utilities
 * Matches server-side logic in src/lib/utils.ts
 */

/**
 * Parse time string (HH:MM or HH:MM AM/PM) to hours and minutes
 */
function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  if (!timeStr) return { hours: 0, minutes: 0 };

  // Handle 24-hour format (HH:MM)
  const time24Match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (time24Match) {
    return {
      hours: parseInt(time24Match[1], 10),
      minutes: parseInt(time24Match[2], 10),
    };
  }

  // Handle 12-hour format (HH:MM AM/PM)
  const time12Match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (time12Match) {
    let hours = parseInt(time12Match[1], 10);
    const minutes = parseInt(time12Match[2], 10);
    const period = time12Match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return { hours, minutes };
  }

  return { hours: 0, minutes: 0 };
}

/**
 * Calculate rental duration between two dates (calendar days only)
 * Client-side version for browser use
 * Time is IGNORED - only calendar dates matter
 */
export function calculateRentalDuration(
  pickupDate: Date | string,
  pickupTime: string,
  returnDate: Date | string,
  returnTime?: string
): {
  days: number;
  hours: number;
  totalHours: number;
  totalDays: number;
  formatted: string;
} {
  // Parse dates
  const pickup = typeof pickupDate === 'string' ? new Date(pickupDate) : new Date(pickupDate);
  const returnD = typeof returnDate === 'string' ? new Date(returnDate) : new Date(returnDate);

  // Reset time to start of day (ignore time completely)
  pickup.setHours(0, 0, 0, 0);
  returnD.setHours(0, 0, 0, 0);

  // Calculate difference in calendar days
  const diffMs = returnD.getTime() - pickup.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // Add 1 to make it inclusive (same day = 1 day)
  const totalDays = Math.max(1, diffDays + 1);

  // Format duration string (no hours, just days)
  const formatted = `${totalDays} day${totalDays > 1 ? 's' : ''}`;

  return {
    days: totalDays,
    hours: 0,
    totalHours: totalDays * 24,
    totalDays,
    formatted,
  };
}

/**
 * Format duration from booking data
 * Handles both old bookings (totalDays only) and new bookings (totalDays + totalHours)
 */
export function formatBookingDuration(booking: {
  pickupDate: string | Date;
  pickupTime?: string;
  returnDate?: string | Date;
  dropDate?: string | Date;
  dropTime?: string;
  returnTime?: string;
  totalDays?: number;
  totalHours?: number;
}): string {
  // If totalHours exists, use it for accurate display
  if (booking.totalHours && booking.totalHours > 0) {
    const days = Math.floor(booking.totalHours / 24);
    const hours = booking.totalHours % 24;

    if (days > 0) {
      if (hours > 0) {
        return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
      }
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    return `${booking.totalHours} hour${booking.totalHours > 1 ? 's' : ''}`;
  }

  // If we have dates and times, calculate precisely
  const returnD = booking.returnDate || booking.dropDate;
  const returnT = booking.returnTime || booking.dropTime;

  if (booking.pickupDate && booking.pickupTime && returnD && returnT) {
    const duration = calculateRentalDuration(
      booking.pickupDate,
      booking.pickupTime,
      returnD,
      returnT
    );
    return duration.formatted;
  }

  // Fallback to totalDays if available
  if (booking.totalDays) {
    return `${booking.totalDays} day${booking.totalDays > 1 ? 's' : ''}`;
  }

  // Last resort: calculate from dates only (old logic)
  if (booking.pickupDate && returnD) {
    const pickup = new Date(booking.pickupDate);
    const returnDate = new Date(returnD);
    const diffMs = returnDate.getTime() - pickup.getTime();
    const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return `${days} day${days > 1 ? 's' : ''}`;
  }

  return '1 day';
}

/**
 * Get short duration text (for compact displays)
 * Examples: "3d", "1d 3h", "21h"
 */
export function getShortDuration(booking: {
  pickupDate: string | Date;
  pickupTime?: string;
  returnDate?: string | Date;
  dropDate?: string | Date;
  dropTime?: string;
  returnTime?: string;
  totalDays?: number;
  totalHours?: number;
}): string {
  if (booking.totalHours && booking.totalHours > 0) {
    const days = Math.floor(booking.totalHours / 24);
    const hours = booking.totalHours % 24;

    if (days > 0) {
      if (hours > 0) {
        return `${days}d ${hours}h`;
      }
      return `${days}d`;
    }
    return `${booking.totalHours}h`;
  }

  // Fallback logic similar to formatBookingDuration but shorter
  const returnD = booking.returnDate || booking.dropDate;
  const returnT = booking.returnTime || booking.dropTime;

  if (booking.pickupDate && booking.pickupTime && returnD && returnT) {
    const duration = calculateRentalDuration(
      booking.pickupDate,
      booking.pickupTime,
      returnD,
      returnT
    );

    if (duration.days > 0) {
      if (duration.hours > 0) {
        return `${duration.days}d ${duration.hours}h`;
      }
      return `${duration.days}d`;
    }
    return `${duration.totalHours}h`;
  }

  if (booking.totalDays) {
    return `${booking.totalDays}d`;
  }

  return '1d';
}
