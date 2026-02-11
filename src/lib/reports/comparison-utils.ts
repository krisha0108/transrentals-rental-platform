/**
 * Comparison & Analysis Utilities
 * For period-over-period comparisons and trend analysis
 */

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ComparisonResult {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TimeSeriesData {
  date: Date;
  value: number;
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Compare two values and get detailed result
 */
export function compareValues(
  current: number,
  previous: number,
  threshold: number = 0.5
): ComparisonResult {
  const change = current - previous;
  const changePercent = calculatePercentageChange(current, previous);

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(changePercent) > threshold) {
    trend = changePercent > 0 ? 'up' : 'down';
  }

  return {
    current,
    previous,
    change,
    changePercent,
    trend,
  };
}

/**
 * Get previous period date range
 */
export function getPreviousPeriod(dateRange: DateRange): DateRange {
  const { startDate, endDate } = dateRange;
  const duration = endDate.getTime() - startDate.getTime();

  return {
    startDate: new Date(startDate.getTime() - duration),
    endDate: new Date(startDate.getTime() - 1), // One day before current start
  };
}

/**
 * Get date range for common periods
 */
export function getDateRange(period: string): DateRange {
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let startDate: Date;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      break;

    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
      endDate.setTime(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);
      break;

    case 'last7days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;

    case 'last30days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;

    case 'thisWeek':
      startDate = new Date(now);
      const dayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      break;

    case 'lastWeek':
      const lastWeekEnd = new Date(now);
      const lastWeekDayOfWeek = lastWeekEnd.getDay();
      lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekDayOfWeek - 1);
      lastWeekEnd.setHours(23, 59, 59, 999);
      startDate = new Date(lastWeekEnd);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate.setTime(lastWeekEnd.getTime());
      break;

    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      break;

    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      endDate.setTime(new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).getTime());
      break;

    case 'thisYear':
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      break;

    case 'lastYear':
      startDate = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0);
      endDate.setTime(new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59).getTime());
      break;

    default:
      // Default to last 7 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
  }

  return { startDate, endDate };
}

/**
 * Group time series data by period (day, week, month)
 */
export function groupByPeriod(
  data: TimeSeriesData[],
  groupBy: 'day' | 'week' | 'month'
): TimeSeriesData[] {
  const grouped = new Map<string, number>();

  data.forEach((item) => {
    const date = new Date(item.date);
    let key: string;

    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;

      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;

      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;

      default:
        key = date.toISOString().split('T')[0];
    }

    grouped.set(key, (grouped.get(key) || 0) + item.value);
  });

  return Array.from(grouped.entries())
    .map(([dateStr, value]) => ({
      date: new Date(dateStr),
      value,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calculate growth rate
 */
export function calculateGrowthRate(timeSeries: TimeSeriesData[]): number {
  if (timeSeries.length < 2) return 0;

  const first = timeSeries[0].value;
  const last = timeSeries[timeSeries.length - 1].value;

  return calculatePercentageChange(last, first);
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(
  timeSeries: TimeSeriesData[],
  window: number = 7
): TimeSeriesData[] {
  const result: TimeSeriesData[] = [];

  for (let i = 0; i < timeSeries.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = timeSeries.slice(start, i + 1);
    const average = slice.reduce((sum, item) => sum + item.value, 0) / slice.length;

    result.push({
      date: timeSeries[i].date,
      value: Math.round(average * 100) / 100,
    });
  }

  return result;
}

/**
 * Get top N items from array
 */
export function getTopItems<T>(
  items: T[],
  getValue: (item: T) => number,
  limit: number = 10
): T[] {
  return items
    .sort((a, b) => getValue(b) - getValue(a))
    .slice(0, limit);
}

/**
 * Calculate distribution
 */
export function calculateDistribution<T>(
  items: T[],
  getCategory: (item: T) => string,
  getValue: (item: T) => number
): Record<string, number> {
  const distribution: Record<string, number> = {};

  items.forEach((item) => {
    const category = getCategory(item);
    distribution[category] = (distribution[category] || 0) + getValue(item);
  });

  return distribution;
}

/**
 * Format comparison for display
 */
export function formatComparison(comparison: ComparisonResult): {
  icon: string;
  color: string;
  text: string;
} {
  const { trend, changePercent } = comparison;

  const icon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const color =
    trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const text = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`;

  return { icon, color, text };
}
