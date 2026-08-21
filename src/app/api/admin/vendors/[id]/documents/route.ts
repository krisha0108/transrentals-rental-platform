import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
import { validateVendorDocument } from '@/lib/security/file-validation';
import { scanFile, isClamAVAvailable } from '@/lib/security/antivirus';
import {
  saveVendorDocument,
  generateSecureFilename,
  initializeStorage,
} from '@/lib/storage/private-storage';
export const dynamic = 'force-dynamic';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// Initialize private storage on first request
let storageInitialized = false;

// POST - Upload a document on behalf of a vendor (Admin)
export async function POST(
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

    const vendor = await prisma.vendors.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const documentNumber = formData.get('documentNumber') as string;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'File and document type are required' },
        { status: 400 }
      );
    }

    const validTypes = [
      'GST_CERTIFICATE',
      'PAN_CARD',
      'BUSINESS_REGISTRATION',
      'ADDRESS_PROOF',
      'BANK_DETAILS',
      'CANCELLED_CHEQUE',
      'OWNER_AADHAAR',
      'OWNER_PAN',
      'OTHER',
    ];
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }

    // SECURITY: Validate file type, size, and content using magic numbers
    const validationResult = await validateVendorDocument(file);
    if (!validationResult.valid) {
      logger.warn('Admin document upload validation failed', {
        adminId: session.user.id,
        vendorId,
        documentType,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        error: validationResult.error,
      });
      return NextResponse.json(
        { error: validationResult.error || 'Invalid file' },
        { status: 400 }
      );
    }

    // SECURITY: Scan file for malware using ClamAV
    const clamAvailable = await isClamAVAvailable();
    if (clamAvailable) {
      const scanResult = await scanFile(file);
      if (scanResult.infected) {
        logger.logSecurityEvent('Malware detected in admin document upload', 'critical', {
          adminId: session.user.id,
          vendorId,
          documentType,
          fileName: file.name,
          viruses: scanResult.viruses,
        });
        return NextResponse.json(
          { error: 'File rejected: security threat detected' },
          { status: 400 }
        );
      }
    }

    // Initialize private storage if needed
    if (!storageInitialized) {
      await initializeStorage();
      storageInitialized = true;
    }

    // Generate secure filename for private storage
    const secureFilename = `${documentType}_${generateSecureFilename(file.name)}`;

    // SECURITY: Save to private storage (outside /public)
    await saveVendorDocument(vendorId, file, secureFilename);

    const documentUrl = `/api/private-files/vendor-documents/${vendorId}/${secureFilename}`;

    const document = await prisma.vendor_documents.create({
      data: {
        id: generateId(),
        vendorId,
        documentType: documentType as any,
        documentName: file.name,
        documentUrl,
        documentNumber: documentNumber || null,
        status: 'PENDING',
        uploadedById: session.user.id,
      },
    });

    logger.info('Admin uploaded document for vendor', {
      adminId: session.user.id,
      vendorId,
      documentType,
      documentId: document.id,
    });

    // Update vendor status if all required documents are uploaded
    const requiredTypes = ['ADDRESS_PROOF'];
    const uploadedDocs = await prisma.vendor_documents.findMany({
      where: {
        vendorId,
        documentType: { in: requiredTypes as any },
        status: { not: 'REJECTED' },
      },
    });

    if (uploadedDocs.length >= requiredTypes.length) {
      // Only move a vendor into review from a pre-approval state — never
      // knock an already-APPROVED/REJECTED/SUSPENDED/BLOCKED vendor back
      // to UNDER_REVIEW just because a document was re-uploaded.
      await prisma.vendors.updateMany({
        where: { id: vendorId, status: { in: ['PENDING', 'DOCUMENTS_PENDING'] } },
        data: { status: 'UNDER_REVIEW' },
      });
    }

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    logger.error('Admin upload document error', error);
    return NextResponse.json(
      { error: 'Failed to upload document', details: error?.message },
      { status: 500 }
    );
  }
}

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
      const requiredTypes = ['ADDRESS_PROOF'];
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
    } else if (action === 'RESUBMIT_REQUIRED') {
      await prisma.vendor_documents.update({
        where: { id: documentId },
        data: {
          status: 'RESUBMIT_REQUIRED',
          rejectionReason: rejectionReason || 'Manager requested resubmission of this document.',
          verifiedAt: null,
          verifiedById: null,
        },
      });

      sendVendorDirectNotification({
        vendorId,
        title: '🔄 Document Resubmission Required',
        body: `Please re-upload your ${document.documentType?.replace(/_/g, ' ').toLowerCase() || 'document'}. ${rejectionReason ? 'Reason: ' + rejectionReason : ''}`,
        type: 'document_resubmit',
        serviceType: 'general',
      }).catch((err: any) => console.error('[DocResubmit] Vendor notify failed:', err));
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
