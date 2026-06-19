import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ count: 0 }, { status: 401 });

  const count = await prisma.vendor_contact_change_requests.count({
    where: { status: 'PENDING' },
  });

  return NextResponse.json({ count });
}
