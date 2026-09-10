// Aggregate views over the already-synced social_media_posts /
// social_media_daily_stats rows — everything here is a read/rollup of real
// synced data, nothing fetched fresh from Meta. Kept separate from sync.ts
// (which pulls from Meta and writes) so this file only ever queries.

import { prisma } from '@/lib/db/prisma';

export { getDateRange } from '@/lib/manager-performance';

// Applies to a post's publishedAt — "today's posts", "this week's posts",
// etc. Deliberately NOT applied to follower history or posting frequency
// below: those are inherently multi-day trend/cadence views, and scoping a
// trend line to "today" would just leave one point.
export type DateFilterObj = { publishedAt: { gte?: Date; lte?: Date; lt?: Date } } | {};

export interface TopPost {
  id: string;
  platform: 'FACEBOOK' | 'INSTAGRAM';
  caption: string | null;
  permalink: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  publishedAt: Date;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  engagementTotal: number;
  accountName: string;
}

export interface PlatformSummary {
  platform: 'FACEBOOK' | 'INSTAGRAM';
  postCount: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgReach: number | null;
  totalLikes: number;
  totalComments: number;
}

export interface FollowerHistoryPoint {
  date: string; // YYYY-MM-DD
  followerCount: number;
}

export interface PostingFrequencyPoint {
  weekStart: string; // YYYY-MM-DD, Monday
  count: number;
}

// Simple, transparent ranking — no platform-specific weighting (a Facebook
// share and an Instagram like count the same) since the two engagement
// vocabularies aren't directly comparable anyway; this is "what got the
// most total reactions", not a modeled virality score.
function engagementTotal(p: { likeCount: number; commentCount: number; shareCount: number }) {
  return p.likeCount + p.commentCount + p.shareCount;
}

export async function getTopPosts(limit = 10, dateFilterObj: DateFilterObj = {}): Promise<TopPost[]> {
  const posts = await prisma.social_media_posts.findMany({
    where: dateFilterObj,
    include: { account: { select: { pageName: true, igUsername: true } } },
    orderBy: [{ likeCount: 'desc' }], // pre-sort at the DB level to cap what we pull before the JS re-sort below
    take: 200,
  });

  return posts
    .map((p) => ({
      id: p.id,
      platform: p.platform,
      caption: p.caption,
      permalink: p.permalink,
      mediaUrl: p.mediaUrl,
      thumbnailUrl: p.thumbnailUrl,
      publishedAt: p.publishedAt,
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      shareCount: p.shareCount,
      engagementTotal: engagementTotal(p),
      accountName: p.platform === 'INSTAGRAM' && p.account.igUsername ? `@${p.account.igUsername}` : p.account.pageName,
    }))
    .sort((a, b) => b.engagementTotal - a.engagementTotal)
    .slice(0, limit);
}

export async function getPlatformSummary(dateFilterObj: DateFilterObj = {}): Promise<PlatformSummary[]> {
  const grouped = await prisma.social_media_posts.groupBy({
    by: ['platform'],
    where: dateFilterObj,
    _count: { _all: true },
    _avg: { likeCount: true, commentCount: true, shareCount: true, reach: true },
    _sum: { likeCount: true, commentCount: true },
  });

  return grouped.map((g) => ({
    platform: g.platform,
    postCount: g._count._all,
    avgLikes: Math.round(g._avg.likeCount || 0),
    avgComments: Math.round(g._avg.commentCount || 0),
    avgShares: Math.round(g._avg.shareCount || 0),
    avgReach: g._avg.reach != null ? Math.round(g._avg.reach) : null,
    totalLikes: g._sum.likeCount || 0,
    totalComments: g._sum.commentCount || 0,
  }));
}

// Summed across every connected account for that day — a single "total
// audience" line rather than one line per account, since with 1-2 accounts
// per platform the per-account split isn't worth the extra chart noise yet.
export async function getFollowerHistory(days = 30): Promise<FollowerHistoryPoint[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const rows = await prisma.social_media_daily_stats.findMany({
    where: { date: { gte: since } },
    orderBy: { date: 'asc' },
    select: { date: true, followerCount: true },
  });

  const byDate = new Map<string, number>();
  for (const row of rows) {
    const key = row.date.toISOString().slice(0, 10);
    byDate.set(key, (byDate.get(key) || 0) + (row.followerCount || 0));
  }

  return [...byDate.entries()].map(([date, followerCount]) => ({ date, followerCount }));
}

// Monday-anchored week buckets over the last N weeks, counted from each
// post's publishedAt — shows whether posting has actually kept a steady
// cadence or gone quiet, which "total posts synced" alone can't tell you.
export async function getPostingFrequency(weeks = 8): Promise<PostingFrequencyPoint[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - weeks * 7);

  const posts = await prisma.social_media_posts.findMany({
    where: { publishedAt: { gte: since } },
    select: { publishedAt: true },
  });

  const weekStart = (d: Date) => {
    const day = (d.getUTCDay() + 6) % 7; // Monday = 0
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
    return monday.toISOString().slice(0, 10);
  };

  const byWeek = new Map<string, number>();
  for (const p of posts) {
    const key = weekStart(p.publishedAt);
    byWeek.set(key, (byWeek.get(key) || 0) + 1);
  }

  return [...byWeek.entries()].map(([weekStartDate, count]) => ({ weekStart: weekStartDate, count })).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export async function getSocialAnalytics(dateFilterObj: DateFilterObj = {}) {
  const [topPosts, platformSummary, followerHistory, postingFrequency] = await Promise.all([
    getTopPosts(10, dateFilterObj),
    getPlatformSummary(dateFilterObj),
    getFollowerHistory(30),
    getPostingFrequency(8),
  ]);
  return { topPosts, platformSummary, followerHistory, postingFrequency };
}
