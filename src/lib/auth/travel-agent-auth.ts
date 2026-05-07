// @ts-nocheck
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import jwt from 'jsonwebtoken';

interface TravelAgentAuthResult {
  authenticated: boolean;
  travelAgentId?: string;
  email?: string;
  userType?: string;
  status?: string;
  error?: string;
}

/**
 * Authenticate a travel agent from either:
 *   - the web session cookie (`next-auth.session-token-travel-agent`), or
 *   - a Bearer JWT / X-Session-Token header (mobile / API client).
 */
export async function getTravelAgentAuth(request: NextRequest): Promise<TravelAgentAuthResult> {
  // 1) Try the default NextAuth session cookie via getToken()
  // (travel-agent provider lives in the shared authOptions)
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token?.id && token.userType === 'travel_agent') {
      return {
        authenticated: true,
        travelAgentId: token.id as string,
        email: token.email as string | undefined,
        userType: 'travel_agent',
        status: token.status as string | undefined,
      };
    }
  } catch {
    // fall through to JWT header check
  }

  // 2) Fall back to Bearer / X-Session-Token (mobile clients)
  const authHeader = request.headers.get('Authorization');
  const sessionToken = request.headers.get('X-Session-Token');

  let bearer: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    bearer = authHeader.substring(7);
  } else if (sessionToken) {
    bearer = sessionToken;
  }

  if (!bearer) {
    return {
      authenticated: false,
      error: 'Unauthorized - No valid session or token',
    };
  }

  try {
    const decoded = jwt.verify(
      bearer,
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
    ) as any;

    if (!decoded.id || decoded.userType !== 'travel_agent') {
      return {
        authenticated: false,
        error: 'Invalid token - not a travel agent token',
      };
    }

    return {
      authenticated: true,
      travelAgentId: decoded.id,
      email: decoded.email,
      userType: 'travel_agent',
      status: decoded.status,
    };
  } catch (error: any) {
    if (error?.name === 'TokenExpiredError') {
      return { authenticated: false, error: 'Token expired - please login again' };
    }
    return { authenticated: false, error: 'Invalid token' };
  }
}
