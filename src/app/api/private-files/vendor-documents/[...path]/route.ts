/**
 * Private Vendor Documents API
 *
 * Serves vendor documents from private storage with authentication.
 * Only the document owner (vendor) or admin can access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { vendorAuthOptions } from '@/lib/auth/vendor-auth-options';
import { prisma } from '@/lib/db/prisma';
import {
  readVendorDocument,
  getMimeType,
  validateFileAccessToken,
} from '@/lib/storage/private-storage';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    if (!pathSegments || pathSegments.length < 2) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const [vendorId, ...filenameParts] = pathSegments;
    const filename = filenameParts.join('/');

    if (!vendorId || !filename) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Check for token-based access (for admin viewing)
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get('token');

    if (accessToken) {
      // Validate access token
      const tokenResult = validateFileAccessToken(accessToken);
      if (!tokenResult.valid) {
        logger.logSecurityEvent('Invalid file access token', 'medium', {
          error: tokenResult.error,
          vendorId,
          filename,
        });
        return NextResponse.json(
          { error: 'Invalid or expired access token' },
          { status: 401 }
        );
      }

      // Token must match requested file
      if (tokenResult.vendorId !== vendorId || tokenResult.filename !== filename) {
        return NextResponse.json(
          { error: 'Token does not match requested file' },
          { status: 403 }
        );
      }
    } else {
      // Check session-based authentication
      // Try vendor session first
      let session = await getServerSession(vendorAuthOptions);
      let userType = 'vendor';

      if (!session?.user?.id) {
        // Try admin session
        session = await getServerSession(authOptions);
        userType = 'admin';
      }

      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Authorization check
      if (userType === 'vendor') {
        // Vendor can only access their own documents
        if (session.user.id !== vendorId) {
          logger.logSecurityEvent('Unauthorized document access attempt', 'high', {
            requestingVendor: session.user.id,
            targetVendor: vendorId,
            filename,
          });
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      } else if (userType === 'admin') {
        // Verify admin role
        const adminUser = await prisma.admin_users.findUnique({
          where: { id: session.user.id },
          select: { role: true, isActive: true },
        });

        if (!adminUser || !adminUser.isActive) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Log admin access for audit
        logger.info('Admin accessing vendor document', {
          adminId: session.user.id,
          vendorId,
          filename,
        });
      }
    }

    // Verify document exists in database
    const document = await prisma.vendor_documents.findFirst({
      where: {
        vendorId,
        documentUrl: { contains: filename },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Read file from private storage
    const fileBuffer = await readVendorDocument(vendorId, filename);

    if (!fileBuffer) {
      logger.error('Document file not found in storage', { vendorId, filename });
      return NextResponse.json(
        { error: 'Document file not found' },
        { status: 404 }
      );
    }

    // Get MIME type
    const mimeType = getMimeType(filename);

    // Return file with appropriate headers
    const response = new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `inline; filename="${document.documentName || filename}"`,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });

    return response;
  } catch (error) {
    logger.error('Error serving private document', error);
    return NextResponse.json(
      { error: 'Failed to retrieve document' },
      { status: 500 }
    );
  }
}
