import { NextRequest, NextResponse } from 'next/server';
import { saveOAuthCredentials, getOAuthCredentialsStatus } from '@/lib/integrations/google-search-console';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

/**
 * Save Google OAuth Client ID/Secret for Search Console, as an alternative
 * to setting GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET in the .env file.
 * POST /api/integrations/gsc/credentials
 * Body: { clientId: string, clientSecret: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const userRole = (session?.user as any)?.role;

    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const clientId = typeof body.clientId === 'string' ? body.clientId.trim() : '';
    const clientSecret = typeof body.clientSecret === 'string' ? body.clientSecret.trim() : '';

    if (!clientId || !clientSecret) {
      return NextResponse.json({
        error: 'Both clientId and clientSecret are required',
      }, { status: 400 });
    }

    await saveOAuthCredentials(clientId, clientSecret);

    console.log('✅ Google Search Console OAuth credentials saved');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('GSC Credentials Save Error:', error);
    return NextResponse.json({
      error: 'Failed to save credentials',
    }, { status: 500 });
  }
}

/**
 * Get whether credentials are configured (never returns the secret itself)
 * GET /api/integrations/gsc/credentials
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const userRole = (session?.user as any)?.role;

    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = await getOAuthCredentialsStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('GSC Credentials Status Error:', error);
    return NextResponse.json({
      error: 'Failed to get credentials status',
    }, { status: 500 });
  }
}
