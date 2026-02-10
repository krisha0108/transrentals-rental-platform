import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/integrations/google-search-console';
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

    // Check if credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({
        error: 'Google Search Console credentials not configured',
        message: 'Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file',
      }, { status: 500 });
    }

    const authUrl = getAuthorizationUrl();

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
