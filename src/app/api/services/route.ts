import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

// Force dynamic rendering (API routes with query params should not be static)
export const dynamic = 'force-dynamic';
// Cache services for 1 hour
export const revalidate = 3600;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const parentId = searchParams.get('parentId');
        const parentsOnly = searchParams.get('parentsOnly') === 'true';

        const where: any = {
            isActive: true,
        };

        if (parentsOnly) {
            where.parentId = null;
        } else if (parentId) {
            where.parentId = parentId;
        }

        const services = await prisma.services.findMany({
            where,
            orderBy: [
                { displayOrder: 'asc' },
                { name: 'asc' }
            ],
            select: {
                id: true,
                name: true,
                slug: true,
                parentId: true,
                shortDesc: true,
                icon: true,
                image: true,
                flowType: true,
            }
        });

        return NextResponse.json({
            success: true,
            services: services
        });
    } catch (error: any) {
        logger.error('Failed to fetch services', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch services' },
            { status: 500 }
        );
    }
}
