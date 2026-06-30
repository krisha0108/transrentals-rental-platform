import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Always use APP_URL — never req.headers.host (leaks Docker/container hostname)
const APP_URL = (process.env.APP_URL ?? 'https://transrentals.in').replace(/\/$/, '');

/**
 * GET /backr/callback?backr_linked=1&redirectTo=/vendor/dashboard
 *
 * BACKR redirects the user here after SSO. We immediately 302 to the
 * appropriate dashboard using APP_URL — no client-side JS, no req.host.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const linked     = searchParams.get('backr_linked');
  const redirectTo = searchParams.get('redirectTo') || '/customer/dashboard';

  if (linked === '1') {
    return NextResponse.redirect(`${APP_URL}${redirectTo}?backr=connected`);
  }

  const errCode = searchParams.get('backr_error') || '1';
  return NextResponse.redirect(`${APP_URL}${redirectTo}?backr_error=${errCode}`);
}
