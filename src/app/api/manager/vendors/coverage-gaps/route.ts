import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Coverage-gap inquiries (zero eligible vendors), scoped to this
// manager's assigned locations only. Matched on locationName, not
// locationId — 5 of the 7 quote-request services can leave locationId
// null, but locationName is always populated on vendor_coverage_gaps.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: {
        manager_locations: { include: { locations: true } },
      },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const assignedLocationNames = manager.manager_locations.map((ml) => ml.locations.name);
    if (assignedLocationNames.length === 0) {
      return NextResponse.json({
        success: true,
        gaps: [],
        byLocation: [],
        total: 0,
        todayCount: 0,
        weekCount: 0,
        locationsAffected: 0,
      });
    }

    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service')?.trim() || '';
    const search = searchParams.get('search')?.trim() || '';

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const where = {
      locationName: { in: assignedLocationNames },
      ...(service ? { serviceType: service } : {}),
      ...(search
        ? {
            OR: [
              { locationName: { contains: search } },
              { customerName: { contains: search } },
              { requestNumber: { contains: search } },
            ],
          }
        : {}),
    };

    const [gaps, total, todayCount, weekCount, byLocation] = await Promise.all([
      prisma.vendor_coverage_gaps.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.vendor_coverage_gaps.count({ where }),
      prisma.vendor_coverage_gaps.count({ where: { ...where, createdAt: { gte: todayStart } } }),
      prisma.vendor_coverage_gaps.count({ where: { ...where, createdAt: { gte: weekStart } } }),
      prisma.vendor_coverage_gaps.groupBy({
        by: ['locationName'],
        where,
        _count: { id: true },
        _max: { createdAt: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    const byLocationService = await prisma.vendor_coverage_gaps.groupBy({
      by: ['locationName', 'serviceType'],
      where: { locationName: { in: byLocation.map((l) => l.locationName) } },
      _count: { id: true },
    });
    const serviceBreakdown: Record<string, { serviceType: string; count: number }[]> = {};
    for (const row of byLocationService) {
      if (!serviceBreakdown[row.locationName]) serviceBreakdown[row.locationName] = [];
      serviceBreakdown[row.locationName].push({ serviceType: row.serviceType, count: row._count.id });
    }

    return NextResponse.json({
      success: true,
      gaps,
      byLocation: byLocation.map((l) => ({
        locationName: l.locationName,
        count: l._count.id,
        lastInquiry: l._max.createdAt,
        byService: (serviceBreakdown[l.locationName] || []).sort((a, b) => b.count - a.count),
      })),
      total,
      todayCount,
      weekCount,
      locationsAffected: byLocation.length,
    });
  } catch (error: any) {
    logger.error('Manager coverage-gaps error', error);
    return NextResponse.json(
      { error: 'Failed to fetch coverage gaps', details: error?.message },
      { status: 500 }
    );
  }
}
