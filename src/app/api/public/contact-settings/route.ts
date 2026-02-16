import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// Public endpoint to get contact settings (no authentication required)
export async function GET() {
  try {
    const contactSettings = await prisma.settings.findMany({
      where: {
        key: {
          in: ['contactEmail', 'contactPhone'],
        },
      },
      select: {
        key: true,
        value: true,
      },
    });

    // Convert to key-value object
    const settingsObject: Record<string, string> = {};
    contactSettings.forEach((setting) => {
      settingsObject[setting.key] = setting.value;
    });

    return NextResponse.json(settingsObject);
  } catch (error) {
    logger.error('Error fetching contact settings', error);
    return NextResponse.json({ error: 'Failed to fetch contact settings' }, { status: 500 });
  }
}
