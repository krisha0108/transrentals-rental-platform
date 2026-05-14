import { NextRequest, NextResponse } from 'next/server';
import { getSocialAuth } from '@/lib/auth/social-auth';
import { getConversationMessages, sendMessage, ChatError } from '@/lib/social/chat-service';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> | { id: string } };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { actor, error } = await getSocialAuth(request);
    if (!actor) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    const { id } = 'then' in params ? await params : params;
    const result = await getConversationMessages(actor, id);
    return NextResponse.json(result);
  } catch (e: any) {
    if (e instanceof ChatError) return NextResponse.json({ error: e.message }, { status: e.status });
    logger.error('GET /api/social/chat/conversations/[id]/messages', e);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { actor, error } = await getSocialAuth(request);
    if (!actor) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    const { id } = 'then' in params ? await params : params;
    const { content } = await request.json();
    const result = await sendMessage(actor, id, content);
    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    if (e instanceof ChatError) return NextResponse.json({ error: e.message }, { status: e.status });
    logger.error('POST /api/social/chat/conversations/[id]/messages', e);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
