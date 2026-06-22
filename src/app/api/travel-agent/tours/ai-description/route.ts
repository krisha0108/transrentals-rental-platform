import { NextRequest, NextResponse } from 'next/server';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import { complete, DeepseekError } from '@/lib/ai/deepseek-client';

// POST /api/travel-agent/tours/ai-description
// mode "short" (default) → one catchy line ≤ 120 chars (detailed tour cards).
// mode "full"            → comprehensive tour description ≤ 100 words covering
//                          highlights, experience, inclusions feel, and price context.
export async function POST(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title     = String(body?.title     || '').trim();
    const destination = String(body?.destination || '').trim();
    const duration  = String(body?.duration  || '').trim();
    const basePrice = String(body?.basePrice || '').trim();
    const mode      = body?.mode === 'full' ? 'full' : 'short';

    if (!title) {
      return NextResponse.json(
        { error: 'Add a tour title first — AI uses it to write the description.' },
        { status: 400 },
      );
    }

    const ctxLines = [
      `Tour title: ${title}`,
      destination ? `Destination: ${destination}` : '',
      duration    ? `Duration: ${duration}`        : '',
      basePrice   ? `Price: ₹${basePrice} per person` : '',
    ].filter(Boolean).join('\n');

    let systemPrompt: string;
    let userPrompt: string;
    let maxTokens: number;

    if (mode === 'full') {
      systemPrompt =
        'You are an expert Indian travel copywriter. Write a rich, engaging tour description for a travel agent\'s listing. ' +
        'The description must: cover what the traveller will experience, highlight key attractions or activities, mention the destination feel, ' +
        'and reflect the price/duration context naturally. ' +
        'Use plain prose — no bullet points, no headers, no emojis, no quotes. ' +
        'Write between 80 and 100 words. Make every word count — vivid, specific, and persuasive.';
      userPrompt = `Write a full tour description for this package:\n${ctxLines}`;
      maxTokens  = 200;
    } else {
      systemPrompt =
        'You are a travel copywriter for an Indian tours marketplace. Write ONE catchy, vivid, single-line short description for a tour package. ' +
        'Hard limit 120 characters. No quotes, no emojis, no hashtags, no line breaks — just one plain sentence that makes travellers want to book.';
      userPrompt = `Write a short description for this tour:\n${ctxLines}`;
      maxTokens  = 80;
    }

    const result = await complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      temperature: 0.8,
      maxTokens,
    });

    let description = (result.content || '').trim().replace(/^["']+|["']+$/g, '').replace(/\s+/g, ' ');

    if (mode === 'short' && description.length > 120) {
      description = description.slice(0, 117).trimEnd() + '…';
    }

    if (!description) {
      return NextResponse.json({ error: 'AI returned an empty description. Try again.' }, { status: 502 });
    }

    return NextResponse.json({ description });
  } catch (error: any) {
    const status = error instanceof DeepseekError ? 502 : 500;
    return NextResponse.json(
      { error: error?.message || 'Failed to generate description' },
      { status },
    );
  }
}
