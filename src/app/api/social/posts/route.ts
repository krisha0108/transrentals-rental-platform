import { NextRequest, NextResponse } from 'next/server';
import { getSocialAuth } from '@/lib/auth/social-auth';
import { getFeed, createPost, SocialError } from '@/lib/social/service';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { actor, error } = await getSocialAuth(request);
    if (!actor) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const result = await getFeed(actor, {
      type: searchParams.get('type'),
      cursor: searchParams.get('cursor'),
      categoryId: searchParams.get('categoryId'),
    });
    return NextResponse.json(result);
  } catch (e: any) {
    if (e instanceof SocialError) return NextResponse.json({ error: e.message }, { status: e.status });
    logger.error('GET /api/social/posts', e);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { actor, error } = await getSocialAuth(request);
    if (!actor) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const result = await createPost(actor, { content: body?.content, categoryId: body?.categoryId });
    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    if (e instanceof SocialError) return NextResponse.json({ error: e.message }, { status: e.status });
    logger.error('POST /api/social/posts', e);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
