import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import crypto from 'crypto';
import logger from '@/lib/security/logger';
import { validateVendorDocument } from '@/lib/security/file-validation';
import { scanFile, isClamAVAvailable } from '@/lib/security/antivirus';
import {
  saveTravelAgentDocument,
  deleteTravelAgentDocument,
  generateSecureFilename,
  initializeStorage,
} from '@/lib/storage/private-storage';

export const dynamic = 'force-dynamic';

const VALID_DOCUMENT_TYPES = [
  'GST_CERTIFICATE',
  'PAN_CARD',
  'AGENCY_REGISTRATION',
  'IATA_CERTIFICATE',
  'TRAVEL_AGENT_LICENSE',
  'ADDRESS_PROOF',
  'BANK_DETAILS',
  'CANCELLED_CHEQUE',
  'OWNER_AADHAAR',
  'OWNER_PAN',
  'OTHER',
] as const;

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

let storageInitialized = false;

export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const docs = await prisma.travel_agent_documents.findMany({
      where: { travelAgentId: auth.travelAgentId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ documents: docs });
  } catch (error: any) {
    logger.error('List travel agent documents error', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: error?.message },
      { status: 500 },
    );
  }
}

// POST - Upload a document file (FormData with `file`, `documentType`, `documentNumber?`)
export async function POST(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const travelAgentId = auth.travelAgentId;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('documentType') as string | null;
    const documentNumber = formData.get('documentNumber') as string | null;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'File and document type are required' },
        { status: 400 },
      );
    }

    if (!VALID_DOCUMENT_TYPES.includes(documentType as any)) {
      return NextResponse.json({ error: 'Invalid documentType' }, { status: 400 });
    }

    // Reuse vendor validator (same allowed types: JPG/PNG/WebP/PDF, size limit, magic-number check)
    const validationResult = await validateVendorDocument(file);
    if (!validationResult.valid) {
      logger.warn('Travel agent document upload validation failed', {
        travelAgentId,
        documentType,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        error: validationResult.error,
      });
      return NextResponse.json(
        { error: validationResult.error || 'Invalid file' },
        { status: 400 },
      );
    }

    // Optional ClamAV scan
    const clamAvailable = await isClamAVAvailable();
    if (clamAvailable) {
      const scanResult = await scanFile(file);
      if (scanResult.infected) {
        logger.logSecurityEvent('Malware detected in travel-agent document upload', 'critical', {
          travelAgentId,
          documentType,
          fileName: file.name,
          viruses: scanResult.viruses,
        });
        return NextResponse.json(
          { error: 'File rejected: security threat detected' },
          { status: 400 },
        );
      }
    }

    // Block duplicate of same type unless previous one was REJECTED
    const existing = await prisma.travel_agent_documents.findFirst({
      where: {
        travelAgentId,
        documentType: documentType as any,
        status: { not: 'REJECTED' },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Document of this type already uploaded. Delete the existing one first.' },
        { status: 400 },
      );
    }

    if (!storageInitialized) {
      await initializeStorage();
      storageInitialized = true;
    }

    const secureFilename = `${documentType}_${generateSecureFilename(file.name)}`;
    await saveTravelAgentDocument(travelAgentId, file, secureFilename);

    const documentUrl = `/api/private-files/travel-agent-documents/${travelAgentId}/${secureFilename}`;

    const document = await prisma.travel_agent_documents.create({
      data: {
        id: generateId(),
        travelAgentId,
        documentType: documentType as any,
        documentName: file.name,
        documentUrl,
        documentNumber: documentNumber || null,
        status: 'PENDING',
      },
    });

    // Auto-promote DOCUMENTS_PENDING → UNDER_REVIEW once all 3 required KYC docs are in
    // (mirrors vendor's required-docs flow). Admin still verifies each one manually,
    // and final APPROVED happens when all 3 are VERIFIED (handled in admin verify route).
    const REQUIRED_TYPES = ['GST_CERTIFICATE', 'PAN_CARD', 'ADDRESS_PROOF'];
    const uploadedDocs = await prisma.travel_agent_documents.findMany({
      where: {
        travelAgentId,
        documentType: { in: REQUIRED_TYPES as any },
        status: { not: 'REJECTED' },
      },
    });
    if (uploadedDocs.length >= REQUIRED_TYPES.length) {
      const agent = await prisma.travel_agents.findUnique({
        where: { id: travelAgentId },
        select: { status: true },
      });
      if (agent?.status === 'DOCUMENTS_PENDING' || agent?.status === 'PENDING') {
        await prisma.travel_agents.update({
          where: { id: travelAgentId },
          data: { status: 'UNDER_REVIEW' },
        });
      }
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error: any) {
    logger.error('Upload travel agent document error', error);
    return NextResponse.json(
      { error: 'Failed to upload document', details: error?.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');
    if (!documentId) {
      return NextResponse.json({ error: 'Document id is required' }, { status: 400 });
    }

    const doc = await prisma.travel_agent_documents.findUnique({ where: { id: documentId } });
    if (!doc || doc.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    if (doc.status === 'VERIFIED') {
      return NextResponse.json(
        { error: 'Cannot delete a verified document' },
        { status: 400 },
      );
    }

    // Best-effort delete from disk (we still drop the DB row even if disk delete fails)
    try {
      const filenameMatch = doc.documentUrl.match(/\/([^/]+)$/);
      if (filenameMatch) {
        await deleteTravelAgentDocument(auth.travelAgentId, filenameMatch[1]);
      }
    } catch (e) {
      logger.warn('Could not remove travel-agent doc file from disk', { docId: documentId, error: e });
    }

    await prisma.travel_agent_documents.delete({ where: { id: documentId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Delete travel agent document error', error);
    return NextResponse.json(
      { error: 'Failed to delete document', details: error?.message },
      { status: 500 },
    );
  }
}
