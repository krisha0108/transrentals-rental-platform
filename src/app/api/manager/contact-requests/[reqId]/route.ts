import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// POST — approve or reject a vendor contact change request (manager only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reqId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const manager = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const { reqId } = await params;
    const body = await request.json();
    const { action } = body; // 'APPROVE' | 'REJECT'

    const changeReq = await prisma.vendor_contact_change_requests.findUnique({
      where: { id: reqId },
    });

    if (!changeReq) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (changeReq.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request is no longer pending' }, { status: 409 });
    }

    if (action === 'APPROVE') {
      // Check uniqueness before applying
      if (changeReq.newEmail) {
        const clash = await prisma.vendors.findFirst({
          where: { email: changeReq.newEmail, NOT: { id: changeReq.vendorId } },
        });
        if (clash) return NextResponse.json({ error: 'Email already in use by another vendor' }, { status: 409 });
      }
      if (changeReq.newPhone) {
        const clash = await prisma.vendors.findFirst({
          where: { phone: changeReq.newPhone, NOT: { id: changeReq.vendorId } },
        });
        if (clash) return NextResponse.json({ error: 'Phone already in use by another vendor' }, { status: 409 });
      }

      const updateData: any = {};
      if (changeReq.newEmail) updateData.email = changeReq.newEmail;
      if (changeReq.newPhone) updateData.phone = changeReq.newPhone;

      await prisma.$transaction([
        prisma.vendors.update({ where: { id: changeReq.vendorId }, data: updateData }),
        prisma.vendor_contact_change_requests.update({
          where: { id: reqId },
          data: { status: 'APPROVED', reviewedAt: new Date(), reviewedById: session.user.id },
        }),
      ]);

      logger.info('Vendor contact change approved by manager', { reqId, vendorId: changeReq.vendorId });
      prisma.manager_action_logs.create({
        data: {
          recordType: 'VENDOR',
          serviceType: 'vendor',
          recordId: changeReq.vendorId,
          actionType: 'STATUS_CHANGED',
          newStatus: 'CONTACT_CHANGE_APPROVED',
          note: `Contact change approved${changeReq.newEmail ? ` — email → ${changeReq.newEmail}` : ''}${changeReq.newPhone ? ` — phone → ${changeReq.newPhone}` : ''}`,
          managerId: session.user.id,
        },
      }).catch((err) => logger.error('Manager contact-change approve action log failed', err));
      return NextResponse.json({ success: true, action: 'APPROVED' });
    }

    if (action === 'REJECT') {
      await prisma.vendor_contact_change_requests.update({
        where: { id: reqId },
        data: { status: 'REJECTED', reviewedAt: new Date(), reviewedById: session.user.id },
      });

      logger.info('Vendor contact change rejected by manager', { reqId, vendorId: changeReq.vendorId });
      prisma.manager_action_logs.create({
        data: {
          recordType: 'VENDOR',
          serviceType: 'vendor',
          recordId: changeReq.vendorId,
          actionType: 'STATUS_CHANGED',
          newStatus: 'CONTACT_CHANGE_REJECTED',
          note: `Contact change rejected${changeReq.newEmail ? ` — requested email ${changeReq.newEmail}` : ''}${changeReq.newPhone ? ` — requested phone ${changeReq.newPhone}` : ''}`,
          managerId: session.user.id,
        },
      }).catch((err) => logger.error('Manager contact-change reject action log failed', err));
      return NextResponse.json({ success: true, action: 'REJECTED' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('Manager change request review error', error);
    return NextResponse.json({ error: 'Server error', details: error?.message }, { status: 500 });
  }
}
