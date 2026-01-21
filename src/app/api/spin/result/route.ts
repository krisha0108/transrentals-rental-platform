import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/security/logger';

/**
 * POST - Record spin result
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customer_id, prize } = body;

        if (!customer_id) {
            return NextResponse.json({ error: 'customer_id required' }, { status: 400 });
        }

        logger.info(`Spin result for customer ${customer_id}: ${prize}`);

        return NextResponse.json({
            success: true,
            message: 'Spin result recorded'
        });
    } catch (error) {
        logger.error('Spin result POST error', error);
        return NextResponse.json(
            { success: false, error: 'Failed to record spin result' },
            { status: 500 }
        );
    }
}
