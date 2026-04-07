import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/driver-app/app-version
 * Returns the latest driver app version info for update checks.
 * Config is read from the `settings` table (keys: driver_app_latest_version,
 * driver_app_force_update, driver_app_update_message).
 */
export async function GET() {
  try {
    const keys = ['driver_app_latest_version', 'driver_app_force_update', 'driver_app_update_message'];
    const settings = await prisma.settings.findMany({
      where: { key: { in: keys } },
    });

    const map: Record<string, string> = {};
    settings.forEach((s: { key: string; value: string }) => {
      map[s.key] = s.value;
    });

    return NextResponse.json({
      success: true,
      latestVersion: map['driver_app_latest_version'] || '1.0.0',
      forceUpdate: map['driver_app_force_update'] === 'true',
      updateMessage: map['driver_app_update_message'] || 'New features and improvements available.',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.transrentals.driverapp',
    });
  } catch {
    return NextResponse.json({
      success: true,
      latestVersion: '1.0.0',
      forceUpdate: false,
      updateMessage: 'New features and improvements available.',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.transrentals.driverapp',
    });
  }
}
