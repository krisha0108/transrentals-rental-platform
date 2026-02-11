import { NextRequest, NextResponse } from 'next/server';
import { syncSearchQueries, isGSCConnected } from '@/lib/integrations/google-search-console';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for long-running sync

/**
 * Manually trigger Google Search Console data sync
 * POST /api/integrations/gsc/sync
 * Body: { siteUrl: string, days?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const userRole = (session?.user as any)?.role;

    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if GSC is connected
    const isConnected = await isGSCConnected();
    if (!isConnected) {
      return NextResponse.json({
        error: 'Google Search Console not connected',
        message: 'Please connect GSC first',
      }, { status: 400 });
    }

    const body = await request.json();
    const { siteUrl, days = 90 } = body;

    if (!siteUrl) {
      return NextResponse.json({
        error: 'Site URL is required',
      }, { status: 400 });
    }

    // Validate site URL format
    if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://') && !siteUrl.startsWith('sc-domain:')) {
      return NextResponse.json({
        error: 'Invalid site URL format',
        message: 'Must start with http://, https://, or sc-domain:',
      }, { status: 400 });
    }

    console.log(`🔄 Starting manual GSC sync for ${siteUrl}...`);

    // Sync search queries
    const result = await syncSearchQueries(siteUrl, days);

    return NextResponse.json({
      success: true,
      message: 'Google Search Console data synced successfully',
      stats: result,
    });
  } catch (error) {
    console.error('GSC Sync Error:', error);
    return NextResponse.json({
      error: 'Failed to sync GSC data',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Get sync status and last sync time
 * GET /api/integrations/gsc/sync
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const userRole = (session?.user as any)?.role;

    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isConnected = await isGSCConnected();

    if (!isConnected) {
      return NextResponse.json({
        isConnected: false,
        lastSync: null,
      });
    }

    // Get last sync time from integration_settings
    const { prisma } = await import('@/lib/db/prisma');
    const integration = await prisma.integration_settings.findUnique({
      where: { service: 'google_search_console' },
    });

    return NextResponse.json({
      isConnected: true,
      lastSync: integration?.updatedAt || null,
    });
  } catch (error) {
    console.error('GSC Status Error:', error);
    return NextResponse.json({
      error: 'Failed to get sync status',
    }, { status: 500 });
  }
}
