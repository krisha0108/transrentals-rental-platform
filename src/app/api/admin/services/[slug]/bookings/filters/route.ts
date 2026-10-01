import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/services/[slug]/bookings/filters
 *
 * Dropdown data for the bookings page: every state, every city (with the
 * state it belongs to, so the UI can narrow cities when a state is picked),
 * and every vendor approved to run this service — so the filters aren't
 * built from whatever happens to be in the visible page of bookings.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { slug } = resolvedParams;

    const service = await prisma.services.findUnique({ where: { slug }, select: { id: true } });
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const [states, cities, approvedServices] = await Promise.all([
      prisma.locations.findMany({
        where: { type: 'STATE', isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.locations.findMany({
        where: { type: { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] }, isActive: true },
        select: { id: true, name: true, parentId: true },
        orderBy: { name: 'asc' },
      }),
      prisma.vendor_approved_services.findMany({
        where: { serviceId: service.id, isActive: true },
        select: {
          vendors: { select: { id: true, businessName: true, city: true, state: true } },
        },
      }),
    ]);

    const vendors = approvedServices
      .map((a) => a.vendors)
      .filter((v): v is NonNullable<typeof v> => !!v)
      .sort((a, b) => a.businessName.localeCompare(b.businessName));

    return NextResponse.json({ states, cities, vendors });
  } catch (error) {
    logger.error('Service bookings filters error', error);
    return NextResponse.json({ error: 'Failed to fetch filters' }, { status: 500 });
  }
}
