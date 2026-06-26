import { NextRequest, NextResponse } from 'next/server';
import { searchBlogPostsPrisma } from '@/lib/api/blog-prisma';
import { getPostBySlug, searchPosts } from '@/data/blog-posts';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '50');

  if (!query.trim()) {
    return NextResponse.json({ posts: [] });
  }

  try {
    // Get DB posts
    const dbPosts = await searchBlogPostsPrisma(query, limit);

    // Get mock posts (fallback/supplement)
    const mockPosts = searchPosts(query);

    // DB takes priority — deduplicate by slug
    const dbSlugs = new Set(dbPosts.map((p) => p.slug));
    const uniqueMockPosts = mockPosts.filter((p) => !dbSlugs.has(p.slug));

    const combined = [...dbPosts, ...uniqueMockPosts].slice(0, limit);

    // Cache identical search queries briefly — repeat searches load instantly
    // (browser) and are CDN-cached in production.
    return NextResponse.json(
      { posts: combined },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' } },
    );
  } catch (error) {
    console.error('Blog search error:', error);
    // Fallback to mock only
    const mockPosts = searchPosts(query).slice(0, limit);
    return NextResponse.json({ posts: mockPosts });
  }
}
