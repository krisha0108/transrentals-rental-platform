// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

export const dynamic = 'force-dynamic';

// GET - Search locations for wander listing (cities & states only)
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) return NextResponse.json({ error: auth.error }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';

    if (search.length < 2) return NextResponse.json([]);

    const locations = await prisma.locations.findMany({
      where: {
        isActive: true,
        type: { in: ['CITY', 'STATE', 'AREA', 'UNION_TERRITORY'] },
        name: { contains: search },
      },
      select: {
        id: true,
        name: true,
        type: true,
        locations: {          // parent (state/country)
          select: { name: true, type: true },
        },
      },
      orderBy: [
        { type: 'asc' },     // AREA → CITY → STATE
        { name: 'asc' },
      ],
      take: 12,
    });

    // Format for display: "Goa, India" or "Shimla, Himachal Pradesh"
    const formatted = locations.map((loc) => {
      const parent = loc.locations;
      let displayName = loc.name;
      if (parent && parent.type !== 'COUNTRY') {
        displayName = `${loc.name}, ${parent.name}`;
      } else if (parent && parent.type === 'COUNTRY') {
        displayName = loc.name; // don't show "India" for state-level
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
    console.error('[Vendor Wander Locations]', error);
    return NextResponse.json({ error: 'Failed to search locations' }, { status: 500 });
  }
}
