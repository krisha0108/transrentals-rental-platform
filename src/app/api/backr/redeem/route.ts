import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/security/logger';

/**
 * POST - Redeem Backr tokens
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customer_id, redeem_value } = body;

        if (!customer_id || !redeem_value) {
            return NextResponse.json({ error: 'customer_id and redeem_value required' }, { status: 400 });
        }

        logger.info(`Redemption request for customer ${customer_id}: ${redeem_value} tokens`);

        return NextResponse.json({
            success: true,
            message: 'Redemption request submitted'
        });
    } catch (error) {
        logger.error('Backr redeem POST error', error);
        return NextResponse.json(
            { success: false, error: 'Failed to submit redemption' },
            { status: 500 }
        );
    }
}
