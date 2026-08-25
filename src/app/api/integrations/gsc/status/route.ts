import { NextRequest, NextResponse } from 'next/server';
import { isGSCConnected, getOAuthCredentialsStatus } from '@/lib/integrations/google-search-console';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * Get Google Search Console connection status
 * GET /api/integrations/gsc/status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const userRole = (session?.user as any)?.role;

    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isConnected = await isGSCConnected();
    const credStatus = await getOAuthCredentialsStatus();

    if (!isConnected) {
      return NextResponse.json({
        isConnected: false,
        message: 'Google Search Console not connected',
        credentialsConfigured: credStatus.isConfigured,
        credentialsSource: credStatus.source,
        clientId: credStatus.clientId,
      });
    }

    // Get integration details
    const integration = await prisma.integration_settings.findUnique({
      where: { service: 'google_search_console' },
    });

    if (!integration) {
      return NextResponse.json({
        isConnected: false,
        message: 'Integration settings not found',
      });
    }

    // Try to fetch available sites (validates connection)
    let sites: any[] = [];
    try {
      const { google } = await import('googleapis');
      const { getOAuth2Client } = await import('@/lib/integrations/google-search-console');

      const oauth2Client = await getOAuth2Client();
      oauth2Client.setCredentials({
        access_token: integration.accessToken,
        refresh_token: integration.refreshToken,
        expiry_date: integration.expiresAt?.getTime(),
      });

      const searchConsole = google.searchconsole({ version: 'v1', auth: oauth2Client });
      const sitesResponse = await searchConsole.sites.list();
      sites = sitesResponse.data.siteEntry || [];
    } catch (error) {
      console.error('Failed to fetch sites:', error);
    }

    return NextResponse.json({
      isConnected: true,
      connectedAt: integration.createdAt,
      lastSync: integration.updatedAt,
      tokenExpiresAt: integration.expiresAt,
      availableSites: sites.map((site: any) => ({
        siteUrl: site.siteUrl,
        permissionLevel: site.permissionLevel,
      })),
    });
  } catch (error) {
    console.error('GSC Status Error:', error);
    return NextResponse.json({
      error: 'Failed to get GSC status',
    }, { status: 500 });
  }
}
