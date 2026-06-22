import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
import { validateVendorDocument } from '@/lib/security/file-validation';
import { scanFile, isClamAVAvailable } from '@/lib/security/antivirus';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
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

// GET - Get vendor's documents
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;


    const documents = await prisma.vendor_documents.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        vendorId: true,
        documentType: true,
        documentName: true,
        documentUrl: true,
        documentNumber: true,
        status: true,
        verifiedAt: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(documents);
  } catch (error: any) {
    logger.error('Get documents error', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Upload a document
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

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
      logger.warn('Document upload validation failed', {
        vendorId: vendorId,
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
        logger.logSecurityEvent('Malware detected in vendor document upload', 'critical', {
          vendorId: vendorId,
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
          vendorId: vendorId,
          fileName: file.name,
        });
      }
    } else {
      logger.debug('ClamAV not available, skipping antivirus scan');
    }

    // Check if document of this type already exists (allow re-upload if REJECTED or RESUBMIT_REQUIRED)
    const existingDoc = await prisma.vendor_documents.findFirst({
      where: {
        vendorId: vendorId,
        documentType: documentType as any,
        status: { notIn: ['REJECTED', 'RESUBMIT_REQUIRED'] },
      },
    });

    if (existingDoc) {
      return NextResponse.json(
        { error: 'Document of this type already uploaded. Delete the existing one first.' },
        { status: 400 }
      );
    }

    // If there's a RESUBMIT_REQUIRED doc of this type, delete it so the new one replaces it
    const resubmitDoc = await prisma.vendor_documents.findFirst({
      where: { vendorId, documentType: documentType as any, status: 'RESUBMIT_REQUIRED' },
    });
    if (resubmitDoc) {
      const { deleteVendorDocument } = await import('@/lib/storage/private-storage');
      const urlParts = resubmitDoc.documentUrl.split('/');
      const oldFilename = urlParts[urlParts.length - 1];
      await deleteVendorDocument(vendorId, oldFilename).catch(() => {});
      await prisma.vendor_documents.delete({ where: { id: resubmitDoc.id } });
    }

    // Initialize private storage if needed
    if (!storageInitialized) {
      await initializeStorage();
      storageInitialized = true;
    }

    // Generate secure filename for private storage
    const secureFilename = `${documentType}_${generateSecureFilename(file.name)}`;

    // SECURITY: Save to private storage (outside /public)
    const savedFile = await saveVendorDocument(vendorId, file, secureFilename);

    // URL path for accessing the file (through authenticated API)
    const documentUrl = `/api/private-files/vendor-documents/${vendorId}/${secureFilename}`;

    // Create document record
    const document = await prisma.vendor_documents.create({
      data: {
        id: generateId(),
        vendorId: vendorId,
        documentType: documentType as any,
        documentName: file.name,
        documentUrl,
        documentNumber: documentNumber || null,
        status: 'PENDING',
      },
    });

    // Update vendor status once required documents are uploaded.
    // Only ADDRESS_PROOF is mandatory now — GST & PAN are optional.
    const requiredTypes = ['ADDRESS_PROOF'];
    const uploadedDocs = await prisma.vendor_documents.findMany({
      where: {
        vendorId: vendorId,
        documentType: { in: requiredTypes as any },
        status: { not: 'REJECTED' },
      },
    });

    if (uploadedDocs.length >= requiredTypes.length) {
      await prisma.vendors.update({
        where: { id: vendorId },
        data: { status: 'UNDER_REVIEW' },
      });
    }

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    logger.error('Upload document error', error);
    return NextResponse.json(
      { error: 'Failed to upload document', details: error?.message },
      { status: 500 }
    );
  }
}
