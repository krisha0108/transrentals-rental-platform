import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * GET - Get Backr wallet info & recent transactions
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customer_id');

        if (!customerId) {
            return NextResponse.json(
                { success: false, error: 'customer_id is required' },
                { status: 400 }
            );
        }

        // Get or create wallet
        const wallet = await prisma.customer_wallets.upsert({
            where: { customerId },
            create: { customerId },
            update: {},
        });

        // Get recent transactions (last 20)
        const transactions = await prisma.backr_transactions.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        return NextResponse.json({
            success: true,
            tokens: {
                earned_tokens: wallet.totalEarned,
                redeemed_tokens: wallet.totalRedeemed,
                remaining_tokens: wallet.balance,
            },
            customer: {
                solana_wallet: wallet.solanaWallet,
            },
            transactions: transactions.map((t) => ({
                id: t.id,
                type: t.type,
                amount: t.amount,
                balance: t.balance,
                bookingId: t.bookingId,
                bookingNumber: t.bookingNumber,
                serviceType: t.serviceType,
                description: t.description,
                createdAt: t.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        logger.error('Backr GET error', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch Backr info' },
            { status: 500 }
        );
    }
}
