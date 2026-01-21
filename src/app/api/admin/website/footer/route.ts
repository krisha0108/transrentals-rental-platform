import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

const SETTINGS_KEY = 'website_footer';

// GET - Get footer configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get from SiteSetting
    const setting = await prisma.settings.findUnique({
      where: { key: SETTINGS_KEY },
    });

    if (setting?.value) {
      return NextResponse.json({
        success: true,
        footer: setting.value,
      });
    }

    // Return empty defaults
    return NextResponse.json({
      success: true,
      footer: null,
    });
  } catch (error: any) {
    logger.error('Footer settings error', error);
    return NextResponse.json(
      { error: 'Failed to fetch footer settings', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update footer configuration
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { footer } = body;

    // Upsert the setting
    await prisma.settings.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: footer,
      },
      update: {
        value: footer,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Footer settings updated successfully',
    });
  } catch (error: any) {
    logger.error('Footer settings update error', error);
    return NextResponse.json(
      { error: 'Failed to update footer settings', details: error?.message },
      { status: 500 }
    );
  }
}
