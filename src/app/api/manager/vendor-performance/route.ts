import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * Quotes live in one table per service, all with the same three columns this
 * route cares about: vendorId, status and createdAt. Listing the delegates
 * once keeps the seven services from turning into seven copies of the same
 * three queries.
 */
const QUOTE_MODELS = [
  'bike_quotes',
  'bus_quotes',
  'self_drive_quotes',
  'equipment_quotes',
  'luxury_quotes',
  'packers_quotes',
  'truck_quotes',
] as const;

type QuoteAgg = { totalQuotes: number; acceptedQuotes: number; lastQuoteAt: Date | null };

/**
 * Resolve the ?from/?to window.
 *
 * Dates arrive as plain YYYY-MM-DD from the picker and mean whole days in the
 * manager's day, so `to` is pushed to the end of that day — otherwise a
 * same-day range would silently exclude everything after midnight.
 */
function parseRange(searchParams: URLSearchParams): { from?: Date; to?: Date } {
  const rawFrom = searchParams.get('from');
  const rawTo = searchParams.get('to');

  const from = rawFrom ? new Date(`${rawFrom}T00:00:00`) : undefined;
  const to = rawTo ? new Date(`${rawTo}T23:59:59.999`) : undefined;

  return {
    from: from && !Number.isNaN(from.getTime()) ? from : undefined,
    to: to && !Number.isNaN(to.getTime()) ? to : undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: {
        manager_locations: true,
        manager_services: true,
      },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const { from, to } = parseRange(searchParams);
    const locationId = searchParams.get('locationId') || '';

    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);

    // A manager may only ever filter down to their own locations, never past
    // them — an unrecognised locationId falls back to the full assigned set
    // rather than widening the query.
    const scopedLocationIds =
      locationId && assignedLocationIds.includes(locationId)
        ? [locationId]
        : assignedLocationIds;

    const vendors = await prisma.vendors.findMany({
      where: {
        vendor_approved_locations: {
          some: { locationId: { in: scopedLocationIds } },
        },
      },
      select: {
        id: true,
        businessName: true,
        status: true,
        lastLoginAt: true,
        vendor_approved_locations: {
          where: { locationId: { in: assignedLocationIds } },
          select: { locations: { select: { id: true, name: true } } },
        },
      },
    });

    const vendorIds = vendors.map((v) => v.id);

    const perf: Record<string, QuoteAgg> = {};
    vendorIds.forEach((id) => {
      perf[id] = { totalQuotes: 0, acceptedQuotes: 0, lastQuoteAt: null };
    });

    // Only quotes raised inside the selected window count. With no window the
    // numbers are all-time, which is what the page showed before filters.
    const createdAt = from || to ? { ...(from && { gte: from }), ...(to && { lte: to }) } : undefined;
    const baseWhere = { vendorId: { in: vendorIds }, ...(createdAt && { createdAt }) };

    if (vendorIds.length > 0) {
      await Promise.all(
        QUOTE_MODELS.map(async (model) => {
          const delegate = (prisma as any)[model];
          if (!delegate) return;

          const [totals, accepted] = await Promise.all([
            // _max(createdAt) rides along with the count so "last quote" costs
            // no extra query.
            delegate.groupBy({
              by: ['vendorId'],
              where: baseWhere,
              _count: { id: true },
              _max: { createdAt: true },
            }),
            delegate.groupBy({
              by: ['vendorId'],
              where: { ...baseWhere, status: 'ACCEPTED' },
              _count: { id: true },
            }),
          ]);

          for (const row of totals as any[]) {
            const bucket = perf[row.vendorId];
            if (!bucket) continue;
            bucket.totalQuotes += row._count.id;
            const last = row._max?.createdAt ? new Date(row._max.createdAt) : null;
            if (last && (!bucket.lastQuoteAt || last > bucket.lastQuoteAt)) {
              bucket.lastQuoteAt = last;
            }
          }
          for (const row of accepted as any[]) {
            const bucket = perf[row.vendorId];
            if (bucket) bucket.acceptedQuotes += row._count.id;
          }
        })
      );
    }

    const data = vendors.map((v) => {
      const p = perf[v.id] || { totalQuotes: 0, acceptedQuotes: 0, lastQuoteAt: null };
      return {
        id: v.id,
        businessName: v.businessName,
        status: v.status,
        totalQuotes: p.totalQuotes,
        acceptedQuotes: p.acceptedQuotes,
        acceptanceRate: p.totalQuotes > 0 ? Math.round((p.acceptedQuotes / p.totalQuotes) * 100) : 0,
        lastQuoteAt: p.lastQuoteAt ? p.lastQuoteAt.toISOString() : null,
        lastLoginAt: v.lastLoginAt ? v.lastLoginAt.toISOString() : null,
        locations: v.vendor_approved_locations
          .map((al) => al.locations)
          .filter((l): l is { id: string; name: string } => !!l),
      };
    });

    data.sort((a, b) =>
      b.acceptanceRate !== a.acceptanceRate
        ? b.acceptanceRate - a.acceptanceRate
        : b.totalQuotes - a.totalQuotes
    );

    // The location dropdown is built from what the manager is assigned, not
    // from the rows on screen — otherwise filtering to one location would
    // wipe out the options needed to switch back.
    const locations = await prisma.locations.findMany({
      where: { id: { in: assignedLocationIds } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      data,
      locations,
      range: {
        from: from ? from.toISOString() : null,
        to: to ? to.toISOString() : null,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching vendor performance:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
