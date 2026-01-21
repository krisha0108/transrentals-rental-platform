import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

export const dynamic = 'force-dynamic';

// GET - Fetch all parent services for sidebar
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all parent services (services without parentId)
    const services = await prisma.services.findMany({
      where: {
        parentId: null, // Only parent services
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        flowType: true,
        icon: true,
        displayOrder: true,
        _count: {
          select: {
            other_services: true,
            service_locations: true,
          },
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      services: services.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        flowType: s.flowType,
        icon: s.icon,
        displayOrder: s.displayOrder,
        childrenCount: s._count.other_services,
        locationsCount: s._count.service_locations,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services', details: error?.message },
      { status: 500 }
    );
  }
}
