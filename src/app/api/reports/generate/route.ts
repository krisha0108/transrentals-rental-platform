import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { getDateRange, getPreviousPeriod, compareValues } from '@/lib/reports/comparison-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * Generate Custom Report API
 * POST /api/reports/generate
 *
 * Body:
 * {
 *   reportType: 'traffic' | 'conversions' | 'seo' | 'bookings' | 'custom',
 *   dateRange: { startDate, endDate } | period string,
 *   comparePrevious: boolean,
 *   metrics: string[],
 *   groupBy: 'day' | 'week' | 'month',
 *   filters: {...}
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      reportType,
      dateRange: customDateRange,
      period = 'last30days',
      comparePrevious = true,
      metrics = [],
      groupBy = 'day',
      filters = {},
    } = body;

    // Get date range
    const dateRange = customDateRange
      ? {
          startDate: new Date(customDateRange.startDate),
          endDate: new Date(customDateRange.endDate),
        }
      : getDateRange(period);

    const previousPeriod = comparePrevious ? getPreviousPeriod(dateRange) : null;

    let report: any = {
      reportType,
      period,
      dateRange,
      previousPeriod,
      generatedAt: new Date().toISOString(),
    };

    // Generate report based on type
    switch (reportType) {
      case 'traffic':
        report.data = await generateTrafficReport(dateRange, previousPeriod, groupBy, filters);
        break;

      case 'conversions':
        report.data = await generateConversionsReport(dateRange, previousPeriod, groupBy, filters);
        break;

      case 'seo':
        report.data = await generateSEOReport(dateRange, previousPeriod, filters);
        break;

      case 'bookings':
        report.data = await generateBookingsReport(dateRange, previousPeriod, groupBy, filters);
        break;

      case 'custom':
        report.data = await generateCustomReport(dateRange, metrics, groupBy, filters);
        break;

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Report Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Traffic Report
 */
async function generateTrafficReport(
  dateRange: any,
  previousPeriod: any,
  groupBy: string,
  filters: any
) {
  const currentViews = await prisma.page_views.findMany({
    where: {
      viewedAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
      ...buildFilters(filters),
    },
    select: {
      path: true,
      title: true,
      device: true,
      browser: true,
      country: true,
      city: true,
      referrer: true,
      viewedAt: true,
    },
  });

  const previousViews = previousPeriod
    ? await prisma.page_views.count({
        where: {
          viewedAt: {
            gte: previousPeriod.startDate,
            lte: previousPeriod.endDate,
          },
          ...buildFilters(filters),
        },
      })
    : 0;

  // Top pages
  const pageGroups = currentViews.reduce((acc: any, view) => {
    if (!acc[view.path]) {
      acc[view.path] = { path: view.path, title: view.title, views: 0 };
    }
    acc[view.path].views++;
    return acc;
  }, {});

  const topPages = Object.values(pageGroups)
    .sort((a: any, b: any) => b.views - a.views)
    .slice(0, 20);

  // Device breakdown
  const deviceBreakdown = currentViews.reduce((acc: any, view) => {
    const device = view.device || 'Unknown';
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {});

  // Location breakdown
  const locationBreakdown = currentViews.reduce((acc: any, view) => {
    const location = `${view.city || 'Unknown'}, ${view.country || 'Unknown'}`;
    acc[location] = (acc[location] || 0) + 1;
    return acc;
  }, {});

  const topLocations = Object.entries(locationBreakdown)
    .map(([location, count]) => ({ location, count }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10);

  return {
    summary: {
      totalViews: currentViews.length,
      previousViews,
      comparison: compareValues(currentViews.length, previousViews),
      uniquePages: Object.keys(pageGroups).length,
    },
    topPages,
    deviceBreakdown,
    topLocations,
  };
}

/**
 * Conversions Report
 */
async function generateConversionsReport(
  dateRange: any,
  previousPeriod: any,
  groupBy: string,
  filters: any
) {
  const currentEvents = await prisma.conversion_events.findMany({
    where: {
      timestamp: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
      ...buildFilters(filters),
    },
    select: {
      eventType: true,
      bookingType: true,
      bookingValue: true,
      source: true,
      medium: true,
      device: true,
      country: true,
      timestamp: true,
    },
  });

  const previousCount = previousPeriod
    ? await prisma.conversion_events.count({
        where: {
          timestamp: {
            gte: previousPeriod.startDate,
            lte: previousPeriod.endDate,
          },
          ...buildFilters(filters),
        },
      })
    : 0;

  // Event type breakdown
  const eventTypeBreakdown = currentEvents.reduce((acc: any, event) => {
    const type = event.eventType || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Revenue calculation
  const totalRevenue = currentEvents.reduce((sum, event) => {
    return sum + (event.bookingValue || 0);
  }, 0);

  // Conversion by source
  const sourceBreakdown = currentEvents.reduce((acc: any, event) => {
    const source = event.source || 'Direct';
    if (!acc[source]) {
      acc[source] = { conversions: 0, revenue: 0 };
    }
    acc[source].conversions++;
    acc[source].revenue += event.bookingValue || 0;
    return acc;
  }, {});

  return {
    summary: {
      totalConversions: currentEvents.length,
      previousConversions: previousCount,
      comparison: compareValues(currentEvents.length, previousCount),
      totalRevenue,
      averageValue: currentEvents.length > 0 ? totalRevenue / currentEvents.length : 0,
    },
    eventTypeBreakdown,
    sourceBreakdown,
  };
}

/**
 * SEO Report
 */
async function generateSEOReport(dateRange: any, previousPeriod: any, filters: any) {
  const currentRankings = await prisma.keyword_rankings.findMany({
    where: {
      updatedAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
      ...buildFilters(filters),
    },
    select: {
      keyword: true,
      currentPosition: true,
      previousPosition: true,
      impressions: true,
      clicks: true,
      ctr: true,
    },
    orderBy: {
      impressions: 'desc',
    },
    take: 50,
  });

  const avgPosition =
    currentRankings.length > 0
      ? currentRankings.reduce((sum, r) => sum + (r.currentPosition || 100), 0) /
        currentRankings.length
      : 0;

  const totalClicks = currentRankings.reduce((sum, r) => sum + (r.clicks || 0), 0);
  const totalImpressions = currentRankings.reduce((sum, r) => sum + (r.impressions || 0), 0);
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // Improved positions
  const improved = currentRankings.filter(
    (r) => r.currentPosition && r.previousPosition && r.currentPosition < r.previousPosition
  );

  // Declined positions
  const declined = currentRankings.filter(
    (r) => r.currentPosition && r.previousPosition && r.currentPosition > r.previousPosition
  );

  return {
    summary: {
      totalKeywords: currentRankings.length,
      averagePosition: Math.round(avgPosition * 10) / 10,
      totalClicks,
      totalImpressions,
      averageCTR: Math.round(avgCTR * 100) / 100,
      improved: improved.length,
      declined: declined.length,
    },
    topKeywords: currentRankings.slice(0, 20),
    improved: improved.slice(0, 10),
    declined: declined.slice(0, 10),
  };
}

/**
 * Bookings Report
 */
async function generateBookingsReport(
  dateRange: any,
  previousPeriod: any,
  groupBy: string,
  filters: any
) {
  // This would query your bookings table
  // For now, using conversion events as proxy
  const bookingEvents = await prisma.conversion_events.findMany({
    where: {
      timestamp: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
      eventType: 'BOOKING_COMPLETED',
      ...buildFilters(filters),
    },
    select: {
      bookingType: true,
      bookingValue: true,
      source: true,
      medium: true,
      device: true,
      timestamp: true,
    },
  });

  const previousBookings = previousPeriod
    ? await prisma.conversion_events.count({
        where: {
          timestamp: {
            gte: previousPeriod.startDate,
            lte: previousPeriod.endDate,
          },
          eventType: 'BOOKING_COMPLETED',
          ...buildFilters(filters),
        },
      })
    : 0;

  const totalRevenue = bookingEvents.reduce((sum, b) => sum + (b.bookingValue || 0), 0);

  // Booking type breakdown
  const typeBreakdown = bookingEvents.reduce((acc: any, booking) => {
    const type = booking.bookingType || 'Unknown';
    if (!acc[type]) {
      acc[type] = { count: 0, revenue: 0 };
    }
    acc[type].count++;
    acc[type].revenue += booking.bookingValue || 0;
    return acc;
  }, {});

  return {
    summary: {
      totalBookings: bookingEvents.length,
      previousBookings,
      comparison: compareValues(bookingEvents.length, previousBookings),
      totalRevenue,
      averageBookingValue: bookingEvents.length > 0 ? totalRevenue / bookingEvents.length : 0,
    },
    typeBreakdown,
  };
}

/**
 * Custom Report
 */
async function generateCustomReport(
  dateRange: any,
  metrics: string[],
  groupBy: string,
  filters: any
) {
  return {
    message: 'Custom report generation - implement based on specific metrics',
    metrics,
    groupBy,
    filters,
  };
}

/**
 * Build filters for Prisma queries
 */
function buildFilters(filters: any): any {
  const where: any = {};

  if (filters.device) where.device = filters.device;
  if (filters.country) where.country = filters.country;
  if (filters.source) where.source = filters.source;
  if (filters.bookingType) where.bookingType = filters.bookingType;

  return where;
}
