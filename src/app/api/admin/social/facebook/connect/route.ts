// GET — kicks off the Facebook OAuth dialog so an admin can connect a
// Facebook Page (and its linked Instagram Business account, if any).
// The actual token exchange + account creation happens in ./callback.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import { buildFacebookOAuthUrl, isMetaAppConfigured } from '@/lib/social/meta-graph';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  const admin = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
  if (!admin || !['SUPER_ADMIN', 'ADMIN'].includes(admin.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  if (!isMetaAppConfigured()) {
    return NextResponse.redirect(new URL('/admin/social?error=not_configured', request.url));
  }

  // Random state, stored in a short-lived cookie so the callback can confirm
  // this exact browser initiated the flow (basic CSRF protection for OAuth).
  const state = crypto.randomBytes(24).toString('hex');
  const response = NextResponse.redirect(buildFacebookOAuthUrl(state));
  response.cookies.set('fb_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return response;
}
