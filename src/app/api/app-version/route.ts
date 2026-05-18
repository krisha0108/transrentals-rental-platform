import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/app-version
 * Returns the latest app version info for update checks.
 *
 * Version config is read from the `settings` table (keys: app_latest_version,
 * app_force_update, app_update_message). Update these from Admin Panel → Settings
 * without needing a backend deploy.
 *
 * Fallback defaults are used if settings don't exist yet.
 */
export async function GET() {
  try {
    const keys = ['app_latest_version', 'app_force_update', 'app_update_message'];
    const settings = await prisma.settings.findMany({
      where: { key: { in: keys } },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s: { key: string; value: string }) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      success: true,
      latestVersion: settingsMap['app_latest_version'] || '3.12',
      forceUpdate: settingsMap['app_force_update'] === 'true',
      updateMessage: settingsMap['app_update_message'] || 'New features and improvements available.',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.transrentals.customer',
    });
  } catch {
    // Fallback if DB is unreachable
    return NextResponse.json({
      success: true,
      latestVersion: '3.12',
      forceUpdate: false,
      updateMessage: 'New features and improvements available.',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.transrentals.customer',
    });
  }
}
