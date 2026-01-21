import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/security/logger';

/**
 * POST - Confirm spin prize
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customer_id, key, index } = body;

        if (!customer_id || !key) {
            return NextResponse.json({ error: 'customer_id and key required' }, { status: 400 });
        }

        logger.info(`Spin confirmation for customer ${customer_id}: ${key} (index ${index})`);

        return NextResponse.json({
            success: true,
            message: 'Spin confirmed'
        });
    } catch (error) {
        logger.error('Spin confirm POST error', error);
        return NextResponse.json(
            { success: false, error: 'Failed to confirm spin' },
            { status: 500 }
        );
    }
}
