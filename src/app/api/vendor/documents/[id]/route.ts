// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';


import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { unlink } from 'fs/promises';
import path from 'path';

import logger from '@/lib/security/logger';
import { deleteVendorDocument } from '@/lib/storage/private-storage';

export const dynamic = 'force-dynamic';

// DELETE - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Find the document
    const document = await prisma.vendor_documents.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check ownership
    if (document.vendorId !== auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Don't allow deletion of approved documents
    if (document.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Cannot delete approved documents' },
        { status: 400 }
      );
    }

    // Delete file from storage
    if (document.documentUrl) {
      // Check if it's a private storage URL or legacy public URL
      if (document.documentUrl.startsWith('/api/private-files/vendor-documents/')) {
        // Extract filename from private storage URL
        const urlParts = document.documentUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        await deleteVendorDocument(auth.vendorId, filename);
      } else {
        // Legacy: Delete from public folder
        try {
          const filePath = path.join(process.cwd(), 'public', document.documentUrl);
          await unlink(filePath);
        } catch (fileError) {
          // File might not exist, continue with database deletion
          logger.debug('Legacy file not found or already deleted', { error: fileError });
        }
      }
    }

    // Delete document record
    await prisma.vendor_documents.delete({
      where: { id },
    });

    // If deleting this document dropped the vendor below the minimum
    // requirement that auto-bumped them to UNDER_REVIEW (see the same
    // check in POST /api/vendor/documents), move them back down so they
    // don't stay stuck showing "Under Review" with nothing left to review.
    // Only touches UNDER_REVIEW — never overrides a staff decision like
    // APPROVED/REJECTED/SUSPENDED/BLOCKED.
    const vendor = await prisma.vendors.findUnique({
      where: { id: auth.vendorId },
      select: { status: true },
    });

    if (vendor?.status === 'UNDER_REVIEW') {
      const requiredTypes = ['ADDRESS_PROOF'];
      const remainingRequiredDocs = await prisma.vendor_documents.count({
        where: {
          vendorId: auth.vendorId,
          documentType: { in: requiredTypes as any },
          status: { not: 'REJECTED' },
        },
      });

      if (remainingRequiredDocs < requiredTypes.length) {
        await prisma.vendors.update({
          where: { id: auth.vendorId },
          data: { status: 'DOCUMENTS_PENDING' },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Delete document error', error);
    return NextResponse.json(
      { error: 'Failed to delete document', details: error?.message },
      { status: 500 }
    );
  }
}
