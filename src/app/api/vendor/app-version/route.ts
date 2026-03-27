import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/vendor/app-version
 * Returns the latest vendor app version info for update checks.
 *
 * Version config is read from the `settings` table (keys: vendor_app_latest_version,
 * vendor_app_force_update, vendor_app_update_message). Update these from
 * Admin Panel → Settings without needing a backend deploy.
 */
export async function GET() {
  try {
    const keys = ['vendor_app_latest_version', 'vendor_app_force_update', 'vendor_app_update_message'];
    const settings = await prisma.settings.findMany({
      where: { key: { in: keys } },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s: { key: string; value: string }) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      success: true,
      latestVersion: settingsMap['vendor_app_latest_version'] || '4.0.0',
      forceUpdate: settingsMap['vendor_app_force_update'] === 'true',
      updateMessage: settingsMap['vendor_app_update_message'] || 'New features and improvements available.',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.transrentals.vendor',
    });
  } catch {
    // Fallback if DB is unreachable
    return NextResponse.json({
      success: true,
      latestVersion: '4.0.0',
      forceUpdate: false,
      updateMessage: 'New features and improvements available.',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.transrentals.vendor',
    });
  }
}
