import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET — all pending contact change requests (admin only)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requests = await prisma.vendor_contact_change_requests.findMany({
    where: { status: 'PENDING' },
    orderBy: { requestedAt: 'asc' },
    select: {
      id: true,
      newEmail: true,
      newPhone: true,
      requestedAt: true,
      vendors: {
        select: { id: true, businessName: true, ownerName: true, email: true, phone: true },
      },
    },
  });

  return NextResponse.json({
    requests: requests.map(r => ({
      id: r.id,
      newEmail: r.newEmail,
      newPhone: r.newPhone,
      requestedAt: r.requestedAt,
      vendor: r.vendors,
    })),
  });
}
