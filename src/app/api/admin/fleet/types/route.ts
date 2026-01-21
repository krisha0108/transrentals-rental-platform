import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List all fleet types (optionally filtered by category)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const categorySlug = searchParams.get('categorySlug');

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (categorySlug) {
      where.chauffeur_vehicle_categories = { slug: categorySlug };
    }

    const types = await prisma.fleet_types.findMany({
      where,
      include: {
        chauffeur_vehicle_categories: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { vehicles: true },
        },
      },
      orderBy: [{ category: { displayOrder: 'asc' } }, { displayOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json(types);
  } catch (error) {
    logger.error('Fleet types fetch error', error);
    return NextResponse.json({ error: 'Failed to fetch fleet types' }, { status: 500 });
  }
}

// POST - Create a new fleet type
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, categoryId, description, displayOrder, isActive } = body;

    if (!name || !categoryId) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if type with same slug exists in this category
    const existing = await prisma.fleet_types.findFirst({
      where: { slug, categoryId },
    });

    if (existing) {
      return NextResponse.json({ error: 'A type with this name already exists in this category' }, { status: 400 });
    }

    const type = await prisma.fleet_types.create({
      data: {
        name,
        slug,
        categoryId,
        description: description || null,
        displayOrder: displayOrder || 0,
        isActive: isActive !== false,
      },
      include: {
        chauffeur_vehicle_categories: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json(type, { status: 201 });
  } catch (error) {
    logger.error('Fleet type create error', error);
    return NextResponse.json({ error: 'Failed to create fleet type' }, { status: 500 });
  }
}
