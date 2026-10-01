import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// GET - Views/reactions leaderboard + trend, for the Web Stories analytics dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const days = Math.min(parseInt(searchParams.get('days') || '30', 10) || 30, 90);
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const stories = await prisma.web_stories.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        isPublished: true,
        isFeatured: true,
        publishedAt: true,
        createdAt: true,
        reactions: { select: { reactionType: true } },
        views: { select: { viewedAt: true } },
      },
    });

    let totalViews = 0;
    let totalReactions = 0;
    const byDate: Record<string, number> = {};

    const leaderboard = stories
      .map((s) => {
        const viewCount = s.views.length;
        const reactionCount = s.reactions.length;
        totalViews += viewCount;
        totalReactions += reactionCount;

        for (const v of s.views) {
          if (v.viewedAt >= since) {
            const key = toDateKey(v.viewedAt);
            byDate[key] = (byDate[key] || 0) + 1;
          }
        }

        return {
          id: s.id,
          title: s.title,
          slug: s.slug,
          isPublished: s.isPublished,
          isFeatured: s.isFeatured,
          publishedAt: s.publishedAt?.toISOString() || null,
          views: viewCount,
          reactions: {
            HEART: s.reactions.filter((r) => r.reactionType === 'HEART').length,
            FIRE: s.reactions.filter((r) => r.reactionType === 'FIRE').length,
            THUMBS_UP: s.reactions.filter((r) => r.reactionType === 'THUMBS_UP').length,
            total: reactionCount,
          },
          engagementRate: viewCount > 0 ? Math.round((reactionCount / viewCount) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.views - a.views);

    // Fill in zero-view days so the trend line doesn't skip gaps
    const trend: { date: string; views: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = toDateKey(d);
      trend.push({ date: key, views: byDate[key] || 0 });
    }

    return NextResponse.json({
      success: true,
      totals: {
        totalStories: stories.length,
        totalPublished: stories.filter((s) => s.isPublished).length,
        totalViews,
        totalReactions,
        avgEngagementRate: totalViews > 0 ? Math.round((totalReactions / totalViews) * 1000) / 10 : 0,
      },
      leaderboard,
      trend,
    });
  } catch (error) {
    logger.error('Failed to fetch web story analytics', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
