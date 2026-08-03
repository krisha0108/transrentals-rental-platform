import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get single manager
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id } = resolvedParams;

    // Check admin permission
    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const manager = await prisma.admin_users.findUnique({
      where: { id, role: 'MANAGER' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
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
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      manager: {
        ...manager,
        locations: manager.manager_locations.map((ml) => ml.locations),
        services: manager.manager_services.map((ms) => ms.services),
      },
    });
  } catch (error: any) {
    logger.error('Manager get error', error);
    return NextResponse.json(
      { error: 'Failed to fetch manager', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Update manager
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id } = resolvedParams;
    const body = await request.json();

    // Check if manager exists
    const existing = await prisma.admin_users.findUnique({
      where: { id, role: 'MANAGER' },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    const { name, email, phone, password, isActive, locationIds, serviceIds } = body;

    // Check if email is taken by another user
    if (email && email !== existing.email) {
      const emailExists = await prisma.admin_users.findUnique({
        where: { email },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email is already in use by another user' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update manager with transaction to handle locations and services
    const manager = await prisma.$transaction(async (tx) => {
      // Update manager basic info
      await tx.admin_users.update({
        where: { id },
        data: updateData,
      });

      // Update locations if provided
      if (locationIds !== undefined) {
        // Delete existing locations
        await tx.manager_locations.deleteMany({
          where: { managerId: id },
        });
        // Create new locations
        if (locationIds.length > 0) {
          await tx.manager_locations.createMany({
            data: locationIds.map((locationId: string) => ({
              id: `ml-${randomBytes(8).toString('hex')}`,
              managerId: id,
              locationId,
            })),
          });
        }
      }

      // Update services if provided
      if (serviceIds !== undefined) {
        // Delete existing services
        await tx.manager_services.deleteMany({
          where: { managerId: id },
        });
        // Create new services
        if (serviceIds.length > 0) {
          await tx.manager_services.createMany({
            data: serviceIds.map((serviceId: string) => ({
              id: `ms-${randomBytes(8).toString('hex')}`,
              managerId: id,
              serviceId,
            })),
          });
        }
      }

      // Fetch updated manager
      return tx.admin_users.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
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
      });
    });

    return NextResponse.json({
      success: true,
      manager: {
        ...manager,
        locations: manager?.manager_locations.map((ml) => ml.locations) || [],
        services: manager?.manager_services.map((ms) => ms.services) || [],
      },
    });
  } catch (error: any) {
    logger.error('Manager update error', error);
    return NextResponse.json(
      { error: 'Failed to update manager', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete manager
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id } = resolvedParams;

    // Check if manager exists
    const existing = await prisma.admin_users.findUnique({
      where: { id, role: 'MANAGER' },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    // Delete manager and related assignments (cascade)
    await prisma.$transaction(async (tx) => {
      await tx.manager_locations.deleteMany({ where: { managerId: id } });
      await tx.manager_services.deleteMany({ where: { managerId: id } });
      await tx.admin_users.delete({ where: { id } });
    });

    return NextResponse.json({
      success: true,
      message: 'Manager deleted successfully',
    });
  } catch (error: any) {
    logger.error('Manager delete error', error);
    return NextResponse.json(
      { error: 'Failed to delete manager', details: error?.message },
      { status: 500 }
    );
  }
}
