// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch experience with linked listings + unlinked listings for linking
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const experience = await (prisma as any).wander_experiences.findUnique({
      where: { id: params.id },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        location: { select: { id: true, name: true } },
        listings: {
          include: {
            vendor: { select: { id: true, businessName: true } },
            mainLocation: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!experience) return NextResponse.json({ error: 'Experience not found' }, { status: 404 });

    // Fetch unlinked active listings (no experienceId set) — optionally filter by same category/location
    const unlinked = await (prisma as any).wander_listings.findMany({
      where: {
        experienceId: null,
        status: 'ACTIVE',
      },
      include: {
        vendor: { select: { id: true, businessName: true } },
        category: { select: { id: true, name: true, icon: true } },
        mainLocation: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ experience, unlinked });
  } catch (error) {
    console.error('[Admin Wander Experience GET]', error);
    return NextResponse.json({ error: 'Failed to fetch experience' }, { status: 500 });
  }
}

// POST - Link or unlink listings to/from experience
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, listingIds } = await request.json();
    if (!action || !Array.isArray(listingIds) || listingIds.length === 0) {
      return NextResponse.json({ error: 'action and listingIds[] required' }, { status: 400 });
    }

    if (action === 'link') {
      await (prisma as any).wander_listings.updateMany({
        where: { id: { in: listingIds } },
        data: { experienceId: params.id },
      });
    } else if (action === 'unlink') {
      await (prisma as any).wander_listings.updateMany({
        where: { id: { in: listingIds }, experienceId: params.id },
        data: { experienceId: null },
      });
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "link" or "unlink"' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Wander Experience Link/Unlink]', error);
    return NextResponse.json({ error: 'Failed to update listings' }, { status: 500 });
  }
}

// PATCH - Update experience
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, description, duration, categoryId, locationId, coverImage, highlights, displayOrder, status } = body;

    const data: any = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (duration !== undefined) data.duration = duration?.trim() || null;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (locationId !== undefined) data.locationId = locationId;
    if (coverImage !== undefined) data.coverImage = coverImage?.trim() || null;
    if (highlights !== undefined) data.highlights = highlights?.trim() || null;
    if (displayOrder !== undefined) data.displayOrder = displayOrder;
    if (status !== undefined) data.status = status;

    const experience = await (prisma as any).wander_experiences.update({
      where: { id: params.id },
      data,
      include: {
        category: { select: { id: true, name: true, icon: true } },
        location: { select: { id: true, name: true } },
        _count: { select: { listings: true } },
      },
    });

    return NextResponse.json(experience);
  } catch (error) {
    console.error('[Admin Wander Experiences PATCH]', error);
    return NextResponse.json({ error: 'Failed to update experience' }, { status: 500 });
  }
}

// DELETE - Delete experience (only if no linked listings)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const count = await (prisma as any).wander_listings.count({ where: { experienceId: params.id } });
    if (count > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${count} listing(s) are linked to this experience. Unlink them first.` },
        { status: 400 }
      );
    }

    await (prisma as any).wander_experiences.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Wander Experiences DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete experience' }, { status: 500 });
  }
}
