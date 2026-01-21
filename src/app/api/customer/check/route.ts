// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// POST - Check if customer email exists
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const customer = await prisma.customers.findFirst({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true },
    });

    return NextResponse.json({
      success: true,
      exists: !!customer,
      customer: customer ? { id: customer.id, name: customer.name } : null,
    });
  } catch (error: any) {
    logger.error('Failed to check customer', error);
    return NextResponse.json(
      { error: 'Failed to check customer', details: error?.message },
      { status: 500 }
    );
  }
}
