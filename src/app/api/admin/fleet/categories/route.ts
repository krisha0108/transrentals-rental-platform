import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List all categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.fleet_categories.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { vehicles: true, types: true },
        },
        types: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    logger.error('Categories list error', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description, icon, displayOrder, isActive, specFields } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const category = await prisma.fleet_categories.create({
      data: {
        name,
        slug,
        description,
        icon,
        displayOrder: displayOrder || 0,
        isActive: isActive !== false,
        specFields: specFields || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    logger.error('Category create error', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
