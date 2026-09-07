// Lets the call-report form warn a manager before they log a "new" lead
// that is actually already an onboarded vendor or travel agent.
//
//   GET ?phone=<10-digit>&email=<email>
//        → { vendorMatch: {...} | null, travelAgentMatch: {...} | null }

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

async function requireManager() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const role = (session.user as any).role;
  if (!['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) return null;
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const manager = await requireManager();
    if (!manager) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const phone = (searchParams.get('phone') || '').trim();
    const email = (searchParams.get('email') || '').trim().toLowerCase();

    if (!phone && !email) {
      return NextResponse.json({ vendorMatch: null, travelAgentMatch: null });
    }

    const or = [
      ...(phone ? [{ phone }] : []),
      ...(email ? [{ email }] : []),
    ];

    const [vendorMatch, travelAgentMatch] = await Promise.all([
      prisma.vendors.findFirst({
        where: { OR: or },
        select: { id: true, businessName: true, vid: true, phone: true, email: true, status: true },
      }),
      prisma.travel_agents.findFirst({
        where: { OR: or },
        select: { id: true, agencyName: true, tid: true, phone: true, email: true, status: true },
      }),
    ]);

    return NextResponse.json({ vendorMatch, travelAgentMatch });
  } catch (error) {
    logger.error('Failed to check duplicate vendor/travel-agent', error);
    return NextResponse.json({ error: 'Failed to check for duplicates' }, { status: 500 });
  }
}
