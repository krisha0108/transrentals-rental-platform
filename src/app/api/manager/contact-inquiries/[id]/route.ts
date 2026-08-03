import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { sendContactInquiryReplyEmail } from '@/lib/services/email-service';

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

    // Fetch the row first — need the previous status/resolution (for the
    // manager accountability log and to avoid re-emailing on every unrelated
    // edit) and the submitter's name/email/subject to compose the reply email.
    const existingRows = await prisma.$queryRaw<any[]>`
      SELECT name, email, subject, status, resolution FROM contact_inquiries WHERE id = ${params.id} LIMIT 1
    `;
    const existing = existingRows[0];

    await prisma.$executeRaw`
      UPDATE contact_inquiries
      SET status     = ${status},
          resolution = ${resolution ?? null},
          resolvedAt = ${resolvedAt}
      WHERE id = ${params.id}
    `;

    // Record this in the manager accountability log — same table/pattern
    // used for regular inquiries and bookings — so it surfaces on the admin
    // Manager Performance pages. contact_inquiries has no location/service
    // scope, so `serviceType` is a fixed label rather than a real slug.
    prisma.manager_action_logs.create({
      data: {
        recordType: 'CONTACT_INQUIRY',
        serviceType: 'contact-inquiry',
        recordId: params.id,
        actionType: 'STATUS_CHANGED',
        previousStatus: existing?.status ?? null,
        newStatus: status,
        note: resolution?.trim() || null,
        managerId: session.user.id,
      },
    }).catch((err) => console.error('[Manager Contact Inquiry] action log failed', err));

    // Notify the submitter by email only when a resolution note is newly
    // written or changed — never block the response on this.
    if (existing && resolution && resolution.trim() && resolution !== existing.resolution) {
      sendContactInquiryReplyEmail({
        to: existing.email,
        name: existing.name,
        subject: existing.subject,
        resolution,
        referenceNumber: `INQ-${params.id.slice(-6).toUpperCase()}`,
      }).catch((err) => console.error('[Manager Contact Inquiry] reply email failed', err));
    }

    return NextResponse.json({ success: true, status, resolution, resolvedAt });
  } catch (error) {
    console.error('[Manager Contact Inquiry PATCH]', error);
    return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 });
  }
}
