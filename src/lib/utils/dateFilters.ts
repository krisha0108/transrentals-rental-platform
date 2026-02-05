/**
 * Date Filter Utilities
 * Provides helper functions for date range calculations and formatting
 */

export type DateFilterType =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom';

export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Get date range for predefined filters
 * @param filterType - The type of date filter to apply
 * @returns DateRange object with startDate and endDate in YYYY-MM-DD format, or null for 'all'
 */
export function getDateRange(filterType: DateFilterType): DateRange | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filterType) {
    case 'all':
      return null;

    case 'today':
      return {
        startDate: formatDateForAPI(today),
        endDate: formatDateForAPI(today),
      };

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: formatDateForAPI(yesterday),
        endDate: formatDateForAPI(yesterday),
      };
    }

    case 'thisWeek': {
      // Get Monday of current week
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

      // Get Sunday of current week
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return {
        startDate: formatDateForAPI(monday),
        endDate: formatDateForAPI(sunday),
      };
    }

    case 'lastWeek': {
      // Get Monday of last week
      const dayOfWeek = today.getDay();
      const lastMonday = new Date(today);
      lastMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7);

      // Get Sunday of last week
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);

      return {
        startDate: formatDateForAPI(lastMonday),
        endDate: formatDateForAPI(lastSunday),
      };
    }

    case 'thisMonth': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      return {
        startDate: formatDateForAPI(firstDay),
        endDate: formatDateForAPI(lastDay),
      };
    }

    case 'lastMonth': {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);

      return {
        startDate: formatDateForAPI(firstDay),
        endDate: formatDateForAPI(lastDay),
      };
    }

    case 'custom':
      // Custom range should be provided by the user
      return null;

    default:
      return null;
  }
}

/**
 * Format date for API (YYYY-MM-DD)
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date range for display
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range string
 */
export function formatDateRangeDisplay(startDate: Date, endDate: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };

  const start = startDate.toLocaleDateString('en-IN', options);
  const end = endDate.toLocaleDateString('en-IN', options);

  // If same date, show only once
  if (formatDateForAPI(startDate) === formatDateForAPI(endDate)) {
    return start;
  }

  return `${start} - ${end}`;
}

/**
 * Get label for predefined date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Label string or null if not a predefined range
 */
export function getDateRangeLabel(startDate: Date, endDate: Date): string | null {
  const start = formatDateForAPI(startDate);
  const end = formatDateForAPI(endDate);

  // Check each predefined filter type
  const filters: DateFilterType[] = ['today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth'];

  for (const filterType of filters) {
    const range = getDateRange(filterType);
    if (range && range.startDate === start && range.endDate === end) {
      return getFilterLabel(filterType);
    }
  }

  return null;
}

/**
 * Get human-readable label for filter type
 * @param filterType - The filter type
 * @returns Human-readable label
 */
export function getFilterLabel(filterType: DateFilterType): string {
  switch (filterType) {
    case 'all':
      return 'All Time';
    case 'today':
      return 'Today';
    case 'yesterday':
      return 'Yesterday';
    case 'thisWeek':
      return 'This Week';
    case 'lastWeek':
      return 'Last Week';
    case 'thisMonth':
      return 'This Month';
    case 'lastMonth':
      return 'Last Month';
    case 'custom':
      return 'Custom Range';
    default:
      return 'All Time';
  }
}

/**
 * Parse date string to Date object
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object
 */
export function parseAPIDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Validate date range
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns Validation result with error message if invalid
 */
export function validateDateRange(
  startDate: string | null,
  endDate: string | null
): { valid: boolean; error?: string } {
  if (!startDate && !endDate) {
    return { valid: true };
  }

  if (startDate && !endDate) {
    return { valid: false, error: 'End date is required when start date is provided' };
  }

  if (!startDate && endDate) {
    return { valid: false, error: 'Start date is required when end date is provided' };
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      return { valid: false, error: 'Invalid start date format' };
    }

    if (isNaN(end.getTime())) {
      return { valid: false, error: 'Invalid end date format' };
    }

    if (start > end) {
      return { valid: false, error: 'Start date must be before or equal to end date' };
    }
  }

  return { valid: true };
}
