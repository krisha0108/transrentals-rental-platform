import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Lightweight poll target for the manager sidebar badge — just the count of
// still-NEW (unhandled) contact inquiries, not the full list.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await prisma.contact_inquiries.count({ where: { status: 'NEW' } });
    return NextResponse.json({ count });
  } catch (error) {
    console.error('[Manager Contact Inquiry Count]', error);
    return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 });
  }
}
