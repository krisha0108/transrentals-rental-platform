import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * GET - Get Backr wallet info (Placeholder)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customer_id');

        // Placeholder data
        return NextResponse.json({
            success: true,
            tokens: {
                earned_tokens: 150,
                redeemed_tokens: 50,
                balance: 100,
            },
            wallet: {
                id: 'placeholder-wallet-id',
                balance: 100,
                currency: 'BACKR',
            }
        });
    } catch (error) {
        logger.error('Backr GET error', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch Backr info' },
            { status: 500 }
        );
    }
}

/**
 * POST - Update Backr wallet or general Backr actions
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'update-wallet') {
            return NextResponse.json({ success: true, message: 'Wallet updated' });
        }

        if (action === 'redeem') {
            return NextResponse.json({ success: true, message: 'Tokens redeemed' });
        }

        return NextResponse.json({ success: true, message: 'Backr action processed' });
    } catch (error) {
        logger.error('Backr POST error', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process Backr action' },
            { status: 500 }
        );
    }
}
