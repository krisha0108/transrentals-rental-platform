import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List all brands (optionally filtered by serviceId or serviceSlug)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const serviceId = searchParams.get('serviceId');
    const serviceSlug = searchParams.get('serviceSlug');
    const isActive = searchParams.get('isActive');

    const where: any = {};

    // Filter by serviceId or serviceSlug
    if (serviceId) {
      where.serviceId = serviceId;
    } else if (serviceSlug) {
      const service = await prisma.services.findUnique({
        where: { slug: serviceSlug },
        select: { id: true },
      });
      if (service) {
        where.serviceId = service.id;
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const brands = await prisma.brands.findMany({
      where,
      include: {
        services: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { vehicle_models: true },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
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

// POST - Create new brand
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, serviceId, logo, description, country, isActive, displayOrder } = body;

    if (!name || !serviceId) {
      return NextResponse.json(
        { error: 'Name and serviceId are required' },
        { status: 400 }
      );
    }

    // Verify service exists
    const service = await prisma.services.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Check if brand with same name already exists for this service
    const existingBrand = await prisma.brands.findFirst({
      where: { serviceId, name },
    });

    if (existingBrand) {
      return NextResponse.json(
        { error: 'Brand with this name already exists for this service' },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const slug = `${baseSlug}-${service.slug}`;

    // Check if slug exists
    const existingSlug = await prisma.brands.findFirst({
      where: {
        slug,
        serviceId,
      },
    });
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    const brand = await prisma.brands.create({
      data: {
        name,
        slug: finalSlug,
        serviceId,
        logo: logo || null,
        description: description || null,
        country: country || null,
        isActive: isActive !== false,
        displayOrder: displayOrder || 0,
      },
      include: {
        services: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({ success: true, brand }, { status: 201 });
  } catch (error: any) {
    logger.error('Brand create error', error);
    return NextResponse.json(
      { error: 'Failed to create brand', details: error?.message },
      { status: 500 }
    );
  }
}
