import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import bcrypt from 'bcryptjs';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // SUPER_ADMIN, ADMIN can view all; SUB_ADMIN can only view Managers
    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const user = await prisma.admin_users.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        managerLocations: {
          include: {
            location: {
              select: { id: true, name: true, type: true, slug: true },
            },
          },
        },
        managerServices: {
          include: {
            service: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // SUB_ADMIN can only view Managers
    if (currentUser.role === 'SUB_ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    logger.error('User get error', error);
    return NextResponse.json({ error: 'Failed to fetch user', details: error?.message }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // SUPER_ADMIN, ADMIN can update any user; SUB_ADMIN can only update Managers
    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if target user exists
    const existingUser = await prisma.admin_users.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cannot modify SUPER_ADMIN or ADMIN users (except by themselves)
    if (['SUPER_ADMIN', 'ADMIN'].includes(existingUser.role) && existingUser.id !== currentUser.id) {
      return NextResponse.json({ error: 'Cannot modify admin users' }, { status: 403 });
    }

    // SUB_ADMIN can only modify Managers
    if (currentUser.role === 'SUB_ADMIN' && existingUser.role !== 'MANAGER') {
      return NextResponse.json({ error: 'SubAdmins can only modify Managers' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      isActive,
      locationIds,
      serviceIds,
    } = body;

    // Check if new email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.admin_users.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'This email is already in use' },
          { status: 400 }
        );
      }
    }

    // Update user with transaction
    await prisma.$transaction(async (tx) => {
      // Prepare update data
      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone || null;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Hash new password if provided
      if (password) {
        updateData.password = await bcrypt.hash(password, 12);
      }

      // Update user
      await tx.adminUser.update({
        where: { id },
        data: updateData,
      });

      // Update location assignments for MANAGER
      if (existingUser.role === 'MANAGER' && locationIds !== undefined) {
        // Remove existing assignments
        await tx.managerLocation.deleteMany({
          where: { managerId: id },
        });

        // Add new assignments
        if (locationIds && locationIds.length > 0) {
          await tx.managerLocation.createMany({
            data: locationIds.map((locationId: string) => ({
              managerId: id,
              locationId,
            })),
          });
        }
      }

      // Update service assignments for MANAGER
      if (existingUser.role === 'MANAGER' && serviceIds !== undefined) {
        // Remove existing assignments
        await tx.managerService.deleteMany({
          where: { managerId: id },
        });

        // Add new assignments
        if (serviceIds && serviceIds.length > 0) {
          await tx.managerService.createMany({
            data: serviceIds.map((serviceId: string) => ({
              managerId: id,
              serviceId,
            })),
          });
        }
      }
    });

    // Fetch updated user
    const updatedUser = await prisma.admin_users.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        managerLocations: {
          include: {
            location: {
              select: { id: true, name: true, type: true },
            },
          },
        },
        managerServices: {
          include: {
            service: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    logger.error('User update error', error);
    return NextResponse.json({ error: 'Failed to update user', details: error?.message }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // SUPER_ADMIN, ADMIN can delete any user; SUB_ADMIN can only delete Managers
    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if target user exists
    const existingUser = await prisma.admin_users.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cannot delete SUPER_ADMIN or ADMIN users
    if (['SUPER_ADMIN', 'ADMIN'].includes(existingUser.role)) {
      return NextResponse.json({ error: 'Cannot delete admin users' }, { status: 403 });
    }

    // SUB_ADMIN can only delete Managers
    if (currentUser.role === 'SUB_ADMIN' && existingUser.role !== 'MANAGER') {
      return NextResponse.json({ error: 'SubAdmins can only delete Managers' }, { status: 403 });
    }

    // Cannot delete yourself
    if (existingUser.id === currentUser.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 403 });
    }

    // Delete user (cascades will handle related records)
    await prisma.admin_users.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('User delete error', error);
    return NextResponse.json({ error: 'Failed to delete user', details: error?.message }, { status: 500 });
  }
}
