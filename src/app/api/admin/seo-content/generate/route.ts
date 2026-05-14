import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import {
  generatePageContent,
  generateSectionsContent,
  contentToDbFields,
  GenerateError,
} from '@/lib/ai/seo-content-generator';
import { SERVICE_LABELS } from '@/lib/ai/prompts/page-content';
import type { SectionConfig } from '@/lib/city-sections';

type Body = {
  serviceSlug?: string;
  citySlug?: string;
  customInstructions?: string;
  save?: boolean;
  temperature?: number;
  /** "legacy" = old structured 6-field; "sections" = new block-based. Default "legacy" for back-compat. */
  format?: 'legacy' | 'sections';
  /** Optional section list to drive sections-mode generation; if omitted, defaults are used. */
  sections?: SectionConfig[];
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { serviceSlug, citySlug, customInstructions, save, temperature, format = 'legacy', sections } = body;

  if (!serviceSlug || typeof serviceSlug !== 'string') {
    return NextResponse.json({ error: 'serviceSlug required' }, { status: 400 });
  }
  if (!citySlug || typeof citySlug !== 'string') {
    return NextResponse.json({ error: 'citySlug required' }, { status: 400 });
  }
  if (!(serviceSlug in SERVICE_LABELS)) {
    return NextResponse.json(
      { error: `Unknown serviceSlug. Supported: ${Object.keys(SERVICE_LABELS).join(', ')}` },
      { status: 400 },
    );
  }

  const startedAt = Date.now();
  const userId = (session.user as any)?.id ?? null;
  const editor = userId ? `admin:${userId}` : 'ai';

  if (format === 'sections') {
    let result;
    try {
      result = await generateSectionsContent({
        serviceSlug,
        citySlug,
        sections,
        customInstructions,
        temperature,
      });
    } catch (err) {
      if (err instanceof GenerateError) {
        return NextResponse.json({ error: err.message }, { status: 422 });
      }
      return NextResponse.json(
        { error: `Generation failed: ${(err as Error).message}` },
        { status: 500 },
      );
    }
    const elapsedMs = Date.now() - startedAt;
    const sectionsConfigJson = JSON.stringify(result.sectionsConfig);

    let savedId: string | null = null;
    if (save) {
      const row = await prisma.service_city_content.upsert({
        where: { serviceSlug_citySlug: { serviceSlug, citySlug } },
        create: {
          serviceSlug,
          citySlug,
          sectionsConfig: sectionsConfigJson,
          metaTitle: result.payload.metaTitle,
          metaDescription: result.payload.metaDescription,
          h1Heading: result.payload.h1Heading,
          status: 'ai_generated',
          source: 'ai',
          aiPrompt: customInstructions ?? null,
          aiModel: result.model,
          aiTokensUsed: result.usage.totalTokens,
          lastAiUpdate: new Date(),
          lastEditedBy: editor,
        },
        update: {
          sectionsConfig: sectionsConfigJson,
          metaTitle: result.payload.metaTitle,
          metaDescription: result.payload.metaDescription,
          h1Heading: result.payload.h1Heading,
          status: 'ai_generated',
          source: 'ai',
          aiPrompt: customInstructions ?? null,
          aiModel: result.model,
          aiTokensUsed: result.usage.totalTokens,
          lastAiUpdate: new Date(),
          lastEditedBy: editor,
        },
        select: { id: true },
      });
      savedId = row.id;
      try { revalidatePath(`/${serviceSlug}/${citySlug}`); } catch {}
    }

    return NextResponse.json({
      success: true,
      saved: save === true,
      savedId,
      format: 'sections',
      serviceSlug,
      citySlug,
      sectionsConfig: sectionsConfigJson,
      payload: result.payload,
      metadata: {
        model: result.model,
        tokens: result.usage,
        elapsedMs,
        cityTerrain: result.cityContext.terrain,
        cityTier: result.cityContext.tier,
      },
    });
  }

  // ── Legacy format (back-compat with existing bulk-generate-top-pages) ─────
  let result;
  try {
    result = await generatePageContent({
      serviceSlug,
      citySlug,
      customInstructions,
      temperature,
    });
  } catch (err) {
    if (err instanceof GenerateError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json(
      { error: `Generation failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  const elapsedMs = Date.now() - startedAt;

  let savedId: string | null = null;
  if (save) {
    const dbFields = contentToDbFields(result.content);
    const row = await prisma.service_city_content.upsert({
      where: { serviceSlug_citySlug: { serviceSlug, citySlug } },
      create: {
        serviceSlug,
        citySlug,
        ...dbFields,
        status: 'ai_generated',
        source: 'ai',
        aiPrompt: customInstructions ?? null,
        aiModel: result.model,
        aiTokensUsed: result.usage.totalTokens,
        lastAiUpdate: new Date(),
        lastEditedBy: editor,
      },
      update: {
        ...dbFields,
        status: 'ai_generated',
        source: 'ai',
        aiPrompt: customInstructions ?? null,
        aiModel: result.model,
        aiTokensUsed: result.usage.totalTokens,
        lastAiUpdate: new Date(),
        lastEditedBy: editor,
      },
      select: { id: true },
    });
    savedId = row.id;
    try { revalidatePath(`/${serviceSlug}/${citySlug}`); } catch {}
  }

  return NextResponse.json({
    success: true,
    saved: save === true,
    savedId,
    format: 'legacy',
    serviceSlug,
    citySlug,
    content: result.content,
    metadata: {
      model: result.model,
      tokens: result.usage,
      elapsedMs,
      cityTerrain: result.cityContext.terrain,
      cityTier: result.cityContext.tier,
    },
  });
}
