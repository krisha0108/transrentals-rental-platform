import { NextRequest, NextResponse } from 'next/server';
import { getSocialAuth } from '@/lib/auth/social-auth';
import { listConversations, getOrCreateConversation, ChatError } from '@/lib/social/chat-service';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { actor, error } = await getSocialAuth(request);
    if (!actor) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    const result = await listConversations(actor);
    return NextResponse.json(result);
  } catch (e: any) {
    if (e instanceof ChatError) return NextResponse.json({ error: e.message }, { status: e.status });
    logger.error('GET /api/social/chat/conversations', e);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST body: { otherType: 'vendor' | 'agent', otherId: string }
//   — or legacy shape { otherVendorId } / { otherAgentId } for back-compat
export async function POST(request: NextRequest) {
  try {
    const { actor, error } = await getSocialAuth(request);
    if (!actor) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    let otherType: 'vendor' | 'agent' | null = body.otherType ?? null;
    let otherId: string | null = body.otherId ?? null;
    if (!otherId && body.otherVendorId) { otherType = 'vendor'; otherId = body.otherVendorId; }
    if (!otherId && body.otherAgentId)  { otherType = 'agent';  otherId = body.otherAgentId; }
    if (!otherType || !otherId) {
      return NextResponse.json({ error: 'otherType + otherId required' }, { status: 400 });
    }

    const result = await getOrCreateConversation(actor, { type: otherType, id: otherId });
    return NextResponse.json(result);
  } catch (e: any) {
    if (e instanceof ChatError) return NextResponse.json({ error: e.message }, { status: e.status });
    logger.error('POST /api/social/chat/conversations', e);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
