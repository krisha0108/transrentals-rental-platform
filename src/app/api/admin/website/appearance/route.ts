import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

const SETTINGS_KEY = 'website_appearance';

// GET - Get appearance/theme configuration
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
        theme: setting.value,
      });
    }

    // Return empty defaults
    return NextResponse.json({
      success: true,
      theme: null,
    });
  } catch (error: any) {
    logger.error('Appearance settings error', error);
    return NextResponse.json(
      { error: 'Failed to fetch appearance settings', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update appearance/theme configuration
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { theme } = body;

    // Upsert the setting
    await prisma.settings.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: theme,
      },
      update: {
        value: theme,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Appearance settings updated successfully',
    });
  } catch (error: any) {
    logger.error('Appearance settings update error', error);
    return NextResponse.json(
      { error: 'Failed to update appearance settings', details: error?.message },
      { status: 500 }
    );
  }
}
