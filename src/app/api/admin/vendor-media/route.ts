import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

export const dynamic = 'force-dynamic';

// GET - Fetch all vendor media with pagination, search, and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');
    const search = searchParams.get('search') || '';
    const vendorId = searchParams.get('vendorId') || '';
    const type = searchParams.get('type') || ''; // image, video, document

    const skip = (page - 1) * limit;

    // Build where clause - only vendor uploaded media
    const where: any = {
      vendorId: { not: null },
    };

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (search) {
      where.OR = [
        { filename: { contains: search } },
        { originalName: { contains: search } },
        { alt: { contains: search } },
        { vendor: { businessName: { contains: search } } },
        { vendor: { ownerName: { contains: search } } },
      ];
    }

    if (type) {
      if (type === 'image') {
        where.mimeType = { startsWith: 'image/' };
      } else if (type === 'video') {
        where.mimeType = { startsWith: 'video/' };
      } else if (type === 'document') {
        where.mimeType = {
          in: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        };
      }
    }

    // Fetch media with vendor info
    const [media, total, vendors] = await Promise.all([
      prisma.media.findMany({
        where,
        include: {
          vendors: {
            select: {
              id: true,
              businessName: true,
              ownerName: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.media.count({ where }),
      // Get list of vendors who have uploaded media
      prisma.vendors.findMany({
        where: {
          media: { some: {} },
        },
        select: {
          id: true,
          businessName: true,
        },
        orderBy: { businessName: 'asc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      media,
      vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching vendor media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor media' },
      { status: 500 }
    );
  }
}
