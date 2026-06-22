import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user?.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const { status, resolution } = await request.json();

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const resolvedAt = status === 'RESOLVED' || status === 'CLOSED' ? new Date() : null;

    await prisma.$executeRaw`
      UPDATE contact_inquiries
      SET status     = ${status},
          resolution = ${resolution ?? null},
          resolvedAt = ${resolvedAt}
      WHERE id = ${params.id}
    `;

    return NextResponse.json({ success: true, status, resolution, resolvedAt });
  } catch (error) {
    console.error('[Manager Contact Inquiry PATCH]', error);
    return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 });
  }
}
