import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

/**
 * Get booking attribution analytics
 * GET /api/admin/analytics/attribution
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || '30';
    const daysAgo = parseInt(dateRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get all booking attributions
    const attributions = await prisma.booking_attribution.findMany({
      where: {
        createdAt: { gte: startDate },
      },
    });

    // First-touch attribution analysis
    const firstTouchMap = new Map<string, {
      source: string;
      bookings: number;
      revenue: number;
      avgTimeToConvert: number;
      avgTouchpoints: number;
    }>();

    attributions.forEach((attr) => {
      const source = attr.firstSource || 'direct';
      const existing = firstTouchMap.get(source) || {
        source,
        bookings: 0,
        revenue: 0,
        avgTimeToConvert: 0,
        avgTouchpoints: 0,
      };

      existing.bookings++;
      existing.revenue += attr.bookingValue || 0;
      existing.avgTimeToConvert += attr.timeToConvert || 0;
      existing.avgTouchpoints += attr.totalPageViews;

      firstTouchMap.set(source, existing);
    });

    const firstTouchAttribution = Array.from(firstTouchMap.values()).map((item) => ({
      ...item,
      avgTimeToConvert: item.bookings > 0 ? Math.round(item.avgTimeToConvert / item.bookings) : 0,
      avgTouchpoints: item.bookings > 0 ? Math.round(item.avgTouchpoints / item.bookings) : 0,
      avgOrderValue: item.bookings > 0 ? item.revenue / item.bookings : 0,
    })).sort((a, b) => b.revenue - a.revenue);

    // Last-touch attribution analysis
    const lastTouchMap = new Map<string, {
      source: string;
      bookings: number;
      revenue: number;
      avgTimeToConvert: number;
      avgTouchpoints: number;
    }>();

    attributions.forEach((attr) => {
      const source = attr.lastSource || 'direct';
      const existing = lastTouchMap.get(source) || {
        source,
        bookings: 0,
        revenue: 0,
        avgTimeToConvert: 0,
        avgTouchpoints: 0,
      };

      existing.bookings++;
      existing.revenue += attr.bookingValue || 0;
      existing.avgTimeToConvert += attr.timeToConvert || 0;
      existing.avgTouchpoints += attr.totalPageViews;

      lastTouchMap.set(source, existing);
    });

    const lastTouchAttribution = Array.from(lastTouchMap.values()).map((item) => ({
      ...item,
      avgTimeToConvert: item.bookings > 0 ? Math.round(item.avgTimeToConvert / item.bookings) : 0,
      avgTouchpoints: item.bookings > 0 ? Math.round(item.avgTouchpoints / item.bookings) : 0,
      avgOrderValue: item.bookings > 0 ? item.revenue / item.bookings : 0,
    })).sort((a, b) => b.revenue - a.revenue);

    // Attribution by booking type
    const bookingTypeMap = new Map<string, {
      firstTouch: Map<string, { bookings: number; revenue: number }>;
      lastTouch: Map<string, { bookings: number; revenue: number }>;
    }>();

    attributions.forEach((attr) => {
      const type = attr.bookingType;
      if (!bookingTypeMap.has(type)) {
        bookingTypeMap.set(type, {
          firstTouch: new Map(),
          lastTouch: new Map(),
        });
      }

      const typeData = bookingTypeMap.get(type)!;

      // First touch
      const firstSource = attr.firstSource || 'direct';
      const firstData = typeData.firstTouch.get(firstSource) || { bookings: 0, revenue: 0 };
      firstData.bookings++;
      firstData.revenue += attr.bookingValue || 0;
      typeData.firstTouch.set(firstSource, firstData);

      // Last touch
      const lastSource = attr.lastSource || 'direct';
      const lastData = typeData.lastTouch.get(lastSource) || { bookings: 0, revenue: 0 };
      lastData.bookings++;
      lastData.revenue += attr.bookingValue || 0;
      typeData.lastTouch.set(lastSource, lastData);
    });

    const attributionByBookingType: Record<string, {
      firstTouch: Array<{ source: string; bookings: number; revenue: number }>;
      lastTouch: Array<{ source: string; bookings: number; revenue: number }>;
    }> = {};

    bookingTypeMap.forEach((data, type) => {
      attributionByBookingType[type] = {
        firstTouch: Array.from(data.firstTouch.entries())
          .map(([source, stats]) => ({ source, ...stats }))
          .sort((a, b) => b.revenue - a.revenue),
        lastTouch: Array.from(data.lastTouch.entries())
          .map(([source, stats]) => ({ source, ...stats }))
          .sort((a, b) => b.revenue - a.revenue),
      };
    });

    // Top keywords by booking type
    const keywordMap = new Map<string, {
      keyword: string;
      bookings: number;
      revenue: number;
      bookingTypes: Record<string, number>;
    }>();

    attributions.forEach((attr) => {
      const keyword = attr.firstKeyword || attr.lastKeyword;
      if (!keyword) return;

      const existing = keywordMap.get(keyword) || {
        keyword,
        bookings: 0,
        revenue: 0,
        bookingTypes: {},
      };

      existing.bookings++;
      existing.revenue += attr.bookingValue || 0;
      existing.bookingTypes[attr.bookingType] = (existing.bookingTypes[attr.bookingType] || 0) + 1;

      keywordMap.set(keyword, existing);
    });

    const topKeywords = Array.from(keywordMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    // Time to conversion analysis
    const timeToConvertBuckets = {
      '0-1h': 0,
      '1-6h': 0,
      '6-24h': 0,
      '1-3d': 0,
      '3-7d': 0,
      '7d+': 0,
    };

    attributions.forEach((attr) => {
      const hours = (attr.timeToConvert || 0) / 3600;
      if (hours <= 1) timeToConvertBuckets['0-1h']++;
      else if (hours <= 6) timeToConvertBuckets['1-6h']++;
      else if (hours <= 24) timeToConvertBuckets['6-24h']++;
      else if (hours <= 72) timeToConvertBuckets['1-3d']++;
      else if (hours <= 168) timeToConvertBuckets['3-7d']++;
      else timeToConvertBuckets['7d+']++;
    });

    // Landing page performance
    const landingPageMap = new Map<string, {
      page: string;
      bookings: number;
      revenue: number;
      avgTimeToConvert: number;
    }>();

    attributions.forEach((attr) => {
      const page = attr.firstLandingPage || '/';
      const existing = landingPageMap.get(page) || {
        page,
        bookings: 0,
        revenue: 0,
        avgTimeToConvert: 0,
      };

      existing.bookings++;
      existing.revenue += attr.bookingValue || 0;
      existing.avgTimeToConvert += attr.timeToConvert || 0;

      landingPageMap.set(page, existing);
    });

    const topLandingPages = Array.from(landingPageMap.values())
      .map((item) => ({
        ...item,
        avgTimeToConvert: item.bookings > 0 ? Math.round(item.avgTimeToConvert / item.bookings) : 0,
        avgOrderValue: item.bookings > 0 ? item.revenue / item.bookings : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);

    // Calculate summary
    const totalBookings = attributions.length;
    const totalRevenue = attributions.reduce((sum, a) => sum + (a.bookingValue || 0), 0);
    const avgTimeToConvert = totalBookings > 0
      ? attributions.reduce((sum, a) => sum + (a.timeToConvert || 0), 0) / totalBookings
      : 0;
    const avgTouchpoints = totalBookings > 0
      ? attributions.reduce((sum, a) => sum + a.totalPageViews, 0) / totalBookings
      : 0;

    return NextResponse.json({
      summary: {
        totalBookings,
        totalRevenue,
        avgOrderValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
        avgTimeToConvert: Math.round(avgTimeToConvert),
        avgTouchpoints: Math.round(avgTouchpoints),
      },
      firstTouchAttribution,
      lastTouchAttribution,
      attributionByBookingType,
      topKeywords,
      timeToConvertBuckets,
      topLandingPages,
    });
  } catch (error) {
    console.error('[Analytics Attribution] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attribution analytics' },
      { status: 500 }
    );
  }
}
