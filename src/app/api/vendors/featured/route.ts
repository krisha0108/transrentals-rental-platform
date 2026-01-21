import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * GET - Get featured vendors
 */
export async function GET(request: NextRequest) {
    try {
        // For now, just return first 10 vendors as featured
        const vendors = await prisma.vendors.findMany({
            take: 10,
            select: {
                id: true,
                businessName: true,
                ownerName: true,
                logo: true,
                rating: true,
                city: true,
                state: true,
            }
        });

        return NextResponse.json({
            success: true,
            vendors: vendors.map(v => ({
                ...v,
                name: v.businessName, // App expects 'name'
                image: v.logo, // App might expect 'image'
            }))
        });
    } catch (error) {
        logger.error('Featured vendors GET error', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch featured vendors' },
            { status: 500 }
        );
    }
}
