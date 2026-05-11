/**
 * Private Travel Agent Documents API
 *
 * Serves travel agent documents from private storage with authentication.
 * Only the document owner (travel agent) or admin can access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import {
  readTravelAgentDocument,
  getMimeType,
  validateFileAccessToken,
} from '@/lib/storage/private-storage';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: pathSegments } = await params;
    if (!pathSegments || pathSegments.length < 2) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const [travelAgentId, ...filenameParts] = pathSegments;
    const filename = filenameParts.join('/');
    if (!travelAgentId || !filename) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Token-based access (admin link sharing)
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get('token');

    if (accessToken) {
      const tokenResult = validateFileAccessToken(accessToken);
      if (!tokenResult.valid) {
        logger.logSecurityEvent('Invalid file access token (travel agent doc)', 'medium', {
          error: tokenResult.error,
          travelAgentId,
          filename,
        });
        return NextResponse.json(
          { error: 'Invalid or expired access token' },
          { status: 401 },
        );
      }
      if (tokenResult.vendorId !== travelAgentId || tokenResult.filename !== filename) {
        return NextResponse.json(
          { error: 'Token does not match requested file' },
          { status: 403 },
        );
      }
    } else {
      // Session-based authentication (default authOptions covers admin + vendor + travel-agent)
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const userType = (session.user as any)?.userType || 'admin';

      if (userType === 'travel_agent') {
        // Travel agent can only access their own documents
        if (session.user.id !== travelAgentId) {
          logger.logSecurityEvent('Unauthorized travel-agent document access attempt', 'high', {
            requestingAgent: session.user.id,
            targetAgent: travelAgentId,
            filename,
          });
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      } else if (userType === 'admin') {
        const adminUser = await prisma.admin_users.findUnique({
          where: { id: session.user.id },
          select: { role: true, isActive: true },
        });
        if (!adminUser || !adminUser.isActive) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        logger.info('Admin accessing travel-agent document', {
          adminId: session.user.id,
          travelAgentId,
          filename,
        });
      } else {
        // Other user types (vendor, etc.) cannot access travel-agent docs
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Verify the document exists in DB and belongs to this agent
    const document = await prisma.travel_agent_documents.findFirst({
      where: {
        travelAgentId,
        documentUrl: { contains: filename },
      },
    });
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const fileBuffer = await readTravelAgentDocument(travelAgentId, filename);
    if (!fileBuffer) {
      logger.error('Travel-agent document file not found in storage', { travelAgentId, filename });
      return NextResponse.json({ error: 'Document file not found' }, { status: 404 });
    }

    const mimeType = getMimeType(filename);
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `inline; filename="${document.documentName || filename}"`,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    logger.error('Error serving private travel-agent document', error);
    return NextResponse.json(
      { error: 'Failed to retrieve document' },
      { status: 500 },
    );
  }
}
