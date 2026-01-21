import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Payment setting keys
const PAYMENT_SETTINGS_KEYS = [
  'payment_upi_id',
  'payment_upi_name',
  'payment_qr_code',
  'payment_bank_name',
  'payment_bank_account',
  'payment_bank_ifsc',
  'payment_bank_holder',
  'payment_bank_branch',
  'payment_instructions',
  'payment_advance_percent', // e.g., 20 for 20% advance
];

// GET - Fetch payment settings
export async function GET() {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: { in: PAYMENT_SETTINGS_KEYS },
      },
    });

    // Convert to object
    const settingsObject: Record<string, string> = {};
    settings.forEach((s) => {
      settingsObject[s.key] = s.value;
    });

    return NextResponse.json({
      success: true,
      settings: settingsObject,
    });
  } catch (error: any) {
    logger.error('Failed to fetch payment settings', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Update payment settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Upsert each setting
    const updates = [];
    for (const key of PAYMENT_SETTINGS_KEYS) {
      if (body[key] !== undefined) {
        updates.push(
          prisma.settings.upsert({
            where: { key },
            update: { value: body[key] || '' },
            create: {
              key,
              value: body[key] || '',
              type: key === 'payment_advance_percent' ? 'NUMBER' : 'TEXT',
              group: 'payment',
              label: key.replace('payment_', '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            },
          })
        );
      }
    }

    await prisma.$transaction(updates);

    return NextResponse.json({
      success: true,
      message: 'Payment settings updated successfully',
    });
  } catch (error: any) {
    logger.error('Failed to update payment settings', error);
    return NextResponse.json(
      { error: 'Failed to update settings', details: error?.message },
      { status: 500 }
    );
  }
}
