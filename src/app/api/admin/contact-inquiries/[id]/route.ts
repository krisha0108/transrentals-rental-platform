import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, name, phone, email, subject, message, status, resolution, resolvedAt, createdAt
      FROM contact_inquiries WHERE id = ${params.id} LIMIT 1
    `;
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ inquiry: rows[0] });
  } catch (error) {
    console.error('[Contact Inquiry GET]', error);
    return NextResponse.json({ error: 'Failed to fetch inquiry' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status, resolution } = await request.json();
    const resolvedAt = status === 'RESOLVED' || status === 'CLOSED' ? new Date() : null;

    await prisma.$executeRaw`
      UPDATE contact_inquiries
      SET status = ${status},
          resolution = ${resolution ?? null},
          resolvedAt = ${resolvedAt}
      WHERE id = ${params.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Contact Inquiry PUT]', error);
    return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 });
  }
}
