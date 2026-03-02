import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

/**
 * POST - Update Solana wallet address
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customer_id, solana_wallet } = body;

        if (!customer_id) {
            return NextResponse.json(
                { success: false, error: 'customer_id is required' },
                { status: 400 }
            );
        }

        if (typeof solana_wallet !== 'string') {
            return NextResponse.json(
                { success: false, error: 'solana_wallet must be a string' },
                { status: 400 }
            );
        }

        const wallet = await prisma.customer_wallets.upsert({
            where: { customerId: customer_id },
            create: {
                customerId: customer_id,
                solanaWallet: solana_wallet,
            },
            update: {
                solanaWallet: solana_wallet,
            },
        });

        return NextResponse.json({
            success: true,
            customer: {
                solana_wallet: wallet.solanaWallet,
            },
        });
    } catch (error) {
        logger.error('Backr update-wallet error', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update wallet' },
            { status: 500 }
        );
    }
}
