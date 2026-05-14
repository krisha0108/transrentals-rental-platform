// Combined search across vendors and travel agents. Powers the "New chat"
// entry point in messages — pick a result to start (or resume) a conversation.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSocialAuth } from '@/lib/auth/social-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { actor, error } = await getSocialAuth(request);
    if (!actor) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

    const q = (request.nextUrl.searchParams.get('q') || '').trim();
    if (q.length < 2) return NextResponse.json({ results: [] });

    const [vendors, agents] = await Promise.all([
      prisma.vendors.findMany({
        where: {
          OR: [
            { businessName: { contains: q } },
            { ownerName: { contains: q } },
            { city: { contains: q } },
          ],
        },
        select: { id: true, businessName: true, ownerName: true, logo: true, city: true },
        take: 10,
        orderBy: { businessName: 'asc' },
      }),
      prisma.travel_agents.findMany({
        where: {
          OR: [
            { agencyName: { contains: q } },
            { ownerName: { contains: q } },
            { city: { contains: q } },
          ],
        },
        select: { id: true, agencyName: true, ownerName: true, logo: true, city: true },
        take: 10,
        orderBy: { agencyName: 'asc' },
      }),
    ]);

    const results = [
      ...vendors
        .filter((v: any) => !(actor.type === 'vendor' && v.id === actor.id))
        .map((v: any) => ({
          type: 'vendor' as const,
          id: v.id,
          businessName: v.businessName,
          ownerName: v.ownerName,
          logo: v.logo,
          city: v.city,
        })),
      ...agents
        .filter((a: any) => !(actor.type === 'agent' && a.id === actor.id))
        .map((a: any) => ({
          type: 'agent' as const,
          id: a.id,
          businessName: a.agencyName,
          ownerName: a.ownerName,
          logo: a.logo,
          city: a.city,
        })),
    ];

    return NextResponse.json({ results });
  } catch (e: any) {
    logger.error('GET /api/social/search', e);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
