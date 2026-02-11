/**
 * Report Templates
 * Pre-configured report structures for common use cases
 */

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  reportType: 'traffic' | 'conversions' | 'seo' | 'bookings' | 'custom';
  defaultPeriod: string;
  metrics: string[];
  groupBy: 'day' | 'week' | 'month';
  filters?: any;
  comparePrevious: boolean;
  icon?: string;
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'weekly-traffic',
    name: 'Weekly Traffic Summary',
    description: 'Overview of website traffic for the past week',
    reportType: 'traffic',
    defaultPeriod: 'last7days',
    metrics: ['pageViews', 'uniqueVisitors', 'topPages', 'deviceBreakdown', 'locationBreakdown'],
    groupBy: 'day',
    comparePrevious: true,
    icon: 'TrendingUp',
  },

  {
    id: 'monthly-performance',
    name: 'Monthly Performance Report',
    description: 'Comprehensive monthly analytics including traffic, conversions, and SEO',
    reportType: 'custom',
    defaultPeriod: 'thisMonth',
    metrics: ['traffic', 'conversions', 'seo', 'revenue'],
    groupBy: 'week',
    comparePrevious: true,
    icon: 'BarChart',
  },

  {
    id: 'conversion-funnel',
    name: 'Conversion Funnel Analysis',
    description: 'Track user journey from visit to booking',
    reportType: 'conversions',
    defaultPeriod: 'last30days',
    metrics: ['pageViews', 'searches', 'quotes', 'bookings', 'conversionRate'],
    groupBy: 'day',
    comparePrevious: true,
    icon: 'Filter',
  },

  {
    id: 'seo-rankings',
    name: 'SEO Rankings Report',
    description: 'Keyword positions, impressions, and click-through rates',
    reportType: 'seo',
    defaultPeriod: 'last30days',
    metrics: ['rankings', 'impressions', 'clicks', 'ctr', 'positionChanges'],
    groupBy: 'week',
    comparePrevious: true,
    icon: 'Search',
  },

  {
    id: 'revenue-report',
    name: 'Revenue & Bookings Report',
    description: 'Booking volume, revenue, and booking type breakdown',
    reportType: 'bookings',
    defaultPeriod: 'thisMonth',
    metrics: ['bookings', 'revenue', 'averageValue', 'bookingsByType'],
    groupBy: 'day',
    comparePrevious: true,
    icon: 'DollarSign',
  },

  {
    id: 'daily-snapshot',
    name: 'Daily Snapshot',
    description: 'Quick overview of yesterday\'s performance',
    reportType: 'custom',
    defaultPeriod: 'yesterday',
    metrics: ['pageViews', 'conversions', 'revenue', 'topPages'],
    groupBy: 'day',
    comparePrevious: true,
    icon: 'Calendar',
  },

  {
    id: 'traffic-sources',
    name: 'Traffic Sources Analysis',
    description: 'Breakdown of traffic by source, medium, and campaign',
    reportType: 'traffic',
    defaultPeriod: 'last30days',
    metrics: ['sourceBreakdown', 'mediumBreakdown', 'campaigns', 'referrers'],
    groupBy: 'week',
    comparePrevious: true,
    icon: 'Link',
  },

  {
    id: 'user-behavior',
    name: 'User Behavior Report',
    description: 'Device types, browsers, locations, and engagement metrics',
    reportType: 'traffic',
    defaultPeriod: 'last30days',
    metrics: ['devices', 'browsers', 'locations', 'engagement'],
    groupBy: 'week',
    comparePrevious: true,
    icon: 'Users',
  },

  {
    id: 'quarterly-review',
    name: 'Quarterly Review',
    description: 'Comprehensive 3-month performance review',
    reportType: 'custom',
    defaultPeriod: 'last90days',
    metrics: ['traffic', 'conversions', 'seo', 'revenue', 'trends'],
    groupBy: 'month',
    comparePrevious: true,
    icon: 'PieChart',
  },

  {
    id: 'page-performance',
    name: 'Page Performance Report',
    description: 'Individual page analytics and performance metrics',
    reportType: 'traffic',
    defaultPeriod: 'last30days',
    metrics: ['pageViews', 'bounceRate', 'avgTimeOnPage', 'exitRate'],
    groupBy: 'week',
    comparePrevious: true,
    icon: 'FileText',
  },
];

/**
 * Get template by ID
 */
export function getTemplate(id: string): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByType(type: string): ReportTemplate[] {
  return REPORT_TEMPLATES.filter((t) => t.reportType === type);
}

/**
 * Report frequency options
 */
export const REPORT_FREQUENCIES = [
  { value: 'daily', label: 'Daily', description: 'Sent every day at 8:00 AM' },
  { value: 'weekly', label: 'Weekly', description: 'Sent every Monday at 8:00 AM' },
  { value: 'monthly', label: 'Monthly', description: 'Sent on the 1st of every month' },
  { value: 'quarterly', label: 'Quarterly', description: 'Sent at the start of each quarter' },
];

/**
 * Period options
 */
export const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'last90days', label: 'Last 90 Days' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'lastYear', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' },
];

/**
 * Export format options
 */
export const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
  { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
  { value: 'pdf', label: 'PDF', description: 'Portable Document Format (Coming Soon)', disabled: true },
  { value: 'excel', label: 'Excel', description: 'Microsoft Excel (Coming Soon)', disabled: true },
];
