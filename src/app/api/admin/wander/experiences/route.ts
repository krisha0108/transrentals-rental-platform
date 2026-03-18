// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET - List all experiences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const experiences = await (prisma as any).wander_experiences.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        category: { select: { id: true, name: true, icon: true } },
        location: { select: { id: true, name: true } },
        _count: { select: { listings: true } },
      },
    });

    return NextResponse.json(experiences);
  } catch (error) {
    console.error('[Admin Wander Experiences GET]', error);
    return NextResponse.json({ error: 'Failed to fetch experiences' }, { status: 500 });
  }
}

// POST - Create experience
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, description, duration, categoryId, locationId, coverImage, highlights, displayOrder } = body;

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!categoryId) return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    if (!locationId) return NextResponse.json({ error: 'Location is required' }, { status: 400 });

    // Generate unique slug
    const baseSlug = title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await (prisma as any).wander_experiences.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const experience = await (prisma as any).wander_experiences.create({
      data: {
        title: title.trim(),
        slug,
        description: description?.trim() || null,
        duration: duration?.trim() || null,
        categoryId,
        locationId,
        coverImage: coverImage?.trim() || null,
        highlights: highlights?.trim() || null,
        displayOrder: displayOrder ?? 0,
        status: 'ACTIVE',
      },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        location: { select: { id: true, name: true } },
        _count: { select: { listings: true } },
      },
    });

    return NextResponse.json(experience, { status: 201 });
  } catch (error) {
    console.error('[Admin Wander Experiences POST]', error);
    return NextResponse.json({ error: 'Failed to create experience' }, { status: 500 });
  }
}
