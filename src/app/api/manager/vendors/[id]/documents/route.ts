import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
import { validateVendorDocument } from '@/lib/security/file-validation';
import { scanFile, isClamAVAvailable } from '@/lib/security/antivirus';
import {
  saveVendorDocument,
  generateSecureFilename,
  initializeStorage,
} from '@/lib/storage/private-storage';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

export const dynamic = 'force-dynamic';

// Initialize private storage on first request
let storageInitialized = false;

// POST - Upload a document on behalf of a vendor (Manager only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify manager role and get location access
    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: {
        manager_locations: true,
      },
    });

    if (!manager || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(manager.role)) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const { id: vendorId } = await params;

    // Verify manager has location access to this vendor (same check as GET in manager/vendors/[id])
    if (manager.role === 'MANAGER') {
      const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);

      const vendor = await prisma.vendors.findUnique({
        where: { id: vendorId },
        include: {
          vendor_approved_locations: true,
          vendor_location_requests: true,
        },
      });

      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
      }

      const hasAccess = vendor.vendor_approved_locations.some((al) =>
        assignedLocationIds.includes(al.locationId)
      ) || vendor.vendor_location_requests.some((lr) =>
        assignedLocationIds.includes(lr.locationId)
      );

      if (!hasAccess && assignedLocationIds.length > 0) {
        return NextResponse.json(
          { error: 'Access denied. This vendor is not in your assigned locations.' },
          { status: 403 }
        );
      }
    } else {
      // For SUPER_ADMIN/ADMIN, just verify vendor exists
      const vendor = await prisma.vendors.findUnique({
        where: { id: vendorId },
      });
      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
      }
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

    // Validate document type
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
      logger.warn('Manager document upload validation failed', {
        managerId: session.user.id,
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
        logger.logSecurityEvent('Malware detected in manager document upload', 'critical', {
          managerId: session.user.id,
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
      if (scanResult.scanned) {
        logger.info('File passed antivirus scan', {
          vendorId,
          fileName: file.name,
        });
      }
    } else {
      logger.debug('ClamAV not available, skipping antivirus scan');
    }

    // NOTE: No duplicate check — managers may intentionally re-upload after rejection

    // Initialize private storage if needed
    if (!storageInitialized) {
      await initializeStorage();
      storageInitialized = true;
    }

    // Generate secure filename for private storage
    const secureFilename = `${documentType}_${generateSecureFilename(file.name)}`;

    // SECURITY: Save to private storage (outside /public)
    await saveVendorDocument(vendorId, file, secureFilename);

    // URL path for accessing the file (through authenticated API)
    const documentUrl = `/api/private-files/vendor-documents/${vendorId}/${secureFilename}`;

    // Create document record
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

    logger.info('Manager uploaded document for vendor', {
      managerId: session.user.id,
      vendorId,
      documentType,
      documentId: document.id,
    });

    prisma.manager_action_logs.create({
      data: {
        recordType: 'VENDOR',
        serviceType: 'vendor',
        recordId: vendorId,
        actionType: 'NOTE_ADDED',
        note: `Document uploaded on vendor's behalf: ${documentType}`,
        managerId: session.user.id,
      },
    }).catch((err) => logger.error('Manager vendor document upload action log failed', err));

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
      const { count } = await prisma.vendors.updateMany({
        where: { id: vendorId, status: { in: ['PENDING', 'DOCUMENTS_PENDING'] } },
        data: { status: 'UNDER_REVIEW' },
      });
      if (count > 0) prisma.manager_action_logs.create({
        data: {
          recordType: 'VENDOR',
          serviceType: 'vendor',
          recordId: vendorId,
          actionType: 'STATUS_CHANGED',
          newStatus: 'UNDER_REVIEW',
          note: 'Auto-moved to review after required documents uploaded',
          managerId: session.user.id,
        },
      }).catch((err) => logger.error('Manager vendor status-bump action log failed', err));
    }

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    logger.error('Manager upload document error', error);
    return NextResponse.json(
      { error: 'Failed to upload document', details: error?.message },
      { status: 500 }
    );
  }
}
