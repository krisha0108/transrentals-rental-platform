import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { complete, parseJsonResponse, DeepseekError } from '@/lib/ai/deepseek-client';
import logger from '@/lib/security/logger';

const SYSTEM_PROMPT = `You are an SEO strategist for TransRentals — India's vehicle rental marketplace.
Suggest blog topics that will rank on Google, drive organic traffic, and convert readers into bookings.

OUTPUT FORMAT — strict JSON, no preamble, no fences:
{
  "topics": [
    { "title": "Exact blog post title (50-70 chars)", "why": "One sentence on why this ranks / what intent it serves" },
    ...
  ]
}

Generate exactly 6 topics. Mix of: how-to guides, comparison posts, travel guides, cost guides, tips & tricks.
Generate ONLY the JSON.`;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { service, keywords, city } = body;

    const contextLines: string[] = [];
    if (service) contextLines.push(`SERVICE / NICHE: ${service}`);
    if (keywords) contextLines.push(`KEYWORDS / THEMES: ${keywords}`);
    if (city) contextLines.push(`TARGET CITY: ${city}`);
    if (!contextLines.length) contextLines.push('NICHE: vehicle rental in India (bikes, cars, buses, tempo travellers)');

    const userPrompt = `${contextLines.join('\n')}\n\nSuggest 6 blog post topics for TransRentals that will rank on Google India and attract people looking to rent vehicles. Mix different content types (travel guide, cost guide, comparison, tips, FAQ-style).`;

    const result = await complete({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.85,
      maxTokens: 800,
      responseFormat: 'json_object',
      timeoutMs: 30_000,
    });

    const parsed = parseJsonResponse<{ topics: { title: string; why: string }[] }>(result.content);

    return NextResponse.json({ success: true, topics: parsed.topics || [] });
  } catch (err) {
    if (err instanceof DeepseekError) {
      logger.error('DeepSeek topic suggest failed', err);
      return NextResponse.json({ error: `AI error: ${err.message}` }, { status: 502 });
    }
    logger.error('Topic suggest endpoint failed', err);
    return NextResponse.json({ error: 'Failed to suggest topics. Please try again.' }, { status: 500 });
  }
}
