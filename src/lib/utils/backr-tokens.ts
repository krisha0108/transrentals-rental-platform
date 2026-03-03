import { prisma } from '@/lib/db/prisma';

const BACKR_TOKEN_PERCENTAGE = 0.10; // 10%

interface CreditBackrTokensParams {
  customerId: string;
  bookingAmount: number;
  bookingId: string;
  bookingNumber?: string;
  serviceType: string; // bike, car, bus, truck, equipment, packers, luxury, chauffeur
}

/**
 * Credit 10% Backr tokens to customer wallet on booking completion.
 * Never throws — wrapped in try/catch so it never breaks the booking flow.
 */
export async function creditBackrTokens({
  customerId,
  bookingAmount,
  bookingId,
  bookingNumber,
  serviceType,
}: CreditBackrTokensParams): Promise<void> {
  try {
    const tokenAmount = Math.round(bookingAmount * BACKR_TOKEN_PERCENTAGE * 100) / 100;

    if (tokenAmount <= 0) return;

    // Duplicate check: skip if CREDIT already exists for this bookingId
    const existing = await prisma.backr_transactions.findFirst({
      where: { bookingId, type: 'CREDIT' },
    });
    if (existing) return;

    // Upsert wallet: create if first time, increment if exists
    const wallet = await prisma.customer_wallets.upsert({
      where: { customerId },
      create: {
        customerId,
        balance: tokenAmount,
        totalEarned: tokenAmount,
      },
      update: {
        balance: { increment: tokenAmount },
        totalEarned: { increment: tokenAmount },
      },
    });

    // Create transaction record
    await prisma.backr_transactions.create({
      data: {
        customerId,
        type: 'CREDIT',
        amount: tokenAmount,
        balance: wallet.balance,
        bookingId,
        bookingNumber,
        serviceType,
        description: `Earned ${tokenAmount} Backr tokens (10% of ₹${bookingAmount})`,
      },
    });

    console.log(`[Backr] Credited ${tokenAmount} tokens to customer ${customerId} for ${serviceType} booking ${bookingNumber || bookingId}`);
  } catch (error) {
    // Never break the booking flow
    console.error('[Backr] Failed to credit tokens:', error);
  }
}
