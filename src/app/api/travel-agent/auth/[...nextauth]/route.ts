import { NextRequest, NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { travelAgentAuthOptions } from '@/lib/auth/travel-agent-auth-options';
import { checkRateLimit, RATE_LIMITS, logger } from '@/lib/security';

export const dynamic = 'force-dynamic';

const nextAuthHandler = NextAuth(travelAgentAuthOptions);

async function handler(request: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  if (request.method === 'POST') {
    const { limited, resetIn } = checkRateLimit(
      request,
      RATE_LIMITS.login,
      'travel-agent-auth',
    );

    if (limited) {
      logger.logSecurityEvent('Travel agent auth rate limit exceeded', 'high', {
        ip: request.headers.get('x-forwarded-for'),
      });
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(resetIn) } },
      );
    }
  }

  return nextAuthHandler(request, context);
}

export { handler as GET, handler as POST };
