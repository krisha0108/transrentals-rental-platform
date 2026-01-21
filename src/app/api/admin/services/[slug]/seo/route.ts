import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

function parseJsonField<T>(value: unknown, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return defaultValue; }
  }
  return value as T;
}

// GET - Get SEO settings for a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { slug } = resolvedParams;

    // Find the service by slug
    const service = await prisma.services.findUnique({
      where: { slug },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Parse SEO config from service.config JSON
    const config = parseJsonField<Record<string, any>>(service.config, {});
    const seoConfig = config.seo || {};

    // Default SEO structure
    const seo = {
      metaTitle: service.metaTitle || `${service.name} in India - Best Prices | TransRentals`,
      metaDescription: service.metaDescription || service.description,
      focusKeywords: seoConfig.focusKeywords || `${slug.replace(/-/g, ' ')}, ${service.name.toLowerCase()}`,
      canonicalUrl: seoConfig.canonicalUrl || `https://transrentals.in/${slug}`,
      ogTitle: seoConfig.ogTitle || service.name,
      ogDescription: seoConfig.ogDescription || service.description,
      ogImage: seoConfig.ogImage || '',
      robotsIndex: seoConfig.robotsIndex ?? true,
      robotsFollow: seoConfig.robotsFollow ?? true,
      schema: seoConfig.schema || JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: service.name,
        description: service.description,
        provider: {
          '@type': 'Organization',
          name: 'TransRentals',
        },
      }, null, 2),
    };

    return NextResponse.json({
      success: true,
      service: {
        id: service.id,
        name: service.name,
        slug: service.slug,
      },
      seo,
    });
  } catch (error: any) {
    logger.error('Service SEO error', error);
    return NextResponse.json(
      { error: 'Failed to fetch SEO settings', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update SEO settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { slug } = resolvedParams;
    const body = await request.json();

    // Find the service
    const service = await prisma.services.findUnique({
      where: { slug },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const {
      metaTitle,
      metaDescription,
      focusKeywords,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      robotsIndex,
      robotsFollow,
      schema,
    } = body;

    // Get existing config
    const existingConfig = parseJsonField<Record<string, any>>(service.config, {});

    // Build new SEO config
    const newSeoConfig = {
      focusKeywords,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      robotsIndex,
      robotsFollow,
      schema,
    };

    // Update service config
    const newConfig = {
      ...existingConfig,
      seo: newSeoConfig,
    };

    await prisma.services.update({
      where: { slug },
      data: {
        metaTitle: metaTitle || service.metaTitle,
        metaDescription: metaDescription || service.metaDescription,
        config: JSON.stringify(newConfig),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'SEO settings updated successfully',
    });
  } catch (error: any) {
    logger.error('Service SEO update error', error);
    return NextResponse.json(
      { error: 'Failed to update SEO settings', details: error?.message },
      { status: 500 }
    );
  }
}
