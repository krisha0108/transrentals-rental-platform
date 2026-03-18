import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/app-version
 * Returns the latest app version info for update checks.
 *
 * To trigger an update popup:
 *   - Change `latestVersion` to the new version you published on Play Store
 *   - Set `forceUpdate` to true if you want to block the app until updated
 *   - Update `updateMessage` with what's new
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    latestVersion: '3.0',       // Change this when you publish a new version
    forceUpdate: false,          // true = no skip, user MUST update
    updateMessage: 'New booking features and bug fixes and performance improvements.',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.transrentals.customer',
  });
}
