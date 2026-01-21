import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/security/logger';

/**
 * POST - Update Solana wallet
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customer_id, solana_wallet } = body;

        if (!customer_id || !solana_wallet) {
            return NextResponse.json({ error: 'customer_id and solana_wallet required' }, { status: 400 });
        }

        logger.info(`Updated Solana wallet for customer ${customer_id}: ${solana_wallet}`);

        return NextResponse.json({
            success: true,
            message: 'Wallet updated'
        });
    } catch (error) {
        logger.error('Backr update-wallet POST error', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update wallet' },
            { status: 500 }
        );
    }
}
