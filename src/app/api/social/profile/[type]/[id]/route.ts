// Cross-type social profile endpoint. Returns profile info + recent posts
// for either a vendor or a travel agent. Used by /<role>/social/profile/[type]/[id]
// pages to render network profiles from anywhere on the network.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSocialAuth } from '@/lib/auth/social-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// social_posts.images is stored as a JSON-string array of URLs. Parse safely.
function parseImages(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const arr = JSON.parse(val);
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch {
    return [];
  }
}

type Params = {
  params: Promise<{ type: string; id: string }> | { type: string; id: string };
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { actor, error } = await getSocialAuth(request);
    if (!actor) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

    const resolved = 'then' in params ? await params : params;
    const type = resolved.type;
    const id = resolved.id;
    if (type !== 'vendor' && type !== 'agent') {
      return NextResponse.json({ error: 'Invalid profile type' }, { status: 400 });
    }

    const isMe = actor.type === type && actor.id === id;

    let profile: any = null;
    if (type === 'vendor') {
      const v = await prisma.vendors.findUnique({
        where: { id },
        select: {
          id: true, businessName: true, ownerName: true, logo: true,
          city: true, state: true, description: true, createdAt: true,
        },
      });
      if (!v) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
      profile = {
        type: 'vendor', id: v.id, displayName: v.businessName,
        ownerName: v.ownerName, logo: v.logo, city: v.city, state: v.state,
        description: v.description, createdAt: v.createdAt,
      };
    } else {
      const a = await prisma.travel_agents.findUnique({
        where: { id },
        select: {
          id: true, agencyName: true, ownerName: true, logo: true,
          city: true, state: true, description: true, createdAt: true,
        },
      });
      if (!a) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      profile = {
        type: 'agent', id: a.id, displayName: a.agencyName,
        ownerName: a.ownerName, logo: a.logo, city: a.city, state: a.state,
        description: a.description, createdAt: a.createdAt,
      };
    }

    const postsWhere = type === 'vendor' ? { vendorId: id } : { agentId: id };

    const [postsCount, posts] = await Promise.all([
      prisma.social_posts.count({ where: { ...postsWhere, isActive: true } }),
      prisma.social_posts.findMany({
        where: { ...postsWhere, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          category: { select: { id: true, name: true, isSOS: true } },
          _count: { select: { social_post_likes: true, social_post_comments: true } },
        },
      }),
    ]);

    const enrichedPosts = posts.map((p: any) => ({
      id: p.id,
      content: p.content,
      images: parseImages(p.images),
      createdAt: p.createdAt,
      category: p.category,
      likesCount: p._count.social_post_likes,
      commentsCount: p._count.social_post_comments,
    }));

    return NextResponse.json({
      profile: { ...profile, postsCount, isMe },
      posts: enrichedPosts,
    });
  } catch (e: any) {
    logger.error('GET /api/social/profile/[type]/[id]', e);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
