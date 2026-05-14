import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { SERVICE_LABELS } from '@/lib/ai/prompts/page-content';

function countJson(field: string | null): number {
  if (!field) return 0;
  try {
    const parsed = JSON.parse(field);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const serviceSlug = searchParams.get('service') || undefined;
  const citySearch = searchParams.get('city') || undefined;
  const status = searchParams.get('status') || undefined;
  const source = searchParams.get('source') || undefined;
  const autoUpdate = searchParams.get('autoUpdate');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

  const where: any = {};
  if (serviceSlug) where.serviceSlug = serviceSlug;
  if (citySearch) where.citySlug = { contains: citySearch };
  if (status) where.status = status;
  if (source) where.source = source;
  if (autoUpdate === 'true') where.autoUpdate = true;
  if (autoUpdate === 'false') where.autoUpdate = false;

  const [rows, total] = await Promise.all([
    prisma.service_city_content.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        serviceSlug: true,
        citySlug: true,
        intro: true,
        whyChooseUs: true,
        popularVehicles: true,
        servicesOffered: true,
        faqs: true,
        tips: true,
        metaTitle: true,
        h1Heading: true,
        status: true,
        source: true,
        autoUpdate: true,
        aiModel: true,
        aiTokensUsed: true,
        lastAiUpdate: true,
        lastEditedBy: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.service_city_content.count({ where }),
  ]);

  const formatted = rows.map((r) => ({
    id: r.id,
    serviceSlug: r.serviceSlug,
    serviceLabel: SERVICE_LABELS[r.serviceSlug]?.label ?? r.serviceSlug,
    citySlug: r.citySlug,
    introLength: r.intro?.length ?? 0,
    introPreview: r.intro?.slice(0, 120) ?? '',
    counts: {
      whyChooseUs: countJson(r.whyChooseUs),
      popularVehicles: countJson(r.popularVehicles),
      servicesOffered: countJson(r.servicesOffered),
      faqs: countJson(r.faqs),
      tips: countJson(r.tips),
    },
    metaTitle: r.metaTitle,
    h1Heading: r.h1Heading,
    status: r.status,
    source: r.source,
    autoUpdate: r.autoUpdate,
    aiModel: r.aiModel,
    aiTokensUsed: r.aiTokensUsed,
    lastAiUpdate: r.lastAiUpdate?.toISOString() ?? null,
    lastEditedBy: r.lastEditedBy,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  const statusCounts = await prisma.service_city_content.groupBy({
    by: ['status'],
    where: serviceSlug ? { serviceSlug } : undefined,
    _count: { _all: true },
  });

  return NextResponse.json({
    rows: formatted,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all])),
    knownServices: Object.entries(SERVICE_LABELS).map(([slug, { label }]) => ({ slug, label })),
  });
}
