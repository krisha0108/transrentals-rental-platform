import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (filter === 'b2b') where.isB2B = true;
    if (filter === 'active') where.isActive = true;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [customers, total, totalAll, activeCount, b2bCount] = await Promise.all([
      prisma.customers.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          city: true,
          state: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          isB2B: true,
          isActive: true,
          totalSpent: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              bike_bookings: true,
              bus_bookings: true,
              car_bookings: true,
              chauffeur_bookings: true,
              equipment_bookings: true,
              luxury_bookings: true,
              packers_bookings: true,
              truck_bookings: true,
              wander_bookings: true,
              bike_quote_requests: true,
              bus_quote_requests: true,
              equipment_quote_requests: true,
              luxury_quote_requests: true,
              packers_quote_requests: true,
              self_drive_quote_requests: true,
              truck_quote_requests: true,
              wander_quote_requests: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customers.count({ where }),
      prisma.customers.count(),
      prisma.customers.count({ where: { isActive: true } }),
      prisma.customers.count({ where: { isB2B: true } }),
    ]);

    const transformed = customers.map(({ _count, ...c }) => {
      const bookingsCount =
        _count.bike_bookings +
        _count.bus_bookings +
        _count.car_bookings +
        _count.chauffeur_bookings +
        _count.equipment_bookings +
        _count.luxury_bookings +
        _count.packers_bookings +
        _count.truck_bookings +
        _count.wander_bookings;
      const quotesCount =
        _count.bike_quote_requests +
        _count.bus_quote_requests +
        _count.equipment_quote_requests +
        _count.luxury_quote_requests +
        _count.packers_quote_requests +
        _count.self_drive_quote_requests +
        _count.truck_quote_requests +
        _count.wander_quote_requests;
      return { ...c, bookingsCount, quotesCount };
    });

    return NextResponse.json({
      customers: transformed,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: { total: totalAll, active: activeCount, b2b: b2bCount },
    });
  } catch (error) {
    console.error('Admin customers list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
