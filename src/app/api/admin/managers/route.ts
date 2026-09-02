import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List all managers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SUPER_ADMIN and ADMIN can view managers
    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const managers = await prisma.admin_users.findMany({
      where: { role: 'MANAGER' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        canManageCarRentalContent: true,
        createdAt: true,
        manager_locations: {
          include: {
            locations: {
              select: { id: true, name: true, slug: true, type: true },
            },
          },
        },
        manager_services: {
          include: {
            services: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data
    const formattedManagers = managers.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      isActive: m.isActive,
      canManageCarRentalContent: m.canManageCarRentalContent,
      createdAt: m.createdAt,
      locations: m.manager_locations.map((ml) => ml.locations),
      services: m.manager_services.map((ms) => ms.services),
    }));

    return NextResponse.json({
      success: true,
      managers: formattedManagers,
    });
  } catch (error: any) {
    logger.error('Managers list error', error);
    return NextResponse.json(
      { error: 'Failed to fetch managers', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create new manager
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SUPER_ADMIN and ADMIN can create managers
    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone, password, isActive, canManageCarRentalContent, locationIds, serviceIds } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.admin_users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create manager with locations and services
    const managerId = `user-${randomBytes(8).toString('hex')}`;
    const manager = await prisma.admin_users.create({
      data: {
        id: managerId,
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: 'MANAGER',
        isActive: isActive !== false,
        canManageCarRentalContent: canManageCarRentalContent === true,
        createdById: currentUser.id,
        manager_locations: {
          create: (locationIds || []).map((locationId: string) => ({
            id: `ml-${randomBytes(8).toString('hex')}`,
            locationId,
          })),
        },
        manager_services: {
          create: (serviceIds || []).map((serviceId: string) => ({
            id: `ms-${randomBytes(8).toString('hex')}`,
            serviceId,
          })),
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        canManageCarRentalContent: true,
        createdAt: true,
        manager_locations: {
          include: {
            locations: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        manager_services: {
          include: {
            services: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        manager: {
          ...manager,
          locations: manager.manager_locations.map((ml) => ml.locations),
          services: manager.manager_services.map((ms) => ms.services),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Manager create error', error);
    return NextResponse.json(
      { error: 'Failed to create manager', details: error?.message },
      { status: 500 }
    );
  }
}
