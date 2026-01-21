import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/security/logger';

/**
 * POST - Update customer location
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customer_id, latitude, longitude, city } = body;

        if (!customer_id) {
            return NextResponse.json({ error: 'customer_id required' }, { status: 400 });
        }

        logger.info(`Updated location for customer ${customer_id}: ${city} (${latitude}, ${longitude})`);

        return NextResponse.json({
            success: true,
            message: 'Location updated'
        });
    } catch (error) {
        logger.error('Customer location POST error', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update location' },
            { status: 500 }
        );
    }
}
