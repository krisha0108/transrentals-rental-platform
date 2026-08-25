import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl, getOAuthCredentialsStatus } from '@/lib/integrations/google-search-console';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

/**
 * Start Google Search Console OAuth2 flow
 * GET /api/integrations/gsc/auth
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const userRole = (session?.user as any)?.role;

    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if credentials are configured (either in the DB, via the admin
    // UI, or in the .env file)
    const credStatus = await getOAuthCredentialsStatus();
    if (!credStatus.isConfigured) {
      return NextResponse.json({
        error: 'Google Search Console credentials not configured',
        message: 'Add a Client ID and Client Secret below, or set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file',
      }, { status: 500 });
    }

    const authUrl = await getAuthorizationUrl();

    return NextResponse.json({
      authUrl,
      message: 'Redirect user to this URL to authorize',
    });
  } catch (error) {
    console.error('GSC Auth Error:', error);
    return NextResponse.json({
      error: 'Failed to generate authorization URL',
    }, { status: 500 });
  }
}
