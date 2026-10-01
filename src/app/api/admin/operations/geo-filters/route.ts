// GET — every state and city, for the Operations Tracker's State/Location
// filter dropdowns. No date filter — this is just the dropdown's option list.

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const currentUser = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const [states, cities] = await Promise.all([
      prisma.locations.findMany({ where: { type: 'STATE', isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      prisma.locations.findMany({
        where: { type: { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] }, isActive: true },
        select: { id: true, name: true, parentId: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({ success: true, states, cities });
  } catch (error: any) {
    logger.error('Operations tracker geo-filters fetch error', error);
    return NextResponse.json({ error: 'Failed to load location filters', details: error?.message }, { status: 500 });
  }
}
