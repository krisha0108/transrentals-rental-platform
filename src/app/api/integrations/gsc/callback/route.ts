import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode, saveTokens } from '@/lib/integrations/google-search-console';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

/**
 * OAuth2 callback handler for Google Search Console
 * GET /api/integrations/gsc/callback?code=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.redirect(new URL('/admin/analytics?error=unauthorized', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle user denial
    if (error) {
      console.error('GSC Auth Error:', error);
      return NextResponse.redirect(
        new URL('/admin/analytics?error=access_denied', request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/admin/analytics?error=missing_code', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Save tokens to database
    await saveTokens(tokens);

    console.log('✅ Google Search Console connected successfully');

    // Redirect to integrations page with success message
    return NextResponse.redirect(
      new URL('/admin/analytics?success=gsc_connected', request.url)
    );
  } catch (error) {
    console.error('GSC Callback Error:', error);
    return NextResponse.redirect(
      new URL('/admin/analytics?error=callback_failed', request.url)
    );
  }
}
