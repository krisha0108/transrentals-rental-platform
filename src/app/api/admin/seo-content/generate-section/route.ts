import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { generateSingleTarget, GenerateError } from '@/lib/ai/seo-content-generator';
import { SERVICE_LABELS } from '@/lib/ai/prompts/page-content';
import { prisma } from '@/lib/db/prisma';
import type { RewriteTarget, RewriteFieldKey } from '@/lib/ai/prompts/single-section';

// POST — rewrite ONE section or ONE hero/meta field of a (service, city) page.
// Generate-only: returns the new value; the editor merges it into local state and
// the admin saves via the normal Save button. No DB write here (avoids clobbering
// other unsaved edits).
type Body = {
  serviceSlug?: string;
  citySlug?: string;
  target?: RewriteTarget;
  currentContent?: string;
  customInstructions?: string;
  temperature?: number;
};

const VALID_FIELDS: RewriteFieldKey[] = [
  'pageHeading', 'pageDescription', 'metaTitle', 'metaDescription', 'h1Heading',
];

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

  const { serviceSlug, citySlug, target, currentContent, customInstructions, temperature } = body;

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

  // Validate target shape
  if (!target || typeof target !== 'object') {
    return NextResponse.json({ error: 'target required' }, { status: 400 });
  }
  if (target.kind === 'field') {
    if (!VALID_FIELDS.includes(target.field)) {
      return NextResponse.json(
        { error: `Invalid field. Supported: ${VALID_FIELDS.join(', ')}` },
        { status: 400 },
      );
    }
  } else if (target.kind === 'section') {
    if (!target.section || !target.section.id) {
      return NextResponse.json({ error: 'target.section.id required' }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: 'target.kind must be "field" or "section"' }, { status: 400 });
  }

  const dbLocation = await prisma.locations.findFirst({
    where: { slug: citySlug, isActive: true },
    select: { name: true },
  });

  const startedAt = Date.now();
  try {
    const result = await generateSingleTarget({
      serviceSlug,
      citySlug,
      target,
      currentContent,
      customInstructions,
      temperature,
      cityNameFallback: dbLocation?.name,
    });
    return NextResponse.json({
      success: true,
      content: result.content,
      metadata: {
        model: result.model,
        tokens: result.usage,
        elapsedMs: Date.now() - startedAt,
      },
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
}
