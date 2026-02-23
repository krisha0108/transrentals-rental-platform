import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert string to URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format price in Indian Rupees
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Capitalize first letter of each word
 */
export function capitalize(text: string): string {
  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format price highlight string (e.g., "@₹3999/day" -> "Starting from ₹3999")
 */
export function formatPriceHighlight(text: string): string {
  if (!text) return '';
  // Replace pattern like "Starting @₹2499/day" or "@₹2499/day" with "Starting from ₹2499"
  return text.replace(/(?:Starting\s+)?@₹(\d+)(?:\/day)?/gi, 'Starting from ₹$1');
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Indian phone number
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
  }
  return phone;
}

/**
 * Generate meta description from content
 */
export function generateMetaDescription(content: string, maxLength = 160): string {
  const stripped = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
  return truncate(stripped, maxLength);
}

const ASSET_BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://transrentals.com').replace(/\/$/, '');

export function resolveAssetUrl(path?: string): string {
  if (!path) return ASSET_BASE_URL;

  // Return data URLs as-is (base64 encoded images)
  if (path.startsWith('data:')) {
    return path;
  }

  // Return absolute URLs as-is
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Remove 'public' prefix if present (Next.js serves from public as root)
  if (path.startsWith('public/')) path = path.replace('public/', '/');
  if (path.startsWith('/public/')) path = path.replace('/public/', '/');

  // If path already starts with /uploads or /images, use as is
  if (path.startsWith('/uploads/') || path.startsWith('/images/')) {
    return `${ASSET_BASE_URL}${path}`;
  }

  // If path starts with uploads/ (without leading slash), add it
  if (path.startsWith('uploads/')) {
    return `${ASSET_BASE_URL}/${path}`;
  }

  // If it's just a filename (no path separators at start), assume it's in uploads
  if (!path.startsWith('/')) {
    return `${ASSET_BASE_URL}/uploads/${path}`;
  }

  return `${ASSET_BASE_URL}${path}`;
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDate(d);
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      const sourceValue = source[key];
      if (sourceValue !== undefined && isObject(sourceValue)) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], sourceValue as any);
      } else if (sourceValue !== undefined) {
        Object.assign(target, { [key]: sourceValue });
      }
    }
  }

  return deepMerge(target, ...sources);
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate breadcrumb schema for SEO
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${process.env.NEXT_PUBLIC_APP_URL}${item.url}`,
    })),
  };
}

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
 * Returns: { days, hours, totalHours, totalDays, formatted }
 *
 * Examples:
 * - 12 Feb → 12 Feb = 1 day (same day)
 * - 12 Feb → 13 Feb = 2 days (overnight)
 * - 12 Feb → 15 Feb = 4 days
 *
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
 * Calculate total days for rental (legacy compatibility - rounds up)
 * Use this for pricing calculations
 */
export function calculateTotalDays(
  pickupDate: Date | string,
  pickupTime: string,
  returnDate: Date | string,
  returnTime?: string
): number {
  const duration = calculateRentalDuration(pickupDate, pickupTime, returnDate, returnTime);
  return duration.totalDays;
}
