// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

const SETTINGS_KEY = 'website_homepage';

// GET - Get homepage configuration
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
        ...(setting.value as object),
      });
    }

    // Return defaults
    return NextResponse.json({
      success: true,
      heroBanners: [],
      featuredServices: [],
      sections: [],
      stats: {},
    });
  } catch (error: any) {
    logger.error('Homepage settings error', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage settings', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update homepage configuration
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { heroBanners, featuredServices, sections, stats } = body;

    // Upsert the setting
    await prisma.settings.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: { heroBanners, featuredServices, sections, stats },
      },
      update: {
        value: { heroBanners, featuredServices, sections, stats },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Homepage settings updated successfully',
    });
  } catch (error: any) {
    logger.error('Homepage settings update error', error);
    return NextResponse.json(
      { error: 'Failed to update homepage settings', details: error?.message },
      { status: 500 }
    );
  }
}
