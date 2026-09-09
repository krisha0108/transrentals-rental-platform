// GET — Facebook redirects here with `code` (or an `error`) after the admin
// approves the OAuth dialog from ./connect. Exchanges the code for a
// long-lived user token, lists every Page the admin manages, and upserts one
// social_media_accounts row per Page (plus its linked Instagram Business
// account, if any) so /admin/social can start syncing them.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import {
  exchangeCodeForUserToken,
  exchangeForLongLivedUserToken,
  listManagedPages,
  getInstagramAccountInfo,
  getFacebookPageFollowerCount,
  getAppBaseUrl,
} from '@/lib/social/meta-graph';

export const dynamic = 'force-dynamic';

function redirectWithStatus(status: string) {
  return NextResponse.redirect(new URL(`/admin/social?status=${status}`, getAppBaseUrl()));
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(new URL('/admin/login', getAppBaseUrl()));
  }
  const admin = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
  if (!admin || !['SUPER_ADMIN', 'ADMIN'].includes(admin.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const error = searchParams.get('error');
  if (error) {
    logger.error('Facebook OAuth denied/errored', { error, description: searchParams.get('error_description') });
    return redirectWithStatus('denied');
  }

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const expectedState = request.cookies.get('fb_oauth_state')?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithStatus('invalid_state');
  }

  try {
    const shortLived = await exchangeCodeForUserToken(code);
    const longLived = await exchangeForLongLivedUserToken(shortLived.access_token);
    const pages = await listManagedPages(longLived.access_token);

    if (pages.length === 0) {
      return redirectWithStatus('no_pages');
    }

    for (const page of pages) {
      const followerCount = await getFacebookPageFollowerCount(page.id, page.access_token).catch(() => null);

      let igBusinessAccountId: string | null = null;
      let igUsername: string | null = null;
      if (page.instagram_business_account?.id) {
        igBusinessAccountId = page.instagram_business_account.id;
        const igInfo = await getInstagramAccountInfo(igBusinessAccountId, page.access_token).catch(() => null);
        igUsername = igInfo?.username || null;
      }

      await prisma.social_media_accounts.upsert({
        where: { platform_pageId: { platform: 'FACEBOOK', pageId: page.id } },
        create: {
          platform: 'FACEBOOK',
          pageId: page.id,
          pageName: page.name,
          igBusinessAccountId,
          igUsername,
          profilePictureUrl: page.picture?.data?.url || null,
          accessToken: page.access_token,
          followerCount,
          connectedById: admin.id,
        },
        update: {
          pageName: page.name,
          igBusinessAccountId,
          igUsername,
          profilePictureUrl: page.picture?.data?.url || null,
          accessToken: page.access_token,
          followerCount,
          isActive: true,
        },
      });
    }

    const response = redirectWithStatus('connected');
    response.cookies.delete('fb_oauth_state');
    return response;
  } catch (err: any) {
    logger.error('Facebook OAuth callback failed', err);
    return redirectWithStatus('failed');
  }
}
