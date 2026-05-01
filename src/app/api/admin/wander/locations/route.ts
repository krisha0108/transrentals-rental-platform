// @ts-nocheck
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
    const search = searchParams.get('search')?.trim() || '';

    if (search.length < 2) return NextResponse.json([]);

    const select = {
      id: true, name: true, type: true,
      locations: { select: { name: true, type: true } },
    };
    const baseWhere = {
      isActive: true,
      type: { in: ['CITY', 'STATE', 'AREA', 'UNION_TERRITORY'] },
    };

    const [prefix, contains] = await Promise.all([
      prisma.locations.findMany({
        where: { ...baseWhere, name: { startsWith: search } },
        select, orderBy: [{ type: 'asc' }, { name: 'asc' }], take: 10,
      }),
      prisma.locations.findMany({
        where: { ...baseWhere, name: { contains: search } },
        select, orderBy: [{ type: 'asc' }, { name: 'asc' }], take: 10,
      }),
    ]);

    const seen = new Set(prefix.map((l) => l.id));
    const merged = [...prefix, ...contains.filter((l) => !seen.has(l.id))].slice(0, 12);

    const formatted = merged.map((loc) => {
      const parent = loc.locations;
      let displayName = loc.name;
      if (parent && parent.type !== 'COUNTRY') {
        displayName = `${loc.name}, ${parent.name}`;
      }
      return {
        id: loc.id,
        name: loc.name,
        displayName,
        type: loc.type,
        parentName: parent?.name || null,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[Admin Wander Locations]', error);
    return NextResponse.json({ error: 'Failed to search locations' }, { status: 500 });
  }
}
