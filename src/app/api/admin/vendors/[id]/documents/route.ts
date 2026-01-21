import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// PUT - Approve/Reject document (single or bulk)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id: vendorId } = await params;
    const body = await request.json();
    const { documentId, documentIds, action, rejectionReason, bulk } = body;

    // Handle bulk operations
    if (bulk && documentIds && Array.isArray(documentIds)) {
      if (action === 'APPROVE_ALL') {
        await prisma.vendor_documents.updateMany({
          where: {
            id: { in: documentIds },
            vendorId,
            status: 'PENDING',
          },
          data: {
            status: 'APPROVED',
            verifiedAt: new Date(),
            verifiedById: session.user.id,
            rejectionReason: null,
          },
        });
        return NextResponse.json({ success: true, message: `Approved ${documentIds.length} documents` });
      } else if (action === 'REJECT_ALL') {
        if (!rejectionReason) {
          return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
        }
        await prisma.vendor_documents.updateMany({
          where: {
            id: { in: documentIds },
            vendorId,
            status: 'PENDING',
          },
          data: {
            status: 'REJECTED',
            verifiedAt: new Date(),
            verifiedById: session.user.id,
            rejectionReason,
          },
        });
        return NextResponse.json({ success: true, message: `Rejected ${documentIds.length} documents` });
      }
    }

    if (!documentId || !action) {
      return NextResponse.json({ error: 'Document ID and action are required' }, { status: 400 });
    }

    // Find the document
    const document = await prisma.vendor_documents.findFirst({
      where: { id: documentId, vendorId },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      // Update document status
      await prisma.vendor_documents.update({
        where: { id: documentId },
        data: {
          status: 'APPROVED',
          verifiedAt: new Date(),
          verifiedById: session.user.id,
          rejectionReason: null,
        },
      });

      // Check if all required documents are approved to update vendor status
      const requiredTypes = ['GST_CERTIFICATE', 'PAN_CARD', 'ADDRESS_PROOF'];
      const approvedDocs = await prisma.vendor_documents.findMany({
        where: {
          vendorId,
          documentType: { in: requiredTypes as any },
          status: 'APPROVED',
        },
      });

      // If all required documents are approved, update vendor status
      if (approvedDocs.length >= requiredTypes.length) {
        const vendor = await prisma.vendors.findUnique({
          where: { id: vendorId },
        });

        // Only update if vendor is still under review
        if (vendor && vendor.status === 'UNDER_REVIEW') {
          // Keep as under review until admin manually approves the vendor
          // Or you can auto-approve here if needed
        }
      }
    } else if (action === 'REJECT') {
      if (!rejectionReason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      await prisma.vendor_documents.update({
        where: { id: documentId },
        data: {
          status: 'REJECTED',
          verifiedAt: new Date(),
          verifiedById: session.user.id,
          rejectionReason,
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Update document error', error);
    return NextResponse.json(
      { error: 'Failed to update document', details: error?.message },
      { status: 500 }
    );
  }
}
