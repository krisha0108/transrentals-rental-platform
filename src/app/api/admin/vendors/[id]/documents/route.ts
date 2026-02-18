import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
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
        sendVendorDirectNotification({
          vendorId,
          title: '✅ Documents Approved',
          body: `Your ${documentIds.length > 1 ? documentIds.length + ' documents have' : 'document has'} been approved. Please wait for your account to be fully reviewed.`,
          type: 'document_approved',
          serviceType: 'general',
        }).catch((err: any) => console.error('[DocApprove] Vendor notify failed:', err));
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
        sendVendorDirectNotification({
          vendorId,
          title: '❌ Documents Rejected',
          body: `Your ${documentIds.length > 1 ? documentIds.length + ' documents have' : 'document has'} been rejected. Reason: ${rejectionReason}. Please re-upload corrected documents.`,
          type: 'document_rejected',
          serviceType: 'general',
        }).catch((err: any) => console.error('[DocReject] Vendor notify failed:', err));
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

      sendVendorDirectNotification({
        vendorId,
        title: '✅ Document Approved',
        body: `Your ${document.documentType?.replace(/_/g, ' ').toLowerCase() || 'document'} has been approved. Please wait for your account to be fully reviewed.`,
        type: 'document_approved',
        serviceType: 'general',
      }).catch((err: any) => console.error('[DocApprove] Vendor notify failed:', err));

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

      sendVendorDirectNotification({
        vendorId,
        title: '❌ Document Rejected',
        body: `Your ${document.documentType?.replace(/_/g, ' ').toLowerCase() || 'document'} was rejected. Reason: ${rejectionReason}. Please re-upload a corrected document.`,
        type: 'document_rejected',
        serviceType: 'general',
      }).catch((err: any) => console.error('[DocReject] Vendor notify failed:', err));
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
