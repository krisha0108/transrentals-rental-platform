import { NextResponse } from 'next/server';
import { buildUrlsetXml, BASE_URL, SitemapEntry } from '@/lib/sitemap/utils';
import { prisma } from '@/lib/db/prisma';

// Revalidate every 30 minutes — stories publish often
export const revalidate = 1800;

export async function GET() {
  const entries: SitemapEntry[] = [
    { url: `${BASE_URL}/stories`, changeFrequency: 'daily', priority: 0.9 },
  ];

  try {
    const now = new Date();
    const stories = await prisma.web_stories.findMany({
      where: {
        isPublished: true,
        isArchived: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { slug: true, publishedAt: true, updatedAt: true },
      orderBy: { publishedAt: 'desc' },
    });

    for (const s of stories) {
      const lastmod = s.updatedAt ?? s.publishedAt ?? undefined;

      // Only the AMP URL — it is the canonical, indexable web story. The React
      // viewer at /stories/{slug} canonicalises to this, so listing both would
      // submit a duplicate/non-canonical URL and confuse indexing.
      entries.push({
        url:             `${BASE_URL}/stories/${s.slug}/amp`,
        lastModified:    lastmod,
        changeFrequency: 'weekly',
        priority:        0.9,
      });
    }
  } catch (err) {
    console.error('[sitemap-stories] DB error:', err);
  }

  if (entries.length === 0) {
    return new NextResponse('Stories sitemap temporarily unavailable', {
      status: 503,
      headers: { 'Retry-After': '3600' },
    });
  }

  const xml = buildUrlsetXml(entries);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600',
    },
  });
}
