// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
import { generateId } from '@/lib/utils/id-generator';

export const dynamic = 'force-dynamic';

// GET - Fetch comments for a posting
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const postingType = searchParams.get('postingType'); // VEHICLE or BOOKING
    const postingId = searchParams.get('postingId');
    const postingIds = searchParams.get('postingIds'); // comma-separated IDs for bulk counts
    const mode = searchParams.get('mode'); // 'counts' for bulk count mode

    // Bulk counts mode — returns { [postingId]: count } for multiple postings
    if (mode === 'counts' && postingType && postingIds) {
      if (postingType !== 'VEHICLE' && postingType !== 'BOOKING') {
        return NextResponse.json(
          { error: 'postingType must be VEHICLE or BOOKING' },
          { status: 400 }
        );
      }

      const ids = postingIds.split(',').filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json({ success: true, counts: {} });
      }

      const field = postingType === 'VEHICLE' ? 'vehiclePostingId' : 'bookingPostingId';
      const results = await prisma.p2p_comments.groupBy({
        by: [field],
        where: {
          postingType,
          [field]: { in: ids },
        },
        _count: { id: true },
      });

      const counts: Record<string, number> = {};
      for (const r of results) {
        const key = r[field] as string;
        counts[key] = r._count.id;
      }

      return NextResponse.json({ success: true, counts });
    }

    // Single posting mode — returns full comments
    if (!postingType || !postingId) {
      return NextResponse.json(
        { error: 'postingType and postingId are required' },
        { status: 400 }
      );
    }

    if (postingType !== 'VEHICLE' && postingType !== 'BOOKING') {
      return NextResponse.json(
        { error: 'postingType must be VEHICLE or BOOKING' },
        { status: 400 }
      );
    }

    const where: any = { postingType };
    if (postingType === 'VEHICLE') {
      where.vehiclePostingId = postingId;
    } else {
      where.bookingPostingId = postingId;
    }

    const comments = await prisma.p2p_comments.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            city: true,
            logo: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      comments,
      total: comments.length,
    });
  } catch (error: any) {
    logger.error('P2P Comments GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Create a comment on a posting
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { postingType, postingId, message } = body;

    if (!postingType || !postingId || !message?.trim()) {
      return NextResponse.json(
        { error: 'postingType, postingId, and message are required' },
        { status: 400 }
      );
    }

    if (postingType !== 'VEHICLE' && postingType !== 'BOOKING') {
      return NextResponse.json(
        { error: 'postingType must be VEHICLE or BOOKING' },
        { status: 400 }
      );
    }

    // Verify the posting exists
    if (postingType === 'VEHICLE') {
      const posting = await prisma.p2p_vehicle_postings.findUnique({
        where: { id: postingId },
      });
      if (!posting) {
        return NextResponse.json(
          { error: 'Vehicle posting not found' },
          { status: 404 }
        );
      }
    } else {
      const posting = await prisma.p2p_booking_postings.findUnique({
        where: { id: postingId },
      });
      if (!posting) {
        return NextResponse.json(
          { error: 'Booking posting not found' },
          { status: 404 }
        );
      }
    }

    // Generate comment ID with PCM_ prefix
    const commentId = await generateId('PCM_', () =>
      prisma.p2p_comments.findMany({
        where: { id: { startsWith: 'PCM_' } },
        select: { id: true },
      })
    );

    const comment = await prisma.p2p_comments.create({
      data: {
        id: commentId,
        postingType,
        vehiclePostingId: postingType === 'VEHICLE' ? postingId : null,
        bookingPostingId: postingType === 'BOOKING' ? postingId : null,
        vendorId: auth.vendorId,
        message: message.trim(),
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            city: true,
            logo: true,
          },
        },
      },
    });

    // Notify posting owner about the new comment (skip if commenter IS the owner)
    let postingOwnerVendorId: string | null = null;
    let postingRoute = '';
    if (postingType === 'VEHICLE') {
      const vPosting = await prisma.p2p_vehicle_postings.findUnique({
        where: { id: postingId },
        select: { vendorId: true, fromCity: true, toCity: true },
      });
      if (vPosting && vPosting.vendorId !== auth.vendorId) {
        postingOwnerVendorId = vPosting.vendorId;
        postingRoute = `${vPosting.fromCity}→${vPosting.toCity || ''}`;
      }
    } else {
      const bPosting = await prisma.p2p_booking_postings.findUnique({
        where: { id: postingId },
        select: { vendorId: true, fromCity: true, toCity: true },
      });
      if (bPosting && bPosting.vendorId !== auth.vendorId) {
        postingOwnerVendorId = bPosting.vendorId;
        postingRoute = `${bPosting.fromCity}→${bPosting.toCity || ''}`;
      }
    }
    if (postingOwnerVendorId) {
      sendVendorDirectNotification({
        vendorId: postingOwnerVendorId,
        title: '💬 New Comment',
        body: `${comment.vendor?.businessName || 'A vendor'} commented on your ${postingType.toLowerCase()} posting ${postingRoute}`,
        type: 'p2p_new_comment',
        serviceType: 'p2p',
      }).catch((err: any) => console.error('[P2P] Notify comment failed:', err));
    }

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error: any) {
    logger.error('P2P Comments POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
