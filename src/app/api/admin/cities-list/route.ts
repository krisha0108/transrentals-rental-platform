/**
 * Lightweight cities list for admin UI (bulk-generation page, etc.).
 * Returns slug/name/state/tier/priority from static city data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { INDIAN_CITIES } from '@/data/indian-cities';

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cities = INDIAN_CITIES.map((c) => ({
    slug: c.slug,
    name: c.name,
    state: c.state,
    stateCode: c.stateCode,
    tier: c.tier,
    priority: c.priority,
  })).sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (a.priority !== b.priority) return b.priority - a.priority;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({ cities });
}
