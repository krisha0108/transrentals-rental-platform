import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List all users (SubAdmins and Managers)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SUPER_ADMIN, ADMIN can view all users; SUB_ADMIN can only view Managers
    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // SUB_ADMIN, MANAGER
    const isActive = searchParams.get('isActive');

    const where: any = {};

    // SUB_ADMIN can only see Managers
    if (currentUser.role === 'SUB_ADMIN') {
      where.role = 'MANAGER';
    } else if (role) {
      where.role = role;
    } else {
      // Default: show only SubAdmins and Managers
      where.role = { in: ['SUB_ADMIN', 'MANAGER'] };
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const users = await prisma.admin_users.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        admin_users: {
          select: { id: true, name: true, email: true },
        },
        manager_locations: {
          include: {
            locations: {
              select: { id: true, name: true, type: true, slug: true },
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

    return NextResponse.json(users);
  } catch (error: any) {
    logger.error('Users list error', error);
    return NextResponse.json({ error: 'Failed to fetch users', details: error?.message }, { status: 500 });
  }
}

// POST - Create new SubAdmin or Manager
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SUPER_ADMIN, ADMIN can create any user; SUB_ADMIN can only create Managers
    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      role,
      isActive,
      locationIds,
      serviceIds,
    } = body;

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    // Validate role - can only create SUB_ADMIN or MANAGER
    if (!['SUB_ADMIN', 'MANAGER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Can only create SUB_ADMIN or MANAGER' },
        { status: 400 }
      );
    }

    // SUB_ADMIN can only create MANAGER, not other SUB_ADMINs
    if (currentUser.role === 'SUB_ADMIN' && role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'SubAdmins can only create Managers' },
        { status: 403 }
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

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique ID
    const userId = `user-${randomBytes(8).toString('hex')}`;

    // Create user with transaction to handle location/service assignments
    const user = await prisma.$transaction(async (tx) => {
      // Create the user
      const newUser = await tx.admin_users.create({
        data: {
          id: userId,
          name,
          email,
          phone: phone || null,
          password: hashedPassword,
          role,
          isActive: isActive !== false,
          createdById: currentUser.id,
        },
      });

      // If role is MANAGER and locations are provided, create location assignments
      if (role === 'MANAGER' && locationIds && locationIds.length > 0) {
        await tx.manager_locations.createMany({
          data: locationIds.map((locationId: string) => ({
            id: `ml-${randomBytes(8).toString('hex')}`,
            managerId: newUser.id,
            locationId,
          })),
        });
      }

      // If role is MANAGER and services are provided, create service assignments
      if (role === 'MANAGER' && serviceIds && serviceIds.length > 0) {
        await tx.manager_services.createMany({
          data: serviceIds.map((serviceId: string) => ({
            id: `ms-${randomBytes(8).toString('hex')}`,
            managerId: newUser.id,
            serviceId,
          })),
        });
      }

      return newUser;
    });

    // Fetch the created user with relations
    const createdUser = await prisma.admin_users.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        manager_locations: {
          include: {
            locations: {
              select: { id: true, name: true, type: true },
            },
          },
        },
        manager_services: {
          include: {
            services: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return NextResponse.json(createdUser, { status: 201 });
  } catch (error: any) {
    logger.error('User create error', error);
    return NextResponse.json({ error: 'Failed to create user', details: error?.message }, { status: 500 });
  }
}
