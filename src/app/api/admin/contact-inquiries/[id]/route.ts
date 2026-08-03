import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { sendContactInquiryReplyEmail } from '@/lib/services/email-service';

export const dynamic = 'force-dynamic';

async function requireAdminOrManager() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role)) {
    return null;
  }
  return session;
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminOrManager();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
    const session = await requireAdminOrManager();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { status, resolution } = await request.json();
    const resolvedAt = status === 'RESOLVED' || status === 'CLOSED' ? new Date() : null;

    const existingRows = await prisma.$queryRaw<any[]>`
      SELECT name, email, subject, resolution FROM contact_inquiries WHERE id = ${params.id} LIMIT 1
    `;
    const existing = existingRows[0];

    await prisma.$executeRaw`
      UPDATE contact_inquiries
      SET status = ${status},
          resolution = ${resolution ?? null},
          resolvedAt = ${resolvedAt}
      WHERE id = ${params.id}
    `;

    if (existing && resolution && resolution.trim() && resolution !== existing.resolution) {
      sendContactInquiryReplyEmail({
        to: existing.email,
        name: existing.name,
        subject: existing.subject,
        resolution,
        referenceNumber: `INQ-${params.id.slice(-6).toUpperCase()}`,
      }).catch((err) => console.error('[Admin Contact Inquiry] reply email failed', err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Contact Inquiry PUT]', error);
    return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 });
  }
}
