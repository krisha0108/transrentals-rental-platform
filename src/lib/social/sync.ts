// Pulls fresh posts + insights for one connected social_media_accounts row
// from the Meta Graph API and upserts them locally. Shared by the manual
// "Sync Now" button (/api/admin/social/sync) and any future scheduled job.

import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import {
  getFacebookPageFollowerCount,
  listFacebookPagePosts,
  getFacebookPostInsights,
  getInstagramAccountInfo,
  listInstagramMedia,
  getInstagramMediaInsights,
} from '@/lib/social/meta-graph';

export interface SyncResult {
  accountId: string;
  pageName: string;
  postsSynced: number;
  error?: string;
}

async function syncFacebookAccount(account: { id: string; pageId: string; accessToken: string }): Promise<number> {
  const posts = await listFacebookPagePosts(account.pageId, account.accessToken);
  let synced = 0;
  for (const post of posts) {
    const insights = await getFacebookPostInsights(post.id, account.accessToken);
    await prisma.social_media_posts.upsert({
      where: { accountId_externalId: { accountId: account.id, externalId: post.id } },
      create: {
        accountId: account.id,
        platform: 'FACEBOOK',
        externalId: post.id,
        mediaType: post.full_picture ? 'PHOTO' : 'STATUS',
        caption: post.message || null,
        permalink: post.permalink_url || null,
        mediaUrl: post.full_picture || null,
        publishedAt: new Date(post.created_time),
        likeCount: post.likes?.summary?.total_count ?? 0,
        commentCount: post.comments?.summary?.total_count ?? 0,
        shareCount: post.shares?.count ?? 0,
        impressions: insights.impressions,
        engagement: insights.engagement,
      },
      update: {
        caption: post.message || null,
        likeCount: post.likes?.summary?.total_count ?? 0,
        commentCount: post.comments?.summary?.total_count ?? 0,
        shareCount: post.shares?.count ?? 0,
        impressions: insights.impressions,
        engagement: insights.engagement,
        lastSyncedAt: new Date(),
      },
    });
    synced += 1;
  }
  return synced;
}

async function syncInstagramAccount(account: { id: string; igBusinessAccountId: string; accessToken: string }): Promise<number> {
  const media = await listInstagramMedia(account.igBusinessAccountId, account.accessToken);
  let synced = 0;
  for (const item of media) {
    const insights = await getInstagramMediaInsights(item.id, item.media_type, account.accessToken);
    await prisma.social_media_posts.upsert({
      where: { accountId_externalId: { accountId: account.id, externalId: item.id } },
      create: {
        accountId: account.id,
        platform: 'INSTAGRAM',
        externalId: item.id,
        mediaType: item.media_type,
        caption: item.caption || null,
        permalink: item.permalink || null,
        mediaUrl: item.media_url || null,
        thumbnailUrl: item.thumbnail_url || null,
        publishedAt: new Date(item.timestamp),
        likeCount: item.like_count ?? 0,
        commentCount: item.comments_count ?? 0,
        savedCount: insights.saved,
        impressions: insights.impressions,
        reach: insights.reach,
        engagement: insights.engagement,
      },
      update: {
        caption: item.caption || null,
        likeCount: item.like_count ?? 0,
        commentCount: item.comments_count ?? 0,
        savedCount: insights.saved,
        impressions: insights.impressions,
        reach: insights.reach,
        engagement: insights.engagement,
        lastSyncedAt: new Date(),
      },
    });
    synced += 1;
  }
  return synced;
}

// One connected Page can yield BOTH a Facebook post feed and (if it has a
// linked Instagram Business account) an Instagram media feed — both get
// synced together since they share the same stored Page access token.
export async function syncAccount(accountId: string): Promise<SyncResult> {
  const account = await prisma.social_media_accounts.findUnique({ where: { id: accountId } });
  if (!account) throw new Error('Account not found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    let postsSynced = 0;
    let followerCount: number | null = account.followerCount;

    if (account.platform === 'FACEBOOK') {
      postsSynced += await syncFacebookAccount(account);
      followerCount = await getFacebookPageFollowerCount(account.pageId, account.accessToken).catch(() => followerCount);

      if (account.igBusinessAccountId) {
        postsSynced += await syncInstagramAccount({
          id: account.id,
          igBusinessAccountId: account.igBusinessAccountId,
          accessToken: account.accessToken,
        });
        const igInfo = await getInstagramAccountInfo(account.igBusinessAccountId, account.accessToken).catch(() => null);
        if (igInfo?.followers_count != null) {
          // Instagram follower count takes priority for display when present —
          // it's the number that actually matters to whoever's checking "IG performance".
          followerCount = igInfo.followers_count;
        }
      }
    }

    await prisma.social_media_accounts.update({
      where: { id: account.id },
      data: { followerCount, lastSyncedAt: new Date(), lastSyncError: null },
    });

    await prisma.social_media_daily_stats.upsert({
      where: { accountId_date: { accountId: account.id, date: today } },
      create: { accountId: account.id, date: today, followerCount },
      update: { followerCount },
    });

    return { accountId: account.id, pageName: account.pageName, postsSynced };
  } catch (err: any) {
    const message = err?.message || 'Sync failed';
    logger.error('Social media account sync failed', { accountId, message });
    await prisma.social_media_accounts.update({
      where: { id: account.id },
      data: { lastSyncError: message, lastSyncedAt: new Date() },
    });
    return { accountId: account.id, pageName: account.pageName, postsSynced: 0, error: message };
  }
}

export async function syncAllActiveAccounts(): Promise<SyncResult[]> {
  const accounts = await prisma.social_media_accounts.findMany({ where: { isActive: true }, select: { id: true } });
  const results: SyncResult[] = [];
  for (const account of accounts) {
    results.push(await syncAccount(account.id));
  }
  return results;
}
