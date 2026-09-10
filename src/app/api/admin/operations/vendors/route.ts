// GET ?staleDays= — vendors stuck in PENDING/DOCUMENTS_PENDING/UNDER_REVIEW
// with no recent activity, for the Operations Tracker's "Vendors Needing
// Action" tab.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { getVendorsNeedingAction } from '@/lib/admin-operations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const currentUser = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const staleDaysRaw = Number(searchParams.get('staleDays'));
    const staleDays = Number.isFinite(staleDaysRaw) && staleDaysRaw > 0 ? staleDaysRaw : 3;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || undefined;

    const result = await getVendorsNeedingAction(staleDays, { page, limit, search });
    return NextResponse.json({ success: true, staleDays, ...result });
  } catch (error: any) {
    logger.error('Operations tracker vendors fetch error', error);
    return NextResponse.json({ error: 'Failed to load vendors', details: error?.message }, { status: 500 });
  }
}
