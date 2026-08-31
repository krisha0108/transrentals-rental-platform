import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET — has this vendor digitally signed the partnership agreement, and
// with what details? Used by the manager/admin vendor detail page.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const vendorId = params.id;

  const agreements = await (prisma as any).vendor_partnership_agreements.findMany({
    where: { vendorId },
    orderBy: { acceptedAt: 'desc' },
  });

  return NextResponse.json({
    signed: agreements.length > 0,
    latest: agreements[0] || null,
    history: agreements,
  });
}
