import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes

// GET public settings (no auth required) - for footer
export async function GET() {
  try {
    // Fetch only public contact and social media settings
    const publicKeys = [
      'contactEmail',
      'contactPhone',
      'facebookUrl',
      'instagramUrl',
      'twitterUrl',
      'linkedinUrl',
    ];

    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: publicKeys,
        },
      },
      select: {
        key: true,
        value: true,
      },
    });

    // Convert to key-value object
    const settingsObject: Record<string, string | null> = {};
    settings.forEach((setting) => {
      // Only include if value is not empty
      if (setting.value && setting.value.trim() !== '') {
        settingsObject[setting.key] = setting.value;
      } else {
        settingsObject[setting.key] = null;
      }
    });

    // Ensure all keys exist (even if null)
    publicKeys.forEach((key) => {
      if (!(key in settingsObject)) {
        settingsObject[key] = null;
      }
    });

    return NextResponse.json({
      success: true,
      settings: settingsObject,
    });
  } catch (error) {
    logger.error('Error fetching public settings', error);
    // Return empty settings on error, so footer can fallback to env
    return NextResponse.json({
      success: false,
      settings: {
        contactEmail: null,
        contactPhone: null,
        facebookUrl: null,
        instagramUrl: null,
        twitterUrl: null,
        linkedinUrl: null,
      },
    });
  }
}
