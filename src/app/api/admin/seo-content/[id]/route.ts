import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { SERVICE_LABELS } from '@/lib/ai/prompts/page-content';
import { buildCityContext } from '@/lib/ai/city-context';

function parseJson<T = unknown>(s: string | null): T | null {
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}

function stringifyOrKeep(value: unknown): string | null {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const row = await prisma.service_city_content.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const cityCtx = buildCityContext(row.citySlug);

  return NextResponse.json({
    id: row.id,
    serviceSlug: row.serviceSlug,
    serviceLabel: SERVICE_LABELS[row.serviceSlug]?.label ?? row.serviceSlug,
    citySlug: row.citySlug,
    cityName: cityCtx?.name ?? row.citySlug,
    cityState: cityCtx?.state ?? null,
    cityTier: cityCtx?.tier ?? null,
    cityTerrain: cityCtx?.terrain ?? null,
    content: {
      intro: row.intro,
      whyChooseUs: parseJson(row.whyChooseUs) ?? [],
      popularVehicles: parseJson(row.popularVehicles) ?? [],
      servicesOffered: parseJson(row.servicesOffered) ?? [],
      faqs: parseJson(row.faqs) ?? [],
      tips: parseJson(row.tips) ?? [],
      routes: parseJson(row.routes) ?? [],
      metaTitle: row.metaTitle,
      metaDescription: row.metaDescription,
      metaKeywords: row.metaKeywords,
      h1Heading: row.h1Heading,
    },
    workflow: {
      status: row.status,
      source: row.source,
      autoUpdate: row.autoUpdate,
      publishedAt: row.publishedAt?.toISOString() ?? null,
    },
    ai: {
      model: row.aiModel,
      prompt: row.aiPrompt,
      tokensUsed: row.aiTokensUsed,
      lastUpdate: row.lastAiUpdate?.toISOString() ?? null,
    },
    audit: {
      lastEditedBy: row.lastEditedBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.service_city_content.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let body: any;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const content = body.content ?? {};
  const workflow = body.workflow ?? {};
  const userId = (session.user as any)?.id ?? null;
  const editor = userId ? `admin:${userId}` : 'admin';

  const data: any = {
    lastEditedBy: editor,
    source: 'manual',
  };

  if ('intro' in content) data.intro = content.intro ?? null;
  if ('whyChooseUs' in content) data.whyChooseUs = stringifyOrKeep(content.whyChooseUs);
  if ('popularVehicles' in content) data.popularVehicles = stringifyOrKeep(content.popularVehicles);
  if ('servicesOffered' in content) data.servicesOffered = stringifyOrKeep(content.servicesOffered);
  if ('faqs' in content) data.faqs = stringifyOrKeep(content.faqs);
  if ('tips' in content) data.tips = stringifyOrKeep(content.tips);
  if ('routes' in content) data.routes = stringifyOrKeep(content.routes);
  if ('metaTitle' in content) data.metaTitle = content.metaTitle ?? null;
  if ('metaDescription' in content) data.metaDescription = content.metaDescription ?? null;
  if ('metaKeywords' in content) data.metaKeywords = content.metaKeywords ?? null;
  if ('h1Heading' in content) data.h1Heading = content.h1Heading ?? null;

  if ('status' in workflow) {
    data.status = workflow.status;
    if (workflow.status === 'published' && !body.skipPublishAt) {
      data.publishedAt = new Date();
    }
  }
  if ('autoUpdate' in workflow) data.autoUpdate = Boolean(workflow.autoUpdate);

  const updated = await prisma.service_city_content.update({
    where: { id: params.id },
    data,
    select: { id: true, status: true, source: true, updatedAt: true, serviceSlug: true, citySlug: true },
  });

  try {
    revalidatePath(`/${updated.serviceSlug}/${updated.citySlug}`);
  } catch (err) {
    console.warn('revalidatePath failed', err);
  }

  return NextResponse.json({
    success: true,
    id: updated.id,
    status: updated.status,
    source: updated.source,
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const deleted = await prisma.service_city_content.delete({
    where: { id: params.id },
    select: { serviceSlug: true, citySlug: true },
  });

  try {
    revalidatePath(`/${deleted.serviceSlug}/${deleted.citySlug}`);
  } catch (err) {
    console.warn('revalidatePath failed', err);
  }

  return NextResponse.json({ success: true });
}
