import { NextRequest, NextResponse } from 'next/server';
import { getSocialAuth } from '@/lib/auth/social-auth';
import { listComments, addComment, SocialError } from '@/lib/social/service';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const { actor, error } = await getSocialAuth(request);
    if (!actor) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

    const resolved = 'then' in params ? await params : params;
    const result = await listComments(actor, resolved.id);
    return NextResponse.json(result);
  } catch (e: any) {
    if (e instanceof SocialError) return NextResponse.json({ error: e.message }, { status: e.status });
    logger.error('GET /api/social/posts/[id]/comment', e);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const { actor, error } = await getSocialAuth(request);
    if (!actor) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

    const resolved = 'then' in params ? await params : params;
    const body = await request.json();
    const result = await addComment(actor, resolved.id, { content: body?.content });
    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    if (e instanceof SocialError) return NextResponse.json({ error: e.message }, { status: e.status });
    logger.error('POST /api/social/posts/[id]/comment', e);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
