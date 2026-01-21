import { NextRequest, NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { checkRateLimit, RATE_LIMITS, logger } from '@/lib/security';

export const dynamic = 'force-dynamic';

const nextAuthHandler = NextAuth(authOptions);

// Wrap with rate limiting for POST (login attempts)
async function handler(request: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  // Only rate limit POST requests (login attempts)
  if (request.method === 'POST') {
    const { limited, resetIn } = checkRateLimit(
      request,
      RATE_LIMITS.login,
      'admin-auth'
    );

    if (limited) {
      logger.logSecurityEvent('Admin auth rate limit exceeded', 'high', {
        ip: request.headers.get('x-forwarded-for'),
      });
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(resetIn) } }
      );
    }
  }

  return nextAuthHandler(request, context);
}

export { handler as GET, handler as POST };
