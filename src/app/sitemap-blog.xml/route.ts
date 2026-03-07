import { NextResponse } from 'next/server';
import { buildUrlsetXml, BASE_URL, SitemapEntry, escapeXml } from '@/lib/sitemap/utils';
import { prisma } from '@/lib/db/prisma';
import { blogTags } from '@/data/blog-posts';

// Revalidate every hour — new blogs show up quickly
export const revalidate = 3600;

export async function GET() {
  const entries: SitemapEntry[] = [
    // Blog listing pages
    { url: `${BASE_URL}/blog`,          changeFrequency: 'daily',  priority: 0.9 },
    { url: `${BASE_URL}/blog/search`,   changeFrequency: 'monthly', priority: 0.4 },
  ];

  try {
    // Published blog posts
    const posts = await prisma.blog_posts.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true, serviceSlug: true },
      orderBy: { publishedAt: 'desc' },
    });

    // Individual post pages
    for (const post of posts) {
      entries.push({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    // Service-specific blog listing pages
    const serviceSlugs = [...new Set(posts.map((p) => p.serviceSlug).filter(Boolean))];
    for (const slug of serviceSlugs) {
      entries.push({
        url: `${BASE_URL}/blog/service/${slug}`,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }

    // Blog category pages
    const categories = await prisma.blog_categories.findMany({
      select: { slug: true, updatedAt: true },
    });
    for (const cat of categories) {
      entries.push({
        url: `${BASE_URL}/blog/category/${cat.slug}`,
        lastModified: cat.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } catch {
    // DB unavailable — return just static entries
  }

  // Blog tag pages (static data)
  for (const tag of blogTags) {
    entries.push({
      url: `${BASE_URL}/blog/tag/${tag.slug}`,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }

  return new NextResponse(buildUrlsetXml(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
