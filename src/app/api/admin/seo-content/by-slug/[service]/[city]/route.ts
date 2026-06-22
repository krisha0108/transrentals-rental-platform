/**
 * Convenience endpoint to GET / PUT / upsert a row by (serviceSlug, citySlug)
 * instead of by id — used by the admin edit page since it knows the slug pair
 * from the URL but not the row id.
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { SERVICE_LABELS } from '@/lib/ai/prompts/page-content';
import { buildCityContext } from '@/lib/ai/city-context';
import { getCityBySlug } from '@/data/indian-cities';

function parseJson<T = unknown>(s: string | null): T | null {
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}

function stringifyOrKeep(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function rowToPayload(row: any, citySlug: string, serviceSlug: string, dbName?: string) {
  const cityCtx = buildCityContext(citySlug);
  return {
    id: row?.id ?? null,
    serviceSlug,
    serviceLabel: SERVICE_LABELS[serviceSlug]?.label ?? serviceSlug,
    citySlug,
    cityName: cityCtx?.name ?? dbName ?? citySlug,
    cityState: cityCtx?.state ?? null,
    cityTier: cityCtx?.tier ?? null,
    cityTerrain: cityCtx?.terrain ?? null,
    exists: !!row,
    content: {
      intro: row?.intro ?? null,
      whyChooseUs: parseJson(row?.whyChooseUs) ?? [],
      popularVehicles: parseJson(row?.popularVehicles) ?? [],
      servicesOffered: parseJson(row?.servicesOffered) ?? [],
      faqs: parseJson(row?.faqs) ?? [],
      tips: parseJson(row?.tips) ?? [],
      routes: parseJson(row?.routes) ?? [],
      sectionsConfig: row?.sectionsConfig ?? null,
      metaTitle: row?.metaTitle ?? null,
      metaDescription: row?.metaDescription ?? null,
      metaKeywords: row?.metaKeywords ?? null,
      h1Heading: row?.h1Heading ?? null,
      pageHeading: row?.pageHeading ?? null,
      pageDescription: row?.pageDescription ?? null,
    },
    workflow: {
      status: row?.status ?? 'draft',
      source: row?.source ?? 'ai',
      autoUpdate: row?.autoUpdate ?? false,
      publishedAt: row?.publishedAt?.toISOString?.() ?? null,
    },
    ai: {
      model: row?.aiModel ?? null,
      prompt: row?.aiPrompt ?? null,
      tokensUsed: row?.aiTokensUsed ?? null,
      lastUpdate: row?.lastAiUpdate?.toISOString?.() ?? null,
    },
    audit: {
      lastEditedBy: row?.lastEditedBy ?? null,
      createdAt: row?.createdAt?.toISOString?.() ?? null,
      updatedAt: row?.updatedAt?.toISOString?.() ?? null,
    },
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { service: string; city: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(params.service in SERVICE_LABELS)) {
    return NextResponse.json({ error: `Unknown service "${params.service}"` }, { status: 404 });
  }

  const [dbLocation, row] = await Promise.all([
    prisma.locations.findFirst({
      where: { slug: params.city, isActive: true },
      select: { name: true },
    }),
    prisma.service_city_content.findUnique({
      where: { serviceSlug_citySlug: { serviceSlug: params.service, citySlug: params.city } },
    }),
  ]);

  if (!dbLocation && !getCityBySlug(params.city)) {
    return NextResponse.json({ error: `Unknown city "${params.city}"` }, { status: 404 });
  }

  return NextResponse.json(rowToPayload(row, params.city, params.service, dbLocation?.name));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { service: string; city: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const content = body.content ?? {};
  const workflow = body.workflow ?? {};
  const userId = (session.user as any)?.id ?? null;
  const editor = userId ? `admin:${userId}` : 'admin';

  const data: any = { lastEditedBy: editor, source: 'manual' };

  if ('intro' in content) data.intro = content.intro ?? null;
  if ('whyChooseUs' in content) data.whyChooseUs = stringifyOrKeep(content.whyChooseUs);
  if ('popularVehicles' in content) data.popularVehicles = stringifyOrKeep(content.popularVehicles);
  if ('servicesOffered' in content) data.servicesOffered = stringifyOrKeep(content.servicesOffered);
  if ('faqs' in content) data.faqs = stringifyOrKeep(content.faqs);
  if ('tips' in content) data.tips = stringifyOrKeep(content.tips);
  if ('routes' in content) data.routes = stringifyOrKeep(content.routes);
  if ('sectionsConfig' in content) data.sectionsConfig = stringifyOrKeep(content.sectionsConfig);
  if ('metaTitle' in content) data.metaTitle = content.metaTitle ?? null;
  if ('metaDescription' in content) data.metaDescription = content.metaDescription ?? null;
  if ('metaKeywords' in content) data.metaKeywords = content.metaKeywords ?? null;
  if ('h1Heading' in content) data.h1Heading = content.h1Heading ?? null;
  if ('pageHeading' in content) data.pageHeading = content.pageHeading ?? null;
  if ('pageDescription' in content) data.pageDescription = content.pageDescription ?? null;

  let statusToSet: string | undefined;
  if ('status' in workflow) {
    statusToSet = workflow.status;
    if (workflow.status === 'published') data.publishedAt = new Date();
  } else {
    statusToSet = 'manual_edited';
  }
  if (statusToSet) data.status = statusToSet;
  if ('autoUpdate' in workflow) data.autoUpdate = Boolean(workflow.autoUpdate);

  const [row, dbLocation] = await Promise.all([
    prisma.service_city_content.upsert({
      where: {
        serviceSlug_citySlug: { serviceSlug: params.service, citySlug: params.city },
      },
      create: { serviceSlug: params.service, citySlug: params.city, ...data },
      update: data,
    }),
    prisma.locations.findFirst({
      where: { slug: params.city, isActive: true },
      select: { name: true },
    }),
  ]);

  try {
    revalidatePath(`/${params.service}/${params.city}`);
  } catch (err) {
    console.warn('revalidatePath failed', err);
  }

  return NextResponse.json(rowToPayload(row, params.city, params.service, dbLocation?.name));
}
