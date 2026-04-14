import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { addSecurityHeaders } from '@/lib/security/headers';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS preflight requests for API routes
  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Handle admin route protection
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Check if token exists and is an admin
    if (!token || token.userType !== 'admin') {
      const loginUrl = new URL('/admin/login', request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      return addSecurityHeaders(redirectResponse);
    }
  }

  // Handle vendor dashboard protection (exclude auth pages and API)
  if (pathname.startsWith('/vendor/') &&
      !pathname.startsWith('/vendor/login') &&
      !pathname.startsWith('/vendor/register') &&
      !pathname.startsWith('/vendor/forgot-password') &&
      pathname !== '/vendor') {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Check if token exists and is a vendor
    if (!token || token.userType !== 'vendor') {
      const loginUrl = new URL('/vendor/login', request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      return addSecurityHeaders(redirectResponse);
    }
  }

  // NOTE: Dynamic redirects via Prisma removed - use next.config.js redirects instead
  // Prisma cannot run in Edge Runtime (middleware always runs on edge)
  // Static redirects in next.config.js handle all redirect cases

  // Add security headers to all responses
  const response = NextResponse.next();

  // AMP story routes must be frameable by Google's AMP viewer
  // X-Frame-Options: SAMEORIGIN and frame-ancestors CSP would block Google Search
  const isAmpStoryRoute = /^\/stories\/[^/]+\/amp/.test(pathname);
  if (isAmpStoryRoute) {
    return response; // No security headers for AMP story pages
  }

  // Add CORS headers to all API responses (for mobile app support)
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
