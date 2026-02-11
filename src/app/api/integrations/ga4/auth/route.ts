import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getGA4AuthorizationUrl } from '@/lib/integrations/google-analytics-4';

export const dynamic = 'force-dynamic';

/**
 * Start Google Analytics 4 OAuth2 flow
 * GET /api/integrations/ga4/auth
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userRole = (session.user as any)?.role;
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Validate required environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({
        error: 'Google OAuth credentials not configured',
        details: 'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
      }, { status: 500 });
    }

    const authorizationUrl = getGA4AuthorizationUrl();

    return NextResponse.json({
      success: true,
      authorizationUrl,
    });
  } catch (error) {
    console.error('GA4 Auth Error:', error);
    return NextResponse.json({
      error: 'Failed to generate authorization URL',
    }, { status: 500 });
  }
}
