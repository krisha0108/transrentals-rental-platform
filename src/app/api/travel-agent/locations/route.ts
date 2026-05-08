// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';

export const dynamic = 'force-dynamic';

// GET - Search locations for travel-agent tours (cities, states, areas, UTs, villages)
// Mirrors /api/vendor/wander/locations but with travel-agent auth.
export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';

    if (search.length < 2) return NextResponse.json([]);

    const select = {
      id: true,
      name: true,
      type: true,
      slug: true,
      locations: { select: { name: true, type: true } },
    };
    const baseWhere = {
      isActive: true,
      type: { in: ['CITY', 'STATE', 'AREA', 'UNION_TERRITORY', 'VILLAGE'] },
    };

    // Run prefix (fast, index-friendly) and contains (broader) in parallel
    const [prefix, contains] = await Promise.all([
      (prisma as any).locations.findMany({
        where: { ...baseWhere, name: { startsWith: search } },
        select,
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
        take: 10,
      }),
      (prisma as any).locations.findMany({
        where: { ...baseWhere, name: { contains: search } },
        select,
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
        take: 10,
      }),
    ]);

    // Merge: prefix first, then any contains-only results
    const seen = new Set(prefix.map((l: any) => l.id));
    const merged = [...prefix, ...contains.filter((l: any) => !seen.has(l.id))].slice(0, 12);

    const formatted = merged.map((loc: any) => {
      const parent = loc.locations;
      let displayName = loc.name;
      if (parent && parent.type !== 'COUNTRY') {
        displayName = `${loc.name}, ${parent.name}`;
      } else if (parent && parent.type === 'COUNTRY') {
        displayName = loc.name;
      }
      return {
        id: loc.id,
        name: loc.name,
        displayName,
        slug: loc.slug || null,
        type: loc.type,
        parentName: parent?.name || null,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[Travel Agent Locations]', error);
    return NextResponse.json({ error: 'Failed to search locations' }, { status: 500 });
  }
}
