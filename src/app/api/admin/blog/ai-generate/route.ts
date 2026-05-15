import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { complete, parseJsonResponse, DeepseekError } from '@/lib/ai/deepseek-client';
import logger from '@/lib/security/logger';

const SYSTEM_PROMPT = `You are an expert SEO blog writer for TransRentals — India's vehicle rental marketplace. You write engaging, well-researched blog posts that rank on Google and genuinely help readers.

BRAND VOICE:
- Professional, trustworthy, helpful
- Indian English: use "on rent", "outstation", "cab", "tempo traveller" naturally
- Include real, specific details (city names, prices in ₹, vehicle models, routes)
- Practical tips users can actually use

OUTPUT FORMAT — strict JSON, no preamble, no markdown fences:
{
  "title": "SEO-optimized blog post title (50-70 chars)",
  "excerpt": "Compelling summary shown in listing pages (140-160 chars)",
  "content": "Full blog post as clean HTML using <h2>, <h3>, <p>, <ul>/<ol>/<li>, <strong>, <em>, <blockquote>. Minimum 700 words. NO <h1> tags. NO <script> or <style> tags.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seo": {
    "metaTitle": "~60 char meta title for Google (include primary keyword)",
    "metaDescription": "~155 char meta description for Google (natural, include keyword)",
    "metaKeywords": "keyword1, keyword2, keyword3, keyword4"
  }
}

Generate ONLY the JSON object. No preamble, no code fences, no explanation outside the JSON.`;

interface AiGenerateBody {
  topic?: string;
  service?: string;
  keywords?: string;
  suggestions?: string;
  tone?: string;
}

function buildUserPrompt({ topic, service, keywords, suggestions, tone }: AiGenerateBody): string {
  const lines: string[] = [];

  if (topic) lines.push(`TOPIC / TITLE IDEA: ${topic}`);
  if (service) lines.push(`SERVICE / NICHE: ${service}`);
  if (keywords) lines.push(`TARGET KEYWORDS (weave these in naturally): ${keywords}`);
  if (suggestions) lines.push(`ADDITIONAL INSTRUCTIONS FROM ADMIN: ${suggestions}`);
  lines.push(`WRITING TONE: ${tone || 'informative and helpful'}`);
  lines.push('');
  lines.push(
    'Write a comprehensive, SEO-optimized blog post for TransRentals. ' +
    'The article should genuinely help Indian readers make smarter vehicle rental decisions. ' +
    'Use real place names, ₹ pricing, specific vehicle models, and actionable tips. ' +
    'Structure with clear H2 sections and H3 sub-sections where needed.'
  );

  return lines.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body: AiGenerateBody = await request.json();
    const { topic, service, keywords, suggestions, tone } = body;

    if (!topic?.trim() && !keywords?.trim() && !service?.trim()) {
      return NextResponse.json(
        { error: 'Provide at least a topic, service, or keywords to generate from.' },
        { status: 400 }
      );
    }

    const result = await complete({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt({ topic, service, keywords, suggestions, tone }) },
      ],
      temperature: 0.75,
      maxTokens: 4096,
      responseFormat: 'json_object',
      timeoutMs: 90_000,
    });

    const parsed = parseJsonResponse<{
      title: string;
      excerpt: string;
      content: string;
      tags: string[];
      seo: { metaTitle: string; metaDescription: string; metaKeywords: string };
    }>(result.content);

    return NextResponse.json({ success: true, post: parsed, usage: result.usage });
  } catch (err) {
    if (err instanceof DeepseekError) {
      logger.error('DeepSeek blog generation failed', err);
      return NextResponse.json({ error: `AI error: ${err.message}` }, { status: 502 });
    }
    logger.error('Blog AI generate endpoint failed', err);
    return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 });
  }
}
