import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// GET - List brands for a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    // Find the service by slug
    const service = await prisma.services.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const brands = await prisma.brands.findMany({
      where: { serviceId: service.id },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            vehicle_models: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, brands });
  } catch (error: any) {
    logger.error('Brands list error', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create new brand for this service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { slug } = await params;

    // Find the service by slug
    const service = await prisma.services.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, slug: brandSlug, logo, description, country, isActive, displayOrder } = body;

    if (!name || !brandSlug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check if slug already exists within this service
    const existing = await prisma.brands.findFirst({
      where: {
        serviceId: service.id,
        slug: brandSlug,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A brand with this slug already exists in this service' },
        { status: 400 }
      );
    }

    const brand = await prisma.brands.create({
      data: {
        id: generateId(),
        name,
        slug: brandSlug,
        logo: logo || null,
        description: description || null,
        country: country || null,
        serviceId: service.id,
        isActive: isActive !== false,
        displayOrder: displayOrder || 0,
      },
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (error: any) {
    logger.error('Brand create error', error);
    return NextResponse.json(
      { error: 'Failed to create brand', details: error?.message },
      { status: 500 }
    );
  }
}
