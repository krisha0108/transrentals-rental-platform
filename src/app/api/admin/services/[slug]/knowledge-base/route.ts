import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
const getSettingKey = (slug: string) => `service_knowledge_base_${slug}`;

// GET - Fetch knowledge base for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const service = await prisma.services.findFirst({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const setting = await prisma.settings.findUnique({
      where: { key: getSettingKey(slug) },
    });

    const data = (setting?.value as any) || { articles: [], categories: [] };

    // Calculate article counts per category
    const categoriesWithCounts = (data.categories || []).map((cat: any) => ({
      ...cat,
      articleCount: (data.articles || []).filter((a: any) => a.chauffeur_vehicle_categories === cat.slug).length,
    }));

    return NextResponse.json({
      serviceName: service.name,
      articles: data.articles || [],
      categories: categoriesWithCounts,
    });
  } catch (error) {
    logger.error('Failed to fetch knowledge base', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge base' }, { status: 500 });
  }
}
