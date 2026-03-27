// @ts-nocheck
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth-options';
import jwt from 'jsonwebtoken';

interface VendorAuthResult {
  authenticated: boolean;
  vendorId?: string;
  email?: string;
  userType?: string;
  error?: string;
}

/**
 * Authenticate vendor from both web session (cookies) and mobile (JWT token)
 * This supports both the web dashboard and mobile app
 */
export async function getVendorAuth(request: NextRequest): Promise<VendorAuthResult> {
  // First, try to get session from cookies (web browser)
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id && (session.user as any).userType === 'vendor') {
      return {
        authenticated: true,
        vendorId: session.user.id,
        email: session.user.email || undefined,
        userType: 'vendor',
      };
    }
  } catch (error) {
    // Session check failed, continue to JWT check
  }

  // If no web session, try JWT token from Authorization header or X-Session-Token (mobile app)
  const authHeader = request.headers.get('Authorization');
  const sessionToken = request.headers.get('X-Session-Token');

  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7); // Remove 'Bearer ' prefix
  } else if (sessionToken) {
    token = sessionToken;
  }

  if (!token) {
    return {
      authenticated: false,
      error: 'Unauthorized - No valid session or token',
    };
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    ) as any;

    if (!decoded.id || (decoded.userType !== 'vendor' && decoded.userType !== 'staff')) {
      return {
        authenticated: false,
        error: 'Invalid token - not a vendor token',
      };
    }

    // For staff tokens, vendorId is stored separately in the token
    const vendorId = decoded.userType === 'staff' ? decoded.vendorId : decoded.id;

    return {
      authenticated: true,
      vendorId,
      email: decoded.email,
      userType: decoded.userType,
    };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return {
        authenticated: false,
        error: 'Token expired - please login again',
      };
    }
    return {
      authenticated: false,
      error: 'Invalid token',
    };
  }
}
