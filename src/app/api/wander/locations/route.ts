// @ts-nocheck
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET - Distinct locations from active wander listings
export async function GET() {
  try {
    const listings = await (prisma as any).wander_listings.findMany({
      where: { status: 'ACTIVE' },
      select: {
        mainLocation: { select: { id: true, name: true } },
      },
    });

    // Deduplicate by id
    const seen = new Set<string>();
    const locations: { id: string; name: string }[] = [];
    for (const l of listings) {
      if (l.mainLocation && !seen.has(l.mainLocation.id)) {
        seen.add(l.mainLocation.id);
        locations.push(l.mainLocation);
      }
    }
    locations.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(locations);
  } catch (error) {
    console.error('[Public Wander Locations]', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
