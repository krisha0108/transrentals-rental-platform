import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/vendor/app-version
 * Returns the latest vendor app version info for update checks.
 *
 * To trigger an update popup:
 *   - Change `latestVersion` to the new version string
 *   - Set `forceUpdate: true` to block the app until updated
 *   - Update `updateMessage` with what's new
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    latestVersion: '4.0.0',      // Change this when you publish a new version
    forceUpdate: false,           // true = user MUST update, cannot skip
    updateMessage: 'New features, performance improvements and bug fixes are available in this update.',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.transrentals.vendor',
  });
}
