import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

export const dynamic = 'force-dynamic';

// GET - Get basic service info by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { slug } = resolvedParams;

    const service = await prisma.services.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        flowType: true,
        description: true,
        isActive: true,
        icon: true,
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error: any) {
    console.error('Error fetching service info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service info', details: error?.message },
      { status: 500 }
    );
  }
}
