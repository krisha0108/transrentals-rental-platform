import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getGA4TokensFromCode, saveGA4Tokens } from '@/lib/integrations/google-analytics-4';

export const dynamic = 'force-dynamic';

/**
 * Handle Google Analytics 4 OAuth2 callback
 * GET /api/integrations/ga4/callback?code=...
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // Check if user is admin
    const userRole = (session.user as any)?.role;
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/analytics', request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('GA4 OAuth Error:', error);
      return NextResponse.redirect(
        new URL('/admin/analytics/integrations?ga4_error=' + encodeURIComponent(error), request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/admin/analytics/integrations?ga4_error=no_code', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await getGA4TokensFromCode(code);

    // Save tokens to database
    await saveGA4Tokens(tokens);

    console.log('✅ Google Analytics 4 connected successfully');

    // Redirect to integrations page with success message
    return NextResponse.redirect(
      new URL('/admin/analytics/integrations?ga4_success=true', request.url)
    );
  } catch (error) {
    console.error('GA4 Callback Error:', error);
    return NextResponse.redirect(
      new URL('/admin/analytics/integrations?ga4_error=callback_failed', request.url)
    );
  }
}
